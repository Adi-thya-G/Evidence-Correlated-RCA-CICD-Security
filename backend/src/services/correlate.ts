import { Types, Schema, model } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { qdrant, COLLECTION } from './qdrant';
import { scorePair, THRESHOLD } from './correlationScore';   // THRESHOLD = final pair-score cutoff (backend only)
import { getCorrelationCfg } from './settingsService';

const CorrelationSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, index: true },
  repo_id: { type: Number, index: true },
  commitSha: String,
  clusterId: String,
  findingIds: [Schema.Types.ObjectId],
  size: Number,
  avgScore: Number,
  tools: [String],
  files: [String],
  edges: [{ a: Schema.Types.ObjectId, b: Schema.Types.ObjectId, score: Number, signals: [String] }],
  settings: { topK: Number, similarityThreshold: Number },   // settings used, for reproducibility
  createdAt: { type: Date, default: Date.now },
});
export const Correlation = model('Correlation', CorrelationSchema);

class UnionFind {
  p = new Map<string, string>();
  find(x: string): string {
    if (!this.p.has(x)) this.p.set(x, x);
    const px = this.p.get(x)!;
    if (px === x) return x;
    const r = this.find(px); this.p.set(x, r); return r;
  }
  union(a: string, b: string) { this.p.set(this.find(a), this.find(b)); }
}

export async function correlateFindings(
  accountId: string,
  repo_id: number,
  commitSha: string,
  override?: Partial<{ topK: number; similarityThreshold: number }>  // optional, for UI preview
) {
  // user's saved settings, with an optional per-call override
  const base = await getCorrelationCfg(accountId);
  const cfg = {
    topK: override?.topK ?? base.topK,
    similarityThreshold: override?.similarityThreshold ?? base.similarityThreshold,
  };
  console.log(`[correlate] account=${accountId} repo=${repo_id} topK=${cfg.topK} sim>=${cfg.similarityThreshold}`);

  const acc = new Types.ObjectId(accountId);
  const docs: any[] = await Finding.find({
    accountId: acc, repo_id, status: 'OPEN', embeddingStatus: 'done',
  }).select('-git_diff -raw').lean();
  if (docs.length < 2) return 0;

  const byVid = new Map(docs.map(d => [d.vectorId, d]));
  const byId = new Map(docs.map(d => [String(d._id), d]));

  // 1. fetch stored vectors (no re-embedding)
  const vecs = new Map<string, number[]>();
  for (let i = 0; i < docs.length; i += 200) {
    const pts = await qdrant.retrieve(COLLECTION, {
      ids: docs.slice(i, i + 200).map(d => d.vectorId),
      with_vector: true, with_payload: false,
    });
    pts.forEach(p => vecs.set(String(p.id), p.vector as number[]));
  }

  // 2. Top-K neighbours using the user's settings, filtered to this account and repo
  const filter = { must: [
    { key: 'accountId', match: { value: accountId } },
    { key: 'repo_id', match: { value: repo_id } },
  ] };
const withVec = docs.filter(d => vecs.has(d.vectorId));

const results = await qdrant.queryBatch(COLLECTION, {
  searches: withVec.map(d => ({
    query: vecs.get(d.vectorId)!,            // was `vector`
    limit: cfg.topK + 1,                     // +1 because a finding matches itself
    filter,
    with_payload: false,
    score_threshold: cfg.similarityThreshold,
  })),
});;

  // 3. candidate pairs: vector neighbours + same-file findings
  const sims = new Map<string, number>();
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
 withVec.forEach((d, i) => {
  for (const hit of results[i]?.points) {     // was results[i]
    const n = byVid.get(String(hit.id));
    if (!n || String(n._id) === String(d._id)) continue;
    sims.set(key(String(d._id), String(n._id)), hit.score);
  }
});
  const byFile = new Map<string, any[]>();
  docs.forEach(d => d.file && byFile.set(d.file, [...(byFile.get(d.file) ?? []), d]));
  for (const group of byFile.values())
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const k = key(String(group[i]._id), String(group[j]._id));
        if (!sims.has(k)) sims.set(k, 0);
      }

  // 4. score pairs, cluster those above the pair-score threshold
  const uf = new UnionFind();
  const edges: any[] = [];
  for (const [k, sim] of sims) {
    const [ia, ib] = k.split('|');
    const { score, signals } = scorePair(byId.get(ia), byId.get(ib), sim);
    if (score >= THRESHOLD) {
      uf.union(ia, ib);
      edges.push({ a: ia, b: ib, score, signals });
    }
  }

  // 5. build clusters (size >= 2) and store
  const groups = new Map<string, string[]>();
  for (const e of edges) for (const id of [e.a, e.b]) {
    const root = uf.find(id);
    const arr = groups.get(root) ?? [];
    if (!arr.includes(id)) arr.push(id);
    groups.set(root, arr);
  }

  const clusters = [...groups.entries()].map(([root, ids]) => {
    const ce = edges.filter(e => uf.find(e.a) === root);
    return {
      accountId: acc, repo_id, commitSha,
      clusterId: `${repo_id}:${commitSha.slice(0, 7)}:${root.slice(-6)}`,
      findingIds: ids.map(i => new Types.ObjectId(i)),
      size: ids.length,
      avgScore: ce.reduce((s, e) => s + e.score, 0) / ce.length,
      tools: [...new Set(ids.map(i => byId.get(i).tool))],
      files: [...new Set(ids.map(i => byId.get(i).file))],
      edges: ce,
      settings: cfg,
    };
  });

  await Correlation.deleteMany({ accountId: acc, repo_id, commitSha }); // idempotent re-run
  if (clusters.length) await Correlation.insertMany(clusters);
  return clusters.length;
}