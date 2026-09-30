import { SEV_STYLE } from '../constants'
import { toSev } from '../utils'

export function SevPill({ raw }: { raw: string }) {
  const s = toSev(raw)
  return (
    <div className={`w-min p-1 px-2 text-[12px] font-mono rounded-2xl font-semibold ${SEV_STYLE[s]}`}>
      {s}
    </div>
  )
}