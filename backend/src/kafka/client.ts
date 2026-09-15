// src/kafka/client.ts
import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'rca-backend',
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
});


