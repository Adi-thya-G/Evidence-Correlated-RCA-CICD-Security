import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrant = new QdrantClient({ url: process.env.QDRANT_URL ?? 'http://localhost:6333' });
export const COLLECTION = 'findings';

export async function initQdrant(vectorSize: number) {
  const { exists } = await qdrant.collectionExists(COLLECTION);
  if (exists) return;

  await qdrant.createCollection(COLLECTION, { vectors: { size: vectorSize, distance: 'Cosine' } });
  await qdrant.createPayloadIndex(COLLECTION, { field_name: 'accountId', field_schema: 'keyword' });
  await qdrant.createPayloadIndex(COLLECTION, { field_name: 'repo_id',   field_schema: 'integer' });
  await qdrant.createPayloadIndex(COLLECTION, { field_name: 'status',    field_schema: 'keyword' });
  await qdrant.createPayloadIndex(COLLECTION, { field_name: 'tool',      field_schema: 'keyword' });
}