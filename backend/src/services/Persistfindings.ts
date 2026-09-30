// src/services/persistFindings.ts
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { sonarComponentToGitPath } from '@utils/gitEvidence/pathUtils';
import type { EnrichedFinding } from '../types/gitEvidence.types';

/**
 * Stable identity for a finding: same tool + rule + file + lines (+ package for SCA)
 * always gives the same hash, so re-processing a Kafka message updates
 * the existing row instead of inserting a duplicate.
 */
export function buildFingerprint(f: EnrichedFinding): string {
  const any = f as any;
  const parts = [
    any.tool ?? '',
    any.category ?? '',
    any.ruleId ?? any.rule ?? '',
    f.file ? sonarComponentToGitPath(f.file) : '',
    f.startLine ?? '',
    f.endLine ?? '',
    any.pkgName ?? '',
  ];
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
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

  const ops = enriched.map((f) => {
    const fingerprint = buildFingerprint(f);
    return {
      updateOne: {
        filter: { accountId: accountObjectId, repo_id, commitSha, fingerprint },
        update: {
          $set: {
            ...f,
            // normalise the path so it is always repo-relative
            file: f.file ? sonarComponentToGitPath(f.file) : f.file,
            accountId: accountObjectId,
            repo_id,
            commitSha,
            fingerprint,
            enrichedAt: new Date(),
          },
          // only set on first insert, so a reprocess doesn't reset a finished embedding
          $setOnInsert: { embeddingStatus: 'pending' },
        },
        upsert: true,
      },
    };
  });

  const res = await Finding.bulkWrite(ops, { ordered: false });
  return { upserted: res.upsertedCount, modified: res.modifiedCount };
}