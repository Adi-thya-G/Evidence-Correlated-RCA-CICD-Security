// backend/src/kafka/index.ts
import { startEmbeddingWorker } from "./embeddingWorker";

startEmbeddingWorker()
  .then(() => console.log("Embedding worker running, listening on raw-findings..."))
  .catch((err) => {
    console.error("Fatal error starting embedding worker:", err);
    process.exit(1);
  });