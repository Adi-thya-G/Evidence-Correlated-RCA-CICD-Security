// src/utils/gitEvidence/evidenceCollector.ts
import type { SimpleGit } from 'simple-git';
import pLimit from 'p-limit';
import { parsePorcelainBlame, getDominantCommit } from './blameParser';
import { sonarComponentToGitPath } from './pathUtils';
import { GitEvidenceCache } from './gitCache';
import type { NormalizedFinding, EnrichedFinding, BlameEntry } from '../../types/gitEvidence.types';

/**
 * Blames an ENTIRE file once (not per finding). Findings that land in the
 * same file share this one call.
 *
 * `filePath` must be repo-relative (forward slashes). The SimpleGit instance
 * must already be rooted at the repo (simpleGit(getRepoPath(...))).
 * If commitSha is given, blame runs against that exact commit.
 * A failing file returns [] so one bad path doesn't kill the whole batch.
 */
async function blameWholeFile(
  git: SimpleGit,
  filePath: string,
  commitSha?: string
): Promise<BlameEntry[]> {
  try {
    const args = ['blame', '--line-porcelain'];
    if (commitSha) args.push(commitSha);
    args.push('--', filePath);
    const raw = await git.raw(args);
    return parsePorcelainBlame(raw);
  } catch (err) {
    console.warn(`[blame] skipped ${filePath}:`, (err as Error).message);
    return [];
  }
}

function groupFindingsByFile(findings: NormalizedFinding[]): Map<string, NormalizedFinding[]> {
  const byFile = new Map<string, NormalizedFinding[]>();
  for (const f of findings) {
    if (!f.file) continue;
    // "160832699_1341658140:backend/src/x.ts" -> "backend/src/x.ts"
    const key = sonarComponentToGitPath(f.file);
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(f);
  }
  return byFile;
}

/**
 * SCA findings (Trivy) point at a lockfile with a package name.
 * Git "pickaxe" (-S) finds the last commit whose diff added/removed the string.
 */
async function getDependencyIntroductionCommit(
  git: SimpleGit,
  pkgName: string,
  lockFile: string,
  commitSha?: string
): Promise<string | null> {
  try {
    const args = ['log', '-1', '--format=%H', '-S', pkgName];
    if (commitSha) args.push(commitSha);
    args.push('--', lockFile);
    const log = await git.raw(args);
    const hash = log.trim();
    return hash.length > 0 ? hash : null;
  } catch (err) {
    console.warn(`[sca] pickaxe failed for ${pkgName} in ${lockFile}:`, (err as Error).message);
    return null;
  }
}

async function enrichSastOrSecretFinding(
  git: SimpleGit,
  cache: GitEvidenceCache,
  finding: NormalizedFinding,
  blameEntriesForFile: BlameEntry[]
): Promise<EnrichedFinding> {
  const start = finding.startLine ?? 1;
  const end = finding.endLine ?? start;

  const blameByLine = new Map(blameEntriesForFile.map((e) => [Number(e.finalLine), e]));
  const relevant: BlameEntry[] = [];
  for (let l = start; l <= end; l++) {
    const entry = blameByLine.get(l);
    if (entry) relevant.push(entry);
  }

  const dominantHash = getDominantCommit(relevant);
  if (!dominantHash) {
    return { ...finding, git_evidence: null };
  }

  const meta = await cache.getCommitMetadata(git, dominantHash);
  return {
    ...finding,
    git_commit_hash: meta.commitHash,
    git_author: meta.email,
    git_commit_date: meta.commitDate,
    git_commit_summary: meta.summary,
    git_diff: meta.diff,
  };
}

async function enrichScaFinding(
  git: SimpleGit,
  cache: GitEvidenceCache,
  finding: NormalizedFinding,
  commitSha?: string
): Promise<EnrichedFinding> {
  if (!finding.pkgName || !finding.file) {
    return { ...finding, git_evidence: null };
  }

  const filePath = sonarComponentToGitPath(finding.file);
  const commitHash = await getDependencyIntroductionCommit(git, finding.pkgName, filePath, commitSha);
  if (!commitHash) {
    return { ...finding, git_evidence: null };
  }

  const meta = await cache.getCommitMetadata(git, commitHash);
  return {
    ...finding,
    git_commit_hash: meta.commitHash,
    git_author: meta.email,
    git_commit_date: meta.commitDate,
    git_commit_summary: meta.summary,
    git_diff: meta.diff,
  };
}

/**
 * Enriches every finding in a batch with git evidence.
 *
 * @param git        SimpleGit rooted at the repo: simpleGit(getRepoPath(installationId, repoId))
 * @param findings   findings whose `file` is repo-relative (optionally "projectKey:" prefixed)
 * @param commitSha  the scanned commit (recommended, so blame matches what was scanned)
 * @param concurrency max parallel git subprocesses
 */
export async function collectEvidenceForFindings(
  git: SimpleGit,
  findings: NormalizedFinding[],
  commitSha?: string,
  concurrency = 4
): Promise<EnrichedFinding[]> {
  const cache = new GitEvidenceCache();
  const limit = pLimit(concurrency);

  const scaFindings = findings.filter((f) => f.category === 'sca');
  const lineBasedFindings = findings.filter((f) => f.category !== 'sca');

  const byFile = groupFindingsByFile(lineBasedFindings);

  const lineBasedResults = await Promise.all(
    [...byFile.entries()].map(([filePath, fileFindings]) =>
      limit(async () => {
        const blameEntries = await blameWholeFile(git, filePath, commitSha);
        return Promise.all(
          fileFindings.map((finding) =>
            enrichSastOrSecretFinding(git, cache, finding, blameEntries)
          )
        );
      })
    )
  );

  const scaResults = await Promise.all(
    scaFindings.map((finding) => limit(() => enrichScaFinding(git, cache, finding, commitSha)))
  );

  return [...lineBasedResults.flat(), ...scaResults];
}