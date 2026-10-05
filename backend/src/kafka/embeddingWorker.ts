import { kafka } from './client'; // adjust to your actual kafka client import
import { persistEnrichedFindings } from '@services/Persistfindings';
import { SonarDataFetch } from '@modules/SonarDataFetch';
import { ensureRepoCheckedOut } from '@utils/gitEvidence/repoManager';
import { collectEvidenceForFindings } from '@utils/gitEvidence/evidenceCollector';
import type { ProducerMessage, NormalizedFinding } from '../types/gitEvidence.types';
import { notify } from '@utils/notify';
import { embedPendingFindings } from '@services/embedPending';
import { markResolved } from '@services/Persistfindings';

const consumer = kafka.consumer({ groupId: 'embedding-workers' });

// Per-message git-evidence concurrency. Kept low deliberately: Kafka already
// processes up to `partitionsConsumedConcurrently` messages at once, and each
// message can itself spawn several git subprocesses. Multiply the two and
// keep the product within what the pod's CPU allocation can handle.
const PER_MESSAGE_GIT_CONCURRENCY = 2;

export async function startEmbeddingWorker() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'raw-findings', fromBeginning: false });

  await consumer.run({
    partitionsConsumedConcurrently: 3,
    eachMessage: async ({ message }) => {
      const key = message.key ? message.key.toString() : null;

      try {
        const raw = message.value ? message.value.toString() : null;
        if (!raw) {
          console.warn('Received message with empty value, skipping. key=', key);
          return;
        }

        const payload = JSON.parse(raw) as ProducerMessage & { tool?: string };
        console.log(`[key=${key}] tool=${payload.tool}`, payload);

        const { accountId, repo_id, commitSha, installationId, cloneUrl } = payload ?? {};

        if (!accountId || !repo_id || !commitSha || !installationId || !cloneUrl) {
          throw new Error(
            'One or more required fields missing: accountId, repo_id, commitSha, installationId, cloneUrl'
          );
        }
         await notify(installationId, {
        type: "correlation",
        title: "Root Cause Analysis Started",
        message:
          "Findings are being correlated with commits to identify root causes.",
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
      // 4. Persist to MongoDB
const result = await persistEnrichedFindings(enriched, { accountId, repo_id, commitSha });
console.log(`[key=${key}] Saved findings: ${result.upserted} new, ${result.modified} updated`);

// 5. Embed only new/changed findings into Qdrant
await embedPendingFindings(accountId, repo_id);

// 6. Resolve findings that vanished (Sonar scan is complete per commit)   
const resolved = await markResolved(accountId, repo_id, 'sonarqube', commitSha);
console.log(`[key=${key}] Resolved ${resolved} findings`);
        console.log(`[key=${key}] Saved findings: ${result.upserted} new, ${result.modified} updated`);
      } catch (err) {
        console.error(`[key=${key}] Failed to process Kafka message:`, err);
      }
    },
  });
}