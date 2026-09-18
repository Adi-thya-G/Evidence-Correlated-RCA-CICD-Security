import path from 'path';

// Root of the data directory, e.g. /data or D:\...\data on a dev box.
// Never hardcode a drive letter or absolute path in code — always read from env.
export const DATA_ROOT = process.env.DATA_ROOT || '/data';

/**
 * data/installations/{installationId}/{repoId}/repo
 * This is the local git clone used for blame / diff / log.
 */
export function getRepoPath(installationId: string | number, repoId: string | number): string {
  return path.join(DATA_ROOT, 'installations', String(installationId), String(repoId), 'repo');
}

/**
 * data/installations/{installationId}/{repoId}/scans/{scanId}
 * Immutable per-scan raw scanner output (sonarqube.json, semgrep.json, etc).
 */
export function getScanOutputPath(
  installationId: string | number,
  repoId: string | number,
  scanId: string
): string {
  return path.join(DATA_ROOT, 'installations', String(installationId), String(repoId), 'scans', scanId);
}

/**
 * Converts an OS-native path (which may contain backslashes on Windows,
 * or come from a document field like "src\\server.js") into the
 * forward-slash form git itself expects on every platform.
 */
export function toGitPath(p: string): string {
  return p.replace(/\\/g, '/');
}