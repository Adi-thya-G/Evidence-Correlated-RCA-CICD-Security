import { useEffect, useState } from 'react'
import type { FindingDetail, Status } from '@root/types/findings'
import { STATUSES, STATUS_STYLE } from '../constants'
import { ago } from '../utils'
import { SevPill } from './SevPill'
import { StatusBadge } from './StatusBadge'
import { CommitBadge } from './Commitbadge'
import { DiffView } from './DiffView'

interface Props {
  open: boolean
  finding: FindingDetail | null
  loading: boolean
  updating: boolean
  onClose: () => void
  onStatus: (status: Status, note?: string) => void
}

export function FindingDrawer({ open, finding, loading, updating, onClose, onStatus }: Props) {
  const [note, setNote] = useState('')

  useEffect(() => setNote(''), [finding?.id])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-40 flex justify-end' role='dialog' aria-modal='true'>
      <button aria-label='Close' className='flex-1 bg-black/20 cursor-default' onClick={onClose} />
      <aside className='w-full max-w-lg bg-white border-l border-gray-300 overflow-y-auto p-6 flex flex-col gap-6'>
        {!finding || loading ? (
          <p className='text-sm text-gray-400 font-serif py-16 text-center'>Loading finding…</p>
        ) : (
          <>
            <header className='flex flex-col gap-2'>
              <div className='flex items-center gap-2 text-[12px] text-gray-500 font-mono'>
                <SevPill severity={finding.severity} /> {finding.tool} · {finding.ruleId}
              </div>
              <h2 className='font-serif text-xl font-semibold leading-snug'>{finding.message}</h2>
              <p className='font-mono text-[12px] text-gray-400 break-all'>{finding.file}:{finding.startLine}</p>
              <StatusBadge status={finding.status} />
            </header>

            <section className='flex flex-col gap-2'>
              <h3 className='font-serif text-sm font-semibold'>Introduced by</h3>
              <div className='border border-gray-300 rounded-sm p-3 flex flex-col gap-2'>
                <CommitBadge commit={finding.commit} />
                {finding.commit?.date && (
                  <p className='text-[12px] text-gray-400 font-serif'>Committed {ago(finding.commit.date)}. Git blame points at line {finding.startLine}.</p>
                )}
              </div>
            </section>

            <section className='flex flex-col gap-2'>
              <h3 className='font-serif text-sm font-semibold'>Changes to this file</h3>
              <DiffView diff={finding.gitDiff} />
            </section>

            {finding.triage && (
              <section className='flex flex-col gap-1'>
                <h3 className='font-serif text-sm font-semibold'>Last triage</h3>
                <p className='text-[12px] text-gray-400 font-serif'>{ago(finding.triage.at)}{finding.triage.note ? ` · “${finding.triage.note}”` : ''}</p>
              </section>
            )}

            <footer className='mt-auto flex flex-col gap-3 border-t border-gray-300 pt-4'>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder='Optional note for the triage record'
                className='w-full p-2 text-sm font-serif border border-gray-300 rounded-sm bg-mauve-100 outline-none resize-none' />
              <div className='flex flex-wrap gap-2'>
                {STATUSES.filter((s) => s !== finding.status).map((s) => (
                  <button key={s} disabled={updating} onClick={() => onStatus(s, note)}
                    className='text-sm font-serif px-3 py-1.5 rounded-sm border border-gray-300 cursor-pointer active:scale-95 disabled:opacity-50 first:bg-black first:text-white first:border-black'>
                    Mark {STATUS_STYLE[s].label}
                  </button>
                ))}
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}