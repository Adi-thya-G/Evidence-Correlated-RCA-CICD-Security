// embeddingWorker.ts
import { Kafka,logLevel } from "kafkajs";
export const kafka = new Kafka({
  clientId: 'rca-backend',
  brokers: [process.env.KAFKA_BROKER ?? '127.0.0.1:9092'],
  logLevel: logLevel.WARN,
});

const consumer = kafka.consumer({ groupId: "embedding-workers" });

export async function startEmbeddingWorker() {
  await consumer.connect();
  await consumer.subscribe({ topic: "raw-findings", fromBeginning: false });

  await consumer.run({
    // Process partitions in parallel, messages within a partition in order
    partitionsConsumedConcurrently: 3,
    eachMessage: async ({ message }) => {
      
       
      console.log(message)
     
      
    
    },
  });
}