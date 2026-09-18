import { kafka } from './client'; // adjust to your actual kafka client import
import pLimit from 'p-limit';
import { SonarDataFetch } from '@modules/SonarDataFetch';
import { ensureRepoCheckedOut } from '@utils/gitEvidence/repoManager';
import { collectEvidenceForFindings } from '@utils/gitEvidence/evidenceCollector';
import type { ProducerMessage, NormalizedFinding } from '@types/gitEvidence.types';

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

        const payload = JSON.parse(raw);
        console.log(`[key=${key}] tool=${payload.tool}`, payload);

        const { accountId, repo_id, commitSha, installationId, cloneUrl } =
          (payload as ProducerMessage) ?? {};

        if (!accountId || !repo_id || !commitSha || !installationId || !cloneUrl) {
          throw new Error(
            'One or more required fields missing: accountId, repo_id, commitSha, installationId, cloneUrl'
          );
        }

        // 1. Ensure a local, full-history clone exists at the exact commit
        //    the scanner ran against. Safe under concurrent messages for
        //    the same repo (locked per repoId inside).
        const git = await ensureRepoCheckedOut(installationId, repo_id, cloneUrl, commitSha);

        // 2. Pull the SonarQube issues tied to this specific commit's analysis.
        const sonarIssues = (await SonarDataFetch({ accountId, repo_id, commitSha })) as NormalizedFinding[];

        if (sonarIssues.length === 0) {
          console.log(`[key=${key}] No matched SonarQube issues for commit=${commitSha}`);
          return;
        }

        // 3. Enrich with git blame / diff / commit evidence.
        const enriched = await collectEvidenceForFindings(git, sonarIssues, PER_MESSAGE_GIT_CONCURRENCY);

        console.log(`[key=${key}] Enriched ${enriched.length} findings for repo_id=${repo_id}`);

        // 4. TODO: persist `enriched` to the findings collection and/or
        //    hand off to the embedding stage (vector DB write).
      } catch (err) {
        console.error(`[key=${key}] Failed to process Kafka message:`, err);
      }
    },
  });
}