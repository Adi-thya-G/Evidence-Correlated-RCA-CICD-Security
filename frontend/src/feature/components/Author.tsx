import type { FindingItem } from '../types'
import { initials } from '../utils'

export function Author({ f }: { f: FindingItem }) {
  return (
    <div className='flex items-center gap-2 min-w-0'>
      <span className='w-6 h-6 shrink-0 rounded-full bg-black text-white text-[10px] font-mono grid place-items-center'>
        {initials(f.git_author_name)}
      </span>
      <div className='min-w-0'>
        <p className='text-[13px] font-serif truncate'>
          <span className='font-mono text-gray-400'>{f.git_commit_hash.slice(0, 7)}</span> {f.git_author_name}
        </p>
        <p className='text-[12px] text-gray-400 font-serif truncate max-w-64'>{f.git_commit_summary}</p>
      </div>
    </div>
  )
}