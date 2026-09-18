import type { SimpleGit } from 'simple-git';
import pLimit from 'p-limit';
import { parsePorcelainBlame, getDominantCommit } from './blameParser';
import { toGitPath } from './repoPaths';
import { GitEvidenceCache } from './gitCache';
// src/utils/gitEvidence/evidenceCollector.ts
import type { NormalizedFinding, EnrichedFinding, BlameEntry } from '@types/gitEvidence.types';

/**
 * Blames an ENTIRE file once (not per finding). Findings that land in the
 * same file share this one call — the single biggest performance lever
 * when a scan produces many findings per file.
 */
async function blameWholeFile(git: SimpleGit, filePath: string): Promise<BlameEntry[]> {
  const raw = await git.raw(['blame', '--line-porcelain', filePath]);
  return parsePorcelainBlame(raw);
}

function groupFindingsByFile(findings: NormalizedFinding[]): Map<string, NormalizedFinding[]> {
  const byFile = new Map<string, NormalizedFinding[]>();
  for (const f of findings) {
    if (!f.file) continue;
    const key = toGitPath(f.file);
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(f);
  }
  return byFile;
}

/**
 * SCA findings (Trivy) point at a lockfile with a package name, not a
 * line range that means anything semantically. The right git question
 * is "which commit last introduced/changed this package in the lockfile?"
 * -S is git's "pickaxe" search: commits whose diff added/removed this string.
 */
async function getDependencyIntroductionCommit(
  git: SimpleGit,
  pkgName: string,
  lockFile: string
): Promise<string | null> {
  const log = await git.raw(['log', '-1', '--format=%H', '-S', pkgName, '--', lockFile]);
  const hash = log.trim();
  return hash.length > 0 ? hash : null;
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
  finding: NormalizedFinding
): Promise<EnrichedFinding> {
  if (!finding.pkgName) {
    return { ...finding, git_evidence: null };
  }

  const filePath = toGitPath(finding.file);
  const commitHash = await getDependencyIntroductionCommit(git, finding.pkgName, filePath);
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
 * - Groups SAST/secrets findings by file and blames each file exactly once.
 * - Resolves SCA findings via pickaxe search on the lockfile.
 * - Caches commit metadata by hash so repeated commits (common across
 *   findings in the same PR) only ever fetch diff/author once.
 * - Caps concurrent git subprocesses via a shared limiter (tune to the
 *   CI runner's core count; per the reference hardware spec this is 4).
 */
export async function collectEvidenceForFindings(
  git: SimpleGit,
  findings: NormalizedFinding[],
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
        const blameEntries = await blameWholeFile(git, filePath);
        return Promise.all(
          fileFindings.map((finding) => enrichSastOrSecretFinding(git, cache, finding, blameEntries))
        );
      })
    )
  );

  const scaResults = await Promise.all(
    scaFindings.map((finding) => limit(() => enrichScaFinding(git, cache, finding)))
  );

  return [...lineBasedResults.flat(), ...scaResults];
}