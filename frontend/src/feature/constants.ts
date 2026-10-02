import type { Tool, Severity, Status } from '@root/types/findings'

export const TOOLS: (Tool | 'all')[] = ['all', 'sonarqube', 'semgrep', 'trivy', 'gitleaks']
export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
export const STATUSES: Status[] = ['pending', 'triaged', 'resolved', 'false_positive'] // mirror backend STATUSES

export const SORTS = [
  { value: '-enrichedAt', label: 'Newest' },
  { value: '-severity', label: 'Severity' },
  { value: 'file', label: 'File' },
] as const

export const SEV_STYLE: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-600',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-mauve-200 text-gray-600',
  low: 'bg-mauve-100 text-gray-500',
}

export const STATUS_STYLE: Record<Status, { dot: string; text: string; label: string }> = {
  pending: { dot: 'bg-amber-600', text: 'text-amber-700', label: 'pending triage' },
  triaged: { dot: 'bg-blue-700', text: 'text-blue-700', label: 'triaged' },
  resolved: { dot: 'bg-green-800', text: 'text-green-700', label: 'resolved' },
  false_positive: { dot: 'bg-gray-400', text: 'text-gray-500', label: 'false positive' },
}