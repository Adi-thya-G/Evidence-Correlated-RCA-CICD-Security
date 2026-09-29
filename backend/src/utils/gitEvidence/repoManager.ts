import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { Mutex } from 'async-mutex';
import { getRepoPath } from './pathUtils';

const repoLocks = new Map<string, Mutex>();

function getRepoLock(key: string): Mutex {
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

export async function ensureFullHistory(git: SimpleGit): Promise<void> {
  const isShallow = (await git.raw(['rev-parse', '--is-shallow-repository'])).trim();
  if (isShallow === 'true') {
    await git.raw(['fetch', '--unshallow']);
  }
}

export async function ensureRepoCheckedOut(
  installationId: string | number,
  repoId: string | number,
  cloneUrl: string,
  commitSha: string
): Promise<SimpleGit> {
  const repoPath = getRepoPath(installationId, repoId);
  const lock = getRepoLock(`${installationId}:${repoId}`);

  return lock.runExclusive(async () => {
    console.log(`[repoManager] repoPath=${repoPath}`);
    const hasGitDir = await pathExists(path.join(repoPath, '.git'));

    if (!hasGitDir) {
      await fs.rm(repoPath, { recursive: true, force: true });
      await fs.mkdir(path.dirname(repoPath), { recursive: true });
      try {
        await simpleGit().clone(cloneUrl, repoPath);
      } catch (err) {
        await fs.rm(repoPath, { recursive: true, force: true });
        throw err;
      }
    }

    const repoGit = simpleGit(repoPath);
    await ensureFullHistory(repoGit);
    if (hasGitDir) await repoGit.fetch(['--all']);
    await repoGit.checkout(['--force', '--detach', commitSha]);
    return repoGit;
  });
}