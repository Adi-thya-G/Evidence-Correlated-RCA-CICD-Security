import type { CommitInfo } from '@root/types/findings'
import { initials } from '../utils'

export function CommitBadge({ commit }: { commit: CommitInfo | null | undefined }) {
  if (!commit?.hash) return <span className='text-[12px] text-gray-400 font-serif'>no git evidence</span>
  const who = commit.author || commit.email || 'unknown'
  return (
    <div className='flex items-center gap-2 min-w-0'>
      <span className='w-6 h-6 shrink-0 rounded-full bg-black text-white text-[10px] font-mono grid place-items-center'>{initials(who)}</span>
      <div className='min-w-0'>
        <p className='text-[13px] font-serif truncate'>
          <span className='font-mono text-gray-400'>{commit.hash.slice(0, 7)}</span> {who}
        </p>
        <p className='text-[12px] text-gray-400 font-serif truncate max-w-64'>{commit.summary}</p>
      </div>
    </div>
  )
}