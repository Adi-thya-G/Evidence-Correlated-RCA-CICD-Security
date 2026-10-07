import { Schema, model, Types } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { Correlation } from './correlate';

const SEV: Record<string, number> = {
  BLOCKER: 1, CRITICAL: 1, HIGH: 1, MAJOR: 0.7, MEDIUM: 0.5, MINOR: 0.3, LOW: 0.3, INFO: 0.1,
};
const sevOf = (s?: string) => SEV[(s ?? '').toUpperCase()] ?? 0.3;

// weights sum to 1; tune against labeled clusters for the paper
export const RANK_WEIGHTS = {
  coverage: 0.35,      // share of the cluster's findings blamed on this commit
  severity: 0.15,      // share of the cluster's severity weight
  toolAgreement: 0.15, // distinct tools pointing at this commit / tools in cluster
  diffTouches: 0.20,   // the commit's diff touches the flagged file
  earliness: 0.15,     // earlier commits are more likely the introducer
} as const;

const RootCauseSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, index: true },
  repo_id: { type: Number, index: true },
  commitSha: String,                  // the scan's commit
  clusterId: { type: String, index: true },
  topCommit: String,
  margin: Number,                     // top score minus runner-up (rough confidence)
  candidates: [{
    commitHash: String, author: String, date: Date, summary: String,
    score: Number, findingIds: [Schema.Types.ObjectId],
    breakdown: {
      coverage: Number, severity: Number, toolAgreement: Number,
      diffTouches: Number, earliness: Number,
    },
  }],
  llm: Schema.Types.Mixed,            // filled later by the LLM step
  createdAt: { type: Date, default: Date.now },
});
export const RootCause = model('RootCause', RootCauseSchema);

export function rankCluster(findings: any[]) {
  const byCommit = new Map<string, any[]>();
  for (const f of findings) {
    if (!f.git_commit_hash) continue;
    byCommit.set(f.git_commit_hash, [...(byCommit.get(f.git_commit_hash) ?? []), f]);
  }
  if (!byCommit.size) return [];

  const total = findings.length;
  const totalSev = findings.reduce((s, f) => s + sevOf(f.severity), 0) || 1;
  const clusterTools = new Set(findings.map((f) => f.tool)).size || 1;

  const times = [...byCommit.values()].map((fs) => new Date(fs[0].git_commit_date).getTime());
  const tMin = Math.min(...times), tMax = Math.max(...times);

  return [...byCommit.entries()].map(([hash, fs]) => {
    const t = new Date(fs[0].git_commit_date).getTime();
    const breakdown = {
      coverage: fs.length / total,
      severity: fs.reduce((s, f) => s + sevOf(f.severity), 0) / totalSev,
      toolAgreement: new Set(fs.map((f) => f.tool)).size / clusterTools,
      diffTouches: fs.some((f) => f.diffTouchesFile) ? 1 : 0,
      earliness: tMax === tMin ? 1 : 1 - (t - tMin) / (tMax - tMin),
    };
    const score = (Object.keys(RANK_WEIGHTS) as (keyof typeof RANK_WEIGHTS)[])
      .reduce((s, k) => s + RANK_WEIGHTS[k] * breakdown[k], 0);
    return {
      commitHash: hash, author: fs[0].git_author, date: fs[0].git_commit_date,
      summary: fs[0].git_commit_summary, score, breakdown,
      findingIds: fs.map((f) => f._id),
    };
  }).sort((a, b) => b.score - a.score);
}

export async function rankCommitsForScan(accountId: string, repo_id: number, commitSha: string) {
  const acc = new Types.ObjectId(accountId);
  const clusters: any[] = await Correlation.find({ accountId: acc, repo_id, commitSha }).lean();
  if (!clusters.length) return 0;

  const ids = [...new Set(clusters.flatMap((c) => c.findingIds.map(String)))];
  const rows: any[] = await Finding.find({ _id: { $in: ids } })
    .select('tool severity file git_commit_hash git_author git_commit_date git_commit_summary git_diff')
    .lean();

  // compute the diff signal once, then drop the large diff text
  const byId = new Map(rows.map((r) => {
    const diffTouchesFile = !!(r.git_diff && r.file && r.git_diff.includes(r.file));
    const { git_diff, ...rest } = r;
    return [String(r._id), { ...rest, diffTouchesFile }];
  }));

  const docs = clusters.map((c) => {
    const candidates = rankCluster(c.findingIds.map((i: any) => byId.get(String(i))).filter(Boolean));
    const [top, second] = candidates;
    return {
      accountId: acc, repo_id, commitSha, clusterId: c.clusterId,
      topCommit: top?.commitHash ?? null,
      margin: top ? top.score - (second?.score ?? 0) : 0,
      candidates,
    };
  });

  await RootCause.deleteMany({ accountId: acc, repo_id, commitSha });  // idempotent re-run
  await RootCause.insertMany(docs);
  return docs.length;
}