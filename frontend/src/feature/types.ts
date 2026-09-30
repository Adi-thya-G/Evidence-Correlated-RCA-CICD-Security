export type Sev = 'critical' | 'high' | 'medium' | 'low'
export type Status = 'pending' | 'triaged' | 'resolved'
export type View = 'list' | 'commits'

export interface FindingItem {
  _id: string
  tool: string
  ruleId: string
  severity: string // raw scanner value
  message: string
  file: string
  startLine: number
  git_author_name: string
  git_commit_hash: string
  git_commit_date: string
  git_commit_summary: string
  git_diff?: string
  status: Status
  enrichedAt: string
}