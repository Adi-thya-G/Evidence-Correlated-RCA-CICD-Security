import { Types } from 'mongoose';
import { Setting } from '@modules/Setting';   // <-- your existing settings model; adjust path and name

export interface CorrelationCfg {
  topK: number;                 // 1-20
  similarityThreshold: number;  // 0-1
}

const DEFAULTS: CorrelationCfg = { topK: 10, similarityThreshold: 0.6 };

// this function take four parameter that one value 
const clamp = (n: unknown, lo: number, hi: number, d: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
};

export async function getCorrelationCfg(accountId: string): Promise<CorrelationCfg> {
  console.log(accountId) 
  const row= await Setting.findOne({ userId: new Types.ObjectId(accountId) }).lean();
  console.log(row)
  // Adapt these two field names to what your settings document actually stores
  // (for example row.topK / row.similarityThreshold, or row.correlation?.topK)
  return {
    topK: Math.round(clamp(row?.retrieval, 1, 20, DEFAULTS.topK)),
    similarityThreshold: clamp(row?.threshold, 0, 1, DEFAULTS.similarityThreshold),
  };
}