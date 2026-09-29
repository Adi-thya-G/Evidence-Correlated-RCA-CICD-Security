import {env} from '@config/env';
import mongoose from 'mongoose';
import { startEmbeddingWorker } from './embeddingWorker';


async function main() {
  await mongoose.connect(env.MONGODB_URI as string); // use your env var name
  console.log('MongoDB connected (worker)');

  await startEmbeddingWorker();
  console.log('Embedding worker running, listening on raw-findings...');
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});