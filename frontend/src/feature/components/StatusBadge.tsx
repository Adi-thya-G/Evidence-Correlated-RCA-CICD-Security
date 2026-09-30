import { STATUS_STYLE } from '../constants'
import type { Status } from '../types'

export function StatusBadge({ status }: { status: Status }) {
  const st = STATUS_STYLE[status]
  return (
    <div className='flex gap-1.5 items-center whitespace-nowrap'>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      <span className={`${st.text} text-[12px] font-mono`}>{st.label}</span>
    </div>
  )
}