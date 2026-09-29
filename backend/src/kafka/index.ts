import {env} from '@config/env';
import mongoose from 'mongoose';
import { startEmbeddingWorker } from './embeddingWorker';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected (worker)');

  await startEmbeddingWorker();
  console.log('Embedding worker running, listening on raw-findings...');
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});