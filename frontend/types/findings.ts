export type Tool = 'sonarqube' | 'semgrep' | 'trivy' | 'gitleaks'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Status = 'pending' | 'triaged' | 'resolved' | 'false_positive' // mirror backend STATUSES

export interface CommitInfo {
  hash: string
  author: string
  email?: string
  date: string
  summary: string
}

export interface FindingListItem {
  id: string
  tool: Tool
  ruleId: string
  severity: Severity
  message: string
  file: string
  startLine: number
  status: Status
  enrichedAt: string
  commit: CommitInfo | null
}

export interface FindingDetail extends FindingListItem {
  gitDiff?: string | null          // only this file's hunk (sliceFileDiff)
  fingerprint: string
  triage: { by: string; at: string; note: string | null } | null
}

export interface CommitGroup {
  commit: CommitInfo
  count: number
  topSeverity: Severity
  findings: FindingListItem[]
}

export interface FindingsSummary {
  total: number
  byTool: Record<Tool, number>
  byStatus: Record<Status, number>
  bySeverity: Record<Severity, number>
}
