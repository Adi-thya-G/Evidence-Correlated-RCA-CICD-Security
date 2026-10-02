import type { CommitGroup, FindingListItem } from '@root/types/findings'
import { ago } from '../utils'
import { SevPill } from './SevPill'
import { CommitBadge } from './Commitbadge'

interface Props {
  items: CommitGroup[]
  onOpen: (f: FindingListItem) => void
}

export function CommitGroups({ items, onOpen }: Props) {
  return (
    <div className='flex flex-col gap-4'>
      {items.map((g) => (
        <section key={g.commit?.hash || 'none'} className='border border-gray-300 rounded-sm'>
          <header className='flex items-center justify-between gap-4 p-4 border-b border-gray-300'>
            <div className='min-w-0'>
              <CommitBadge commit={g.commit} />
              {g.commit?.date && <p className='text-[12px] text-gray-400 font-mono mt-1'>{ago(g.commit.date)}</p>}
            </div>
            <div className='flex items-center gap-3 shrink-0'>
              <span className='font-serif text-[15px] font-semibold'>{g.count} finding{g.count === 1 ? '' : 's'}</span>
              <SevPill severity={g.topSeverity} />
            </div>
          </header>
          {g.findings.map((f) => (
            <button key={f.id} onClick={() => onOpen(f)} className='w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-mauve-100 border-b last:border-b-0 border-gray-200 cursor-pointer'>
              <SevPill severity={f.severity} />
              <span className='text-[14px] font-serif truncate flex-1'>{f.message}</span>
              <span className='font-mono text-[12px] text-gray-400'>{f.file.split('/').pop()}:{f.startLine}</span>
            </button>
          ))}
          {g.count > g.findings.length && (
            <p className='px-4 py-2 text-[12px] text-gray-400 font-mono'>+ {g.count - g.findings.length} more</p>
          )}
        </section>
      ))}
    </div>
  )
}