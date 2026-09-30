// frontend/src/types/findings.ts
export type Tool = "sonarqube" | "semgrep" | "trivy" | "gitleaks";
export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "pending" | "triaged" | "resolved" | "false_positive";

export interface CommitInfo {
  hash: string;
  author: string;   // name if available, else email
  email: string;
  date: string;
  summary: string;
}

export interface FindingListItem {
  id: string;
  tool: Tool;
  category: string;        // "sast", ...
  ruleId: string;
  severity: Severity;      // normalized on the server
  rawSeverity: string;     // MINOR, BLOCKER, ...
  message: string;
  file: string;
  startLine: number;
  endLine: number;
  status: Status;
  enrichedAt: string;
  commit: CommitInfo;
}

export interface FindingDetail extends FindingListItem {
  gitDiff: string | null;  // only this file's hunk, sliced server-side
  fingerprint: string;
  triage?: { by: string; at: string; note: string | null };
}

export interface FindingsSummary {
  total: number;
  byTool: Record<Tool, number>;
  byStatus: Record<Status, number>;
  bySeverity: Record<Severity, number>;
}

export interface CommitGroup {
  commit: CommitInfo;
  count: number;
  topSeverity: Severity;
  findings: FindingListItem[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}