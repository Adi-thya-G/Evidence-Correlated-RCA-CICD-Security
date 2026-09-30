import path from 'path';

export const DATA_ROOT = path.resolve(
  process.env.DATA_ROOT ?? path.join(process.cwd(), '..', 'data')
);

export function getInstallationPath(installationId: string | number): string {
  return path.join(DATA_ROOT, 'installations', String(installationId));
}

/** data/installations/{installationId}/repo/{repoid} */
export function getRepoPath(installationId: string | number, repoId: string | number): string {
  return path.join(getInstallationPath(installationId),'repo', String(repoId),);
}

/** data/installations/{installationId}/{repoId}/scans/{scanId} */
export function getScanOutputPath(
  installationId: string | number,
  repoId: string | number,
  scanId: string
): string {
  return path.join(getInstallationPath(installationId), String(repoId), 'scans', scanId);
}

/** Backslashes to forward slashes, strip leading "./" or "/" */
export function toGitPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.?\/+/, '');
}

/** "160832699_1341658140:backend/src/x.ts" -> "backend/src/x.ts" */
export function sonarComponentToGitPath(component: string): string {
  const idx = component.indexOf(':');
  const p = idx === -1 ? component : component.slice(idx + 1);
  return toGitPath(p);
}