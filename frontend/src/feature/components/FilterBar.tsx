import { useEffect, useState } from 'react'
import type { Severity, Status, FindingsSummary } from '@root/types/findings'
import { SEVERITIES, STATUSES, SORTS, STATUS_STYLE } from '../constants'

interface Props {
  search: string
  onSearch: (q: string) => void
  severity: Severity[]
  onSeverity: (s: Severity[]) => void
  status: Status[]
  onStatus: (s: Status[]) => void
  sort: string
  onSort: (s: any) => void
  summary: FindingsSummary | null
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function FilterBar({ search, onSearch, severity, onSeverity, status, onStatus, sort, onSort, summary }: Props) {
  const [q, setQ] = useState(search)

  // debounce typing so we don't call the API on every key
  useEffect(() => {
    if (q === search) return
    const t = setTimeout(() => onSearch(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-2xl text-[12px] font-mono border cursor-pointer ${on ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:bg-mauve-100'}`

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search message, rule or file…'
        className='w-64 p-2 text-sm font-serif border border-gray-300 rounded-sm bg-mauve-100 outline-none' />

      <div className='flex gap-1.5'>
        {SEVERITIES.map((s) => (
          <button key={s} className={chip(severity.includes(s))} onClick={() => onSeverity(toggle(severity, s))}>
            {s} {summary ? `(${summary.bySeverity?.[s] ?? 0})` : ''}
          </button>
        ))}
      </div>

      <div className='flex gap-1.5'>
        {STATUSES.map((s) => (
          <button key={s} className={chip(status.includes(s))} onClick={() => onStatus(toggle(status, s))}>
            {STATUS_STYLE[s].label}
          </button>
        ))}
      </div>

      <select value={sort} onChange={(e) => onSort(e.target.value)}
        className='ml-auto p-2 text-sm font-serif border border-gray-300 rounded-sm bg-white outline-none'>
        {SORTS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
      </select>
    </div>
  )
}