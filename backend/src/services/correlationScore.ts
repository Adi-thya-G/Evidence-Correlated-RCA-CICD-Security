export const WEIGHTS = {
  vector: 0.35,        // semantic similarity from Qdrant
  sameFile: 0.20,
  lineProximity: 0.10, // same file and within 10 lines
  sameCommit: 0.10,    // same git_commit_hash (blame)
  sameCwe: 0.10,
  crossTool: 0.10,     // different tools agreeing is strong evidence
  sameFunction: 0.05,
} as const;

export const THRESHOLD = 0.5; // tune against labeled data

export interface PairResult { score: number; signals: string[] }

const cweOf = (f: any) => f.cwe ?? f.raw?.cwe ?? null;

export function scorePair(a: any, b: any, vectorSim: number): PairResult {
  const signals: string[] = [];
  let score = WEIGHTS.vector * Math.max(0, vectorSim);
  if (vectorSim > 0.5) signals.push('vector');

  const sameFile = !!a.file && a.file === b.file;
  if (sameFile) { score += WEIGHTS.sameFile; signals.push('file'); }

  if (sameFile && a.startLine != null && b.startLine != null &&
      Math.abs(a.startLine - b.startLine) <= 10) {
    score += WEIGHTS.lineProximity; signals.push('line');
  }
  if (a.git_commit_hash && a.git_commit_hash === b.git_commit_hash) {
    score += WEIGHTS.sameCommit; signals.push('commit');
  }
  const ca = cweOf(a), cb = cweOf(b);
  if (ca && ca === cb) { score += WEIGHTS.sameCwe; signals.push('cwe'); }

  if (a.tool !== b.tool) { score += WEIGHTS.crossTool; signals.push('cross-tool'); }

  if (a.function && a.function === b.function) {
    score += WEIGHTS.sameFunction; signals.push('function');
  }
  return { score, signals };
}