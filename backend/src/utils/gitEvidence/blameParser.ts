import type { BlameEntry } from '../types';

/**
 * Parses the output of:
 *   git blame --line-porcelain [-L start,end] <file>
 *
 * The porcelain format repeats a block per source line:
 *   <40-char hash> <origLine> <finalLine> [numLinesInGroup]
 *   author ...
 *   author-mail <...>
 *   author-time ...
 *   summary ...
 *   \t<actual source line>
 */
export function parsePorcelainBlame(raw: string): BlameEntry[] {
  const lines = raw.split('\n');
  const entries: BlameEntry[] = [];
  let current: Partial<BlameEntry> = {};

  const HASH_LINE = /^[0-9a-f]{40}\s+(\d+)\s+(\d+)/;

  for (const line of lines) {
    const hashMatch = line.match(HASH_LINE);

    if (hashMatch) {
      if (current.commitHash) entries.push(current as BlameEntry);
      const hash = line.slice(0, 40);
      current = { commitHash: hash, origLine: hashMatch[1], finalLine: hashMatch[2] };
    } else if (line.startsWith('author-mail ')) {
      current.authorEmail = line.replace('author-mail ', '').replace(/[<>]/g, '').trim();
    } else if (line.startsWith('author-time ')) {
      const epochSeconds = parseInt(line.replace('author-time ', '').trim(), 10);
      current.authorTime = new Date(epochSeconds * 1000);
    } else if (line.startsWith('author ')) {
      current.author = line.replace('author ', '').trim();
    } else if (line.startsWith('summary ')) {
      current.commitSummary = line.replace('summary ', '').trim();
    } else if (line.startsWith('\t')) {
      current.lineContent = line.slice(1);
    }
  }

  if (current.commitHash) entries.push(current as BlameEntry);
  return entries;
}

/**
 * Given a set of blamed lines (possibly spanning several commits),
 * picks the commit that touched the most lines in the flagged range —
 * treated as the most likely root-cause commit.
 */
export function getDominantCommit(entries: BlameEntry[]): string | null {
  if (entries.length === 0) return null;

  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.commitHash, (counts.get(e.commitHash) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}