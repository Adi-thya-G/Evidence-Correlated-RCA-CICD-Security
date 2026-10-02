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

export interface FindingItem {
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
