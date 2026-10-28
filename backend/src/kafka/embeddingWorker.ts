import { kafka } from './client'; // adjust to your actual kafka client import
import { persistEnrichedFindings } from '@services/Persistfindings';
import { SonarDataFetch } from '@modules/SonarDataFetch';
import { ensureRepoCheckedOut } from '@utils/gitEvidence/repoManager';
import { collectEvidenceForFindings } from '@utils/gitEvidence/evidenceCollector';
import type { ProducerMessage, NormalizedFinding } from '../types/gitEvidence.types';
import { notify } from '@utils/notify';
import { embedPendingFindings } from '@services/embedPending';
import { markResolved } from '@services/Persistfindings';
import { EMBED_DIM } from '@services/embedder';
import { initQdrant } from '@services/qdrant';
import { correlateFindings } from '@services/correlate';

// ===== [NEW-1] LLM root-cause step (remove this import + [NEW-5] to disable) =====
import { explainClusters } from '@services/explainClusters';
// ===== [END NEW-1] =====

const consumer = kafka.consumer({ groupId: 'embedding-workers' });

// ===== [NEW-2] Dead-letter queue (remove this block + [NEW-6] to disable) =====
// Failed messages are copied to this topic instead of being lost.
// Create the topic first, or enable auto-create on your broker.
const producer = kafka.producer();
const DLQ_TOPIC = 'raw-findings-dlq';
async function sendToDlq(rawValue: string | null, key: string | null, err: unknown) {
  try {
    await producer.send({
      topic: DLQ_TOPIC,
      messages: [{ key, value: rawValue ?? '', headers: { error: String((err as Error)?.message ?? err).slice(0, 500) } }],
    });
  } catch (dlqErr) {
    console.error(`[key=${key}] Failed to publish to DLQ:`, dlqErr);
  }
}
// ===== [END NEW-2] =====

// Per-message git-evidence concurrency. Kept low deliberately: Kafka already
// processes up to `partitionsConsumedConcurrently` messages at once, and each
// message can itself spawn several git subprocesses. Multiply the two and
// keep the product within what the pod's CPU allocation can handle.
const PER_MESSAGE_GIT_CONCURRENCY = 2;

export async function startEmbeddingWorker() {
  await initQdrant(EMBED_DIM);
  await consumer.connect();
  // [NEW-2b] needed only for the DLQ producer
  await producer.connect();
  await consumer.subscribe({ topic: 'raw-findings', fromBeginning: false });

  await consumer.run({
    partitionsConsumedConcurrently: 3,
    eachMessage: async ({ message }) => {
      const key = message.key ? message.key.toString() : null;

      // [NEW-6a] hoisted so the catch block can use them (remove with [NEW-6])
      let installationIdForError: any;
      let rawForDlq: string | null = null;

      try {
        const raw = message.value ? message.value.toString() : null;
        rawForDlq = raw; // [NEW-6a]
        if (!raw) {
          console.warn('Received message with empty value, skipping. key=', key);
          return;
        }

        const payload = JSON.parse(raw) as ProducerMessage & { tool?: string };

        // ORIGINAL (prints cloneUrl, which may contain a token):
        // console.log(`[key=${key}] tool=${payload.tool}`, payload);
        // ===== [NEW-3] safe log =====
        console.log(`[key=${key}] tool=${payload.tool} repo_id=${payload.repo_id} commit=${payload.commitSha}`);
        // ===== [END NEW-3] =====

        const { accountId, repo_id, commitSha, installationId, cloneUrl } = payload ?? {};
        installationIdForError = installationId; // [NEW-6a]

        if (!accountId || !repo_id || !commitSha || !installationId || !cloneUrl) {
          throw new Error(
            'One or more required fields missing: accountId, repo_id, commitSha, installationId, cloneUrl'
          );
        }
        await notify(installationId, {
          type: 'correlation',
          title: 'Root Cause Analysis Started',
          message: 'Findings are being correlated with commits to identify root causes.',
        });

        // 1. Ensure a local, full-history clone exists at the exact commit
        //    the scanner ran against. The returned `git` is rooted at
        //    data/installations/{installationId}/{repoId}/repo, so all file
        //    paths given to it must be repo-relative.
        const git = await ensureRepoCheckedOut(installationId, repo_id, cloneUrl, commitSha);

        // 2. Pull the SonarQube issues tied to this specific commit's analysis.
        const sonarIssues = (await SonarDataFetch({
          accountId,
          repo_id,
          commitSha,
        })) as NormalizedFinding[];

        if (sonarIssues.length === 0) {
          console.log(`[key=${key}] No matched SonarQube issues for commit=${commitSha}`);
          // ===== [NEW-4] still resolve findings when a commit fixes everything =====
          const resolvedEmpty = await markResolved(accountId, repo_id, 'sonarqube', commitSha);
          console.log(`[key=${key}] Resolved ${resolvedEmpty} findings`);
          // ===== [END NEW-4] =====
          return;
        }

        // 3. Enrich with git blame / diff / commit evidence.
        //    NOTE: signature is (git, findings, commitSha, concurrency).
        const enriched = await collectEvidenceForFindings(
          git,
          sonarIssues,
          commitSha,
          PER_MESSAGE_GIT_CONCURRENCY
        );

        console.log(`[key=${key}] Enriched ${enriched.length} findings for repo_id=${repo_id}`);

        // 4. Persist to MongoDB
        const result = await persistEnrichedFindings(enriched, { accountId, repo_id, commitSha });
        console.log(`[key=${key}] Saved findings: ${result.upserted} new, ${result.modified} updated`);

        // 5. Embed only new/changed findings into Qdrant
        await embedPendingFindings(accountId, repo_id );

        // 6. Resolve findings that vanished (Sonar scan is complete per commit)
        const resolved = await markResolved(accountId, repo_id, 'sonarqube', commitSha);
        console.log(`[key=${key}] Resolved ${resolved} findings`);

        // 7. Correlate
        const clusters = await correlateFindings(accountId, repo_id, commitSha);
        console.log(`[key=${key}] Created ${clusters} correlation clusters`);

        // ===== [NEW-5] LLM root-cause explanation per cluster =====
        // Remove this whole block (and [NEW-1]) to go back to correlation only.
        const explained = await explainClusters(accountId, Number(repo_id), commitSha);
        console.log(`[key=${key}] Explained ${explained} clusters`);
        await notify(installationId, {
          type: 'correlation',
          title: 'Root Cause Analysis Complete',
          message: `${clusters} correlated clusters, ${explained} root causes identified.`,
        });
        // ===== [END NEW-5] =====
      } catch (err) {
        console.error(`[key=${key}] Failed to process Kafka message:`, err);

        // ===== [NEW-6] DLQ + failure notification (remove with [NEW-2]) =====
        await sendToDlq(rawForDlq, key, err);
        if (installationIdForError) {
          try {
            await notify(installationIdForError, {
              type: 'correlation',
              title: 'Root Cause Analysis Failed',
              message: 'Something went wrong while analyzing findings.',
            });
          } catch {
            /* a notification failure must not crash the worker */
          }
        }
        // ===== [END NEW-6] =====
      }
    },
  });
}