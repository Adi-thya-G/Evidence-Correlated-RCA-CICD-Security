import fs from 'fs/promises';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { Mutex } from 'async-mutex';
import { getRepoPath } from './repoPaths';

const repoLocks = new Map<string, Mutex>();

function getRepoLock(repoId: string | number): Mutex {
  const key = String(repoId);
  if (!repoLocks.has(key)) repoLocks.set(key, new Mutex());
  return repoLocks.get(key)!;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Blame needs full commit history. Shallow clones (common on CI runners,
 * --depth 1) silently return wrong/incomplete blame data, so this must
 * run before any blame/log call and is treated as a hard gate.
 */
export async function ensureFullHistory(git: SimpleGit): Promise<void> {
  const isShallow = (await git.raw(['rev-parse', '--is-shallow-repository'])).trim();
  if (isShallow === 'true') {
    await git.raw(['fetch', '--unshallow']);
  }
}

/**
 * Ensures a local clone exists for this installation+repo, checked out
 * at the exact commit the finding was scanned against, and returns a
 * SimpleGit instance bound to it.
 *
 * Safe for concurrent Kafka messages targeting the same repo on the same
 * worker pod: a per-repoId mutex serializes clone/fetch/checkout so two
 * messages never race on the same working directory.
 */
export async function ensureRepoCheckedOut(
  installationId: string | number,
  repoId: string | number,
  cloneUrl: string,
  commitSha: string
): Promise<SimpleGit> {
  const repoPath = getRepoPath(installationId, repoId);
  const lock = getRepoLock(repoId);

  return lock.runExclusive(async () => {
    const gitDirExists = await pathExists(path.join(repoPath, '.git'));

    if (!gitDirExists) {
      await fs.mkdir(repoPath, { recursive: true });
      const bootstrapper = simpleGit();
      // Full clone, not shallow — required for correct blame/pickaxe results.
      await bootstrapper.clone(cloneUrl, repoPath);
      const repoGit = simpleGit(repoPath);
      await repoGit.checkout(commitSha);
      return repoGit;
    }

    const repoGit = simpleGit(repoPath);
    await ensureFullHistory(repoGit);
    await repoGit.fetch(['--all']);
    await repoGit.checkout(commitSha);
    return repoGit;
  });
}