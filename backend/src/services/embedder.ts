// npm i @xenova/transformers
import { pipeline } from '@xenova/transformers';

export const EMBED_DIM = 384;
let extractor: any;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  extractor ??= await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const out: number[][] = [];
  for (const t of texts) {
    const r = await extractor(t, { pooling: 'mean', normalize: true });
    out.push(Array.from(r.data as Float32Array));
  }
  return out;
}