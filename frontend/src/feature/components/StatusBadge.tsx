import type { Status } from '@root/types/findings'
import { STATUS_STYLE } from '../constants'

export function StatusBadge({ status }: { status?: Status | null }) {
  const st = STATUS_STYLE[status ?? 'pending'] ?? STATUS_STYLE.pending
  return (
    <div className='flex gap-1.5 items-center whitespace-nowrap'>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      <span className={`${st.text} text-[12px] font-mono`}>{st.label}</span>
    </div>
  )
}