import { SEV_MAP, SEV_RANK } from './constants'
import type { FindingItem, Sev } from './types'

export const toSev = (s: string): Sev => SEV_MAP[s?.toUpperCase()] ?? 'low'

export const ago = (iso: string) => {
  const h = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 36e5))
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

export const initials = (n: string) =>
  n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export const topSeverity = (items: FindingItem[]) =>
  items.reduce((a, b) => (SEV_RANK[toSev(b.severity)] > SEV_RANK[toSev(a.severity)] ? b : a))

export const groupByCommit = (items: FindingItem[]) => {
  const m = new Map<string, FindingItem[]>()
  items.forEach((f) => m.set(f.git_commit_hash, [...(m.get(f.git_commit_hash) ?? []), f]))
  return [...m.values()].sort((a, b) => b.length - a.length)
}