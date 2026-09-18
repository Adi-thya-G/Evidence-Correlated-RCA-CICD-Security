import type { SimpleGit } from 'simple-git';
import type { CommitMetadata } from '../types';

/**
 * In-memory cache keyed by commit hash. Commits are immutable once made,
 * so this is safe to reuse across findings in the same run, and can be
 * backed by Redis/Mongo for cross-run reuse if desired (see getOrFetch).
 */
export class GitEvidenceCache {
  private commitCache = new Map<string, CommitMetadata>();

  async getCommitMetadata(git: SimpleGit, hash: string): Promise<CommitMetadata> {
    const cached = this.commitCache.get(hash);
    if (cached) return cached;

    const [diff, showInfo] = await Promise.all([
      git.show([hash]),
      git.show(['--no-patch', '--format=%an|%ae|%at|%s', hash]),
    ]);

    const [author, email, timestamp, ...summaryParts] = showInfo.trim().split('|');
    const summary = summaryParts.join('|'); // commit messages can contain '|'

    const metadata: CommitMetadata = {
      commitHash: hash,
      author,
      email,
      commitDate: new Date(parseInt(timestamp, 10) * 1000),
      summary,
      diff,
    };

    this.commitCache.set(hash, metadata);
    return metadata;
  }

  clear(): void {
    this.commitCache.clear();
  }
}