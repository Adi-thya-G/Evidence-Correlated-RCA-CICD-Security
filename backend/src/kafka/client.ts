// src/kafka/client.ts
import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'rca-backend',
  brokers: [process.env.KAFKA_BROKER ?? '127.0.0.1:9092'],
  logLevel: logLevel.WARN,
});
