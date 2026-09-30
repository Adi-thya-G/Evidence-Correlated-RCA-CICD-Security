import type { FindingItem } from '../types'
import { ago } from '../utils'
import { Author } from './Author'
import { DiffView } from './DiffView'
import { SevPill } from './SevPill'

interface Props {
  finding: FindingItem | null
  onClose: () => void
  onTriage?: (f: FindingItem) => void
  onFalsePositive?: (f: FindingItem) => void
}

export function FindingDrawer({ finding: f, onClose, onTriage, onFalsePositive }: Props) {
  if (!f) return null
  return (
    <div className='fixed inset-0 z-40 flex justify-end' role='dialog' aria-modal='true'>
      <button aria-label='Close' className='flex-1 bg-black/20 cursor-default' onClick={onClose} />
      <aside className='w-full max-w-lg bg-white border-l border-gray-300 overflow-y-auto p-6 flex flex-col gap-6'>
        <header className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 text-[12px] text-gray-500 font-mono'>
            <SevPill raw={f.severity} /> {f.tool} · {f.ruleId}
          </div>
          <h2 className='font-serif text-xl font-semibold leading-snug'>{f.message}</h2>
          <p className='font-mono text-[12px] text-gray-400 break-all'>{f.file}:{f.startLine}</p>
        </header>

        <section className='flex flex-col gap-2'>
          <h3 className='font-serif text-sm font-semibold'>Introduced by</h3>
          <div className='border border-gray-300 rounded-sm p-3 flex flex-col gap-2'>
            <Author f={f} />
            <p className='text-[12px] text-gray-400 font-serif'>
              Committed {ago(f.git_commit_date)}. Git blame points at line {f.startLine}.
            </p>
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <h3 className='font-serif text-sm font-semibold'>Changes to this file</h3>
          <DiffView diff={f.git_diff} />
        </section>

        <footer className='mt-auto flex gap-2 border-t border-gray-300 pt-4'>
          <button onClick={() => onTriage?.(f)} className='text-sm font-serif px-4 py-1.5 rounded-sm bg-black text-white cursor-pointer active:scale-95'>
            Mark triaged
          </button>
          <button onClick={() => onFalsePositive?.(f)} className='text-sm font-serif px-4 py-1.5 rounded-sm border border-gray-300 cursor-pointer active:scale-95'>
            False positive
          </button>
        </footer>
      </aside>
    </div>
  )
}