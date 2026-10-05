import { v5 as uuidv5 } from 'uuid';
import { Types } from 'mongoose';
import { Finding } from '@modules/finding.models';
import { qdrant, COLLECTION } from './qdrant';
import { buildEmbedText, embedHash, EMBED_VERSION } from './embedText';
import { embedBatch } from './embedder';

const NS = '6f1d3c1e-0b5a-4b7e-9d8e-2c4f5a6b7c8d';
const BATCH = 100;

export async function embedPendingFindings(accountId: string, repo_id: number) {
  const acc = new Types.ObjectId(accountId);

  for (;;) {
    const docs = await Finding.find({ accountId: acc, repo_id, embeddingStatus: 'pending' })
      .limit(BATCH).lean();
    if (!docs.length) break;

    try {
      const items = docs.map((d: any) => {
        const text = buildEmbedText(d);
        return {
          d, text, hash: embedHash(text),
          id: uuidv5(`${accountId}:${repo_id}:${d.fingerprint}`, NS), // deterministic
        };
      });

      // Skip points whose hash already matches what Qdrant holds
      const found = await qdrant.retrieve(COLLECTION, {
        ids: items.map(i => i.id), with_payload: ['embeddingHash'], with_vector: false,
      });
      const have = new Map(found.map(p => [String(p.id), (p.payload as any)?.embeddingHash]));
      const changed = items.filter(i => have.get(i.id) !== i.hash);

      if (changed.length) {
        const vectors = await embedBatch(changed.map(i => i.text));
        await qdrant.upsert(COLLECTION, {
          wait: true,
          points: changed.map((i, n) => ({
            id: i.id,
            vector: vectors[n],
            payload: {
              mongoId: String(i.d._id),
              accountId, repo_id,
              tool: i.d.tool, category: i.d.category,
              rule: i.d.ruleId ?? i.d.rule, severity: i.d.severity,
              file: i.d.file, startLine: i.d.startLine, endLine: i.d.endLine,
              commitSha: i.d.commitSha,
              status: 'OPEN',
              embeddingHash: i.hash,
            },
          })),
        });
      }

      await Finding.bulkWrite(items.map(i => ({
        updateOne: {
          filter: { _id: i.d._id },
          update: { $set: {
            embeddingStatus: 'done', embeddingHash: i.hash,
            embedVersion: EMBED_VERSION, vectorId: i.id,
          } },
        },
      })));
    } catch (err) {
      await Finding.updateMany(
        { _id: { $in: docs.map((d: any) => d._id) } },
        { $set: { embeddingStatus: 'failed' } }
      );
      throw err;
    }
  }
}