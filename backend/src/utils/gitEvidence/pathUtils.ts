// src/utils/gitEvidence/pathUtils.ts
import path from 'path';

/**
 * Root of the data directory.
 *
 * - Dev (Windows):  set DATA_ROOT=D:\Evidence-Correlated-RCA-CICD-Security\data in backend/.env
 * - Docker:         set DATA_ROOT=/data and mount a volume there
 * - Not set:        falls back to <backend>/../data
 *
 * path.resolve() guarantees an absolute path, so a drive-less path like
 * "\data\..." can never be produced again.
 */
export const DATA_ROOT = path.resolve(
  process.env.DATA_ROOT ?? path.join(process.cwd(), '..', 'data')
);

/** data/installations/{installationId} */
export function getInstallationPath(installationId: string | number): string {
  return path.join(DATA_ROOT, 'installations', String(installationId));
}

/**
 * data/installations/{installationId}/{repoId}/repo
 * Local git clone used for blame / diff / log.
 */
export function getRepoPath(
  installationId: string | number,
  repoId: string | number
): string {
  return path.join(getInstallationPath(installationId), String(repoId), 'repo');
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
  return path.join(getInstallationPath(installationId), String(repoId), 'scans', scanId);
}

/**
 * Converts an OS-native path (backslashes on Windows, or a document field
 * like "src\\server.js") into the forward-slash form git expects everywhere.
 * Also strips a leading "./" or "/".
 */
export function toGitPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.?\/+/, '');
}