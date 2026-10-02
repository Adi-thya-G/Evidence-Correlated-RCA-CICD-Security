import type { Severity } from '@root/types/findings'
import { SEV_STYLE } from '../constants'

export function SevPill({ severity }: { severity?: string }) {
  const s = (severity?.toLowerCase() ?? 'low') as Severity
  return <div className={`w-min p-1 px-2 text-[12px] font-mono rounded-2xl font-semibold ${SEV_STYLE[s] ?? SEV_STYLE.low}`}>{s}</div>
}