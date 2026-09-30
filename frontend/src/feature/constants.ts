import type { Sev, Status } from './types'

export const TOOLS = ['all', 'sonarqube', 'semgrep', 'trivy', 'gitleaks']

export const SEV_MAP: Record<string, Sev> = {
  BLOCKER: 'critical', CRITICAL: 'critical', MAJOR: 'high', MINOR: 'medium', INFO: 'low',
}
export const SEV_RANK: Record<Sev, number> = { critical: 3, high: 2, medium: 1, low: 0 }

export const SEV_STYLE: Record<Sev, string> = {
  critical: 'bg-red-100 text-red-600',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-mauve-200 text-gray-600',
  low: 'bg-mauve-100 text-gray-500',
}
export const STATUS_STYLE: Record<Status, { dot: string; text: string; label: string }> = {
  pending: { dot: 'bg-amber-600', text: 'text-amber-700', label: 'pending triage' },
  triaged: { dot: 'bg-blue-700', text: 'text-blue-700', label: 'triaged' },
  resolved: { dot: 'bg-green-800', text: 'text-green-700', label: 'resolved' },
}