import { kafka } from "./client"; // adjust to your actual kafka client import

const consumer = kafka.consumer({ groupId: "embedding-workers" });

export async function startEmbeddingWorker() {
  await consumer.connect();
  await consumer.subscribe({ topic: "raw-findings", fromBeginning: false });

  await consumer.run({
    partitionsConsumedConcurrently: 3,
    eachMessage: async ({ message }) => {
      try {
        const key = message.key ? message.key.toString() : null;
        const raw = message.value ? message.value.toString() : null;

        if (!raw) {
          console.warn("Received message with empty value, skipping. key=", key);
          return;
        }

        const payload = JSON.parse(raw);

        console.log(`[key=${key}] tool=${payload.tool}`, payload);
      } catch (err) {
        console.error("Failed to parse Kafka message:", err);
      }
    },
  });
}