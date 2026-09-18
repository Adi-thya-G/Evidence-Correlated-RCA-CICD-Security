export interface ProducerMessage {
  accountId: string;
  repo_id: string | number;
  installationId: string | number;
  commitSha: string;
  cloneUrl: string;
}

export interface BlameEntry {
  commitHash: string;
  origLine: string;
  finalLine: string;
  author?: string;
  authorEmail?: string;
  authorTime?: Date;
  commitSummary?: string;
  lineContent?: string;
}

export interface CommitMetadata {
  commitHash: string;
  author: string;
  email: string;
  commitDate: Date;
  summary: string;
  diff: string;
}

export interface NormalizedFinding {
  findingHash: string;
  accountId: string;
  repo_id: string | number;
  tool: string;
  category: 'sast' | 'sca' | 'secrets' | string;
  ruleId: string;
  severity: string;
  message: string;
  file: string;
  startLine?: number;
  endLine?: number;
  pkgName?: string;
  installedVersion?: string;
  fixedVersion?: string;
  raw?: unknown;
  [key: string]: unknown;
}

export interface EnrichedFinding extends NormalizedFinding {
  git_commit_hash?: string | null;
  git_author?: string | null;
  git_commit_date?: Date | null;
  git_commit_summary?: string | null;
  git_diff?: string | null;
  git_evidence?: null; // set when no evidence could be resolved
}