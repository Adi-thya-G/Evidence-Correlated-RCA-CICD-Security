import { useMemo } from 'react'
import type { FindingItem } from '../types'
import { groupByCommit, topSeverity } from '../utils'
import { Author } from './Author'
import { SevPill } from './SevPill'

export function CommitGroups({ items, onOpen }: { items: FindingItem[]; onOpen: (f: FindingItem) => void }) {
  const groups = useMemo(() => groupByCommit(items), [items])

  return (
    <div className='flex flex-col gap-4'>
      {groups.map((g) => (
        <section key={g[0].git_commit_hash} className='border border-gray-300 rounded-sm'>
          <header className='flex items-center justify-between gap-4 p-4 border-b border-gray-300'>
            <Author f={g[0]} />
            <div className='flex items-center gap-3 shrink-0'>
              <span className='font-serif text-[15px] font-semibold'>{g.length} findings</span>
              <SevPill raw={topSeverity(g).severity} />
            </div>
          </header>
          {g.map((f) => (
            <button
              key={f._id}
              onClick={() => onOpen(f)}
              className='w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-mauve-100 border-b last:border-b-0 border-gray-200 cursor-pointer'
            >
              <SevPill raw={f.severity} />
              <span className='text-[14px] font-serif truncate flex-1'>{f.message}</span>
              <span className='font-mono text-[12px] text-gray-400'>{f.file.split('/').pop()}:{f.startLine}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}