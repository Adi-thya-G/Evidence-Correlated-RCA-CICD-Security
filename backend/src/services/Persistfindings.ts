import crypto from 'crypto';
import { Types } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { sonarComponentToGitPath } from '@utils/gitEvidence/pathUtils';
import type { EnrichedFinding } from '../types/gitEvidence.types';
import { buildEmbedText, embedHash } from './embedText';
import { qdrant } from './qdrant';

/**
 * Stable identity: tool + category + rule + file + package + message.
 * No line numbers and no commit, so the same issue keeps the same
 * fingerprint across commits and is only re-embedded if its text changed.
 */
export function buildFingerprint(f: EnrichedFinding): string {
  const a = f as any;
  return crypto.createHash('sha1').update([
    a.tool ?? '',
    a.category ?? '',
    a.ruleId ?? a.rule ?? '',
    f.file ? sonarComponentToGitPath(f.file) : '',
    a.pkgName ?? '',
    f.message ?? '',
    a.codeSnippet ? crypto.createHash('sha1').update(a.codeSnippet).digest('hex') : '',
  ].join('|')).digest('hex');
}

interface PersistContext {
  accountId: string;
  repo_id: number;
  commitSha: string;
}

export async function persistEnrichedFindings(
  enriched: EnrichedFinding[],
  { accountId, repo_id, commitSha }: PersistContext
): Promise<{ upserted: number; modified: number }> {
  if (enriched.length === 0) return { upserted: 0, modified: 0 };

  const accountObjectId = new Types.ObjectId(accountId);

  // De-duplicate within the batch (same fingerprint twice would race on upsert)
  const byPrint = new Map<string, EnrichedFinding>();
  for (const f of enriched) byPrint.set(buildFingerprint(f), f);
  const prints = [...byPrint.keys()];

  // What do we already have, and with which embedding hash?
  const existing = await Finding.find({
    accountId: accountObjectId, repo_id, fingerprint: { $in: prints },
  }).select('fingerprint embeddingHash').lean();
  const known = new Map<string, string | undefined>(
    existing.map((e: any) => [e.fingerprint, e.embeddingHash])
  );

  const ops = prints.map((fingerprint) => {
    const f = byPrint.get(fingerprint)!;
    const needsEmbed = known.get(fingerprint) !== embedHash(buildEmbedText(f));

    return {
      updateOne: {
        filter: { accountId: accountObjectId, repo_id, fingerprint }, // no commitSha
        update: {
          $set: {
            ...f,
            file: f.file ? sonarComponentToGitPath(f.file) : f.file,
            accountId: accountObjectId,
            repo_id,
            fingerprint,
            commitSha,                 // latest commit that reported it
            lastSeenCommit: commitSha,
            status: 'OPEN',
            enrichedAt: new Date(),
            ...(needsEmbed ? { embeddingStatus: 'pending' } : {}),
          },
          $setOnInsert: { firstSeenCommit: commitSha },
        },
        upsert: true,
      },
    };
  });

  const res = await Finding.bulkWrite(ops, { ordered: false });
  return { upserted: res.upsertedCount, modified: res.modifiedCount };
}

/**
 * Call after persisting a full scan of one tool for a repo.
 * Anything OPEN that this scan did not report is marked RESOLVED
 * (kept, not deleted, so history stays available for retrieval).
 */
export async function markResolved(
  accountId: string, repo_id: number, tool: string, commitSha: string
) {
  const accountObjectId = new Types.ObjectId(accountId);
  const filter = {
    accountId: accountObjectId, repo_id, tool,
    status: 'OPEN', lastSeenCommit: { $ne: commitSha },
  };

  const stale = await Finding.find(filter).select('vectorId').lean();
  if (!stale.length) return 0;

  await Finding.updateMany(filter, { $set: { status: 'RESOLVED', resolvedAt: new Date() } });

  const ids = stale.map((s: any) => s.vectorId).filter(Boolean);
  if (ids.length) {
    await qdrant.setPayload('findings', { payload: { status: 'RESOLVED' }, points: ids, wait: true });
  }
  return stale.length;
}