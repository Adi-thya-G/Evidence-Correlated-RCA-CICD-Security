// services/explainClusters.ts
import { Types, Schema, model } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { Correlation } from './correlate';
import { explainRootCause, LLM_MODEL, type ClusterContext, type RootCause } from './llm';

const DELAY_BETWEEN_CALLS_MS = Number(process.env.LLM_DELAY_MS ?? 2000);

/* ------------------------------------------------------------------ *
 * EDIT THESE 6 ADAPTERS to match your Finding model's field names.
 * I only saw: tool, file, vectorId, status, git_diff, raw.
 * NOTE: `commitSha` on a finding is probably the SCANNED commit, not the
 * commit that introduced the line, so it is deliberately not used here.
 * ------------------------------------------------------------------ */
const blameSha = (f: any): string | undefined =>
  f.blame?.commit ?? f.blame_commit ?? f.git_blame?.commit ?? f.introducedBy?.sha;
const blameAuthor = (f: any): string => f.blame?.author ?? f.blame_author ?? f.git_blame?.author ?? 'unknown';
const diffOf = (f: any): string => f.git_diff ?? '';
const windowOf = (f: any): string => f.code_window ?? f.codeWindow ?? f.evidence?.codeWindow ?? '';
const ruleOf = (f: any): string => f.ruleId ?? f.rule ?? f.rule_id ?? 'unknown-rule';
const cweOf = (f: any): string | undefined => f.cwe ?? f.cweId;
const lineOf = (f: any): number => f.line ?? f.startLine ?? 0;
const msgOf = (f: any): string => f.message ?? f.title ?? '';

/* ---------------- stored result ---------------- */
const RootCauseResultSchema = new Schema(
  {
    clusterId: { type: String, unique: true, index: true },
    accountId: Schema.Types.ObjectId,
    repo_id: Number,
    commitSha: String,
    root_cause: String,
    culprit_commit: String,
    confidence: Number,
    fix_suggestion: String,
    evidence_used: [String],
    hallucinatedCommit: Boolean,
    model: String,
  },
  { timestamps: true }
);
export const RootCauseResult = model('RootCauseResult', RootCauseResultSchema);

/* ---------------- commit ranking ---------------- */
// Each finding's weight = mean score of the correlation edges touching it.
// A commit's score = share of total weight carried by findings blamed on it.
function rankCandidateCommits(findings: any[], edges: any[]) {
  const weight = new Map<string, number>();
  const count = new Map<string, number>();
  for (const e of edges) {
    for (const id of [String(e.a), String(e.b)]) {
      weight.set(id, (weight.get(id) ?? 0) + e.score);
      count.set(id, (count.get(id) ?? 0) + 1);
    }
  }

  const byCommit = new Map<string, { author: string; diff: string; sum: number }>();
  let total = 0;
  for (const f of findings) {
    const sha = blameSha(f);
    if (!sha) continue;
    const id = String(f._id);
    const w = (weight.get(id) ?? 0) / Math.max(1, count.get(id) ?? 1) || 0.1;
    total += w;
    const cur = byCommit.get(sha) ?? { author: blameAuthor(f), diff: diffOf(f), sum: 0 };
    cur.sum += w;
    if (!cur.diff) cur.diff = diffOf(f);
    byCommit.set(sha, cur);
  }

  return [...byCommit.entries()]
    .map(([sha, v]) => ({ sha, author: v.author, diff: v.diff, score: total ? v.sum / total : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ---------------- load contexts ---------------- */
export async function loadClusterContexts(
  accountId: string,
  repo_id: number,
  commitSha: string
): Promise<ClusterContext[]> {
  const acc = new Types.ObjectId(accountId);
  const clusters: any[] = await Correlation.find({ accountId: acc, repo_id, commitSha }).lean();
  if (!clusters.length) return [];

  // Skip clusters already explained (safe on Kafka redelivery).
  const existing = await RootCauseResult.find({ clusterId: { $in: clusters.map((c) => c.clusterId) } })
    .select('clusterId')
    .lean();
  const done = new Set(existing.map((e: any) => e.clusterId));

  const contexts: ClusterContext[] = [];
  for (const c of clusters) {
    if (done.has(c.clusterId)) continue;

    const findings: any[] = await Finding.find({ _id: { $in: c.findingIds } }).select('-raw').lean();
    if (!findings.length) continue;

    const candidateCommits = rankCandidateCommits(findings, c.edges ?? []);
    if (!candidateCommits.length) {
      console.warn(`[explain] cluster ${c.clusterId}: no blame commit on any finding, skipping`);
      continue;
    }

    contexts.push({
      clusterId: c.clusterId,
      findings: findings.map((f) => ({
        tool: f.tool,
        ruleId: ruleOf(f),
        cwe: cweOf(f),
        file: f.file,
        line: lineOf(f),
        message: msgOf(f),
      })),
      candidateCommits,
      codeWindow: findings.map(windowOf).find(Boolean) ?? '',
    });
  }
  return contexts;
}

export async function saveRootCause(
  meta: { accountId: string; repo_id: number; commitSha: string; clusterId: string },
  result: RootCause,
  hallucinatedCommit: boolean
) {
  await RootCauseResult.updateOne(
    { clusterId: meta.clusterId },
    {
      $set: {
        ...result,
        accountId: new Types.ObjectId(meta.accountId),
        repo_id: meta.repo_id,
        commitSha: meta.commitSha,
        hallucinatedCommit,
        model: LLM_MODEL,
      },
    },
    { upsert: true }
  );
}

/* ---------------- main entry ---------------- */
export async function explainClusters(
  accountId: string,
  repo_id: number,
  commitSha: string
): Promise<number> {
  const contexts = await loadClusterContexts(accountId, repo_id, commitSha);
  let done = 0;

  for (const ctx of contexts) { // sequential on purpose: free tiers rate-limit
    try {
      const result = await explainRootCause(ctx);
      const valid = new Set(ctx.candidateCommits.map((c) => c.sha));
      await saveRootCause(
        { accountId, repo_id, commitSha, clusterId: ctx.clusterId },
        result,
        !valid.has(result.culprit_commit) // report this rate in the paper
      );
      done++;
    } catch (err) {
      console.error(`[explain] LLM failed for cluster ${ctx.clusterId}:`, err);
    }
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
  }
  return done;
}