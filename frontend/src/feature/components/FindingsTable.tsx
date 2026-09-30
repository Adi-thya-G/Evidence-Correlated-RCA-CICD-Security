import type { FindingItem } from '../types'
import { ago } from '../utils'
import { Author } from './Author'
import { SevPill } from './SevPill'
import { StatusBadge } from './StatusBadge'

const HEADERS = ['Finding', 'Severity', 'Scanner', 'Introduced by', 'Status', 'Detected']

function Row({ f, last, onOpen }: { f: FindingItem; last: boolean; onOpen: (f: FindingItem) => void }) {
  return (
    <tr
      tabIndex={0}
      onClick={() => onOpen(f)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(f)}
      className={`${last ? '' : 'border-b'} border-gray-300 hover:bg-mauve-100 cursor-pointer focus:outline-none focus:bg-mauve-100`}
    >
      <td className='px-2 max-w-sm'>
        <div className='flex flex-col gap-0.5 p-2'>
          <h2 className='text-[15px] font-serif truncate'>{f.message}</h2>
          <p className='text-[13px] text-gray-400 font-serif truncate'>{f.file}:{f.startLine}</p>
        </div>
      </td>
      <td className='px-2'><SevPill raw={f.severity} /></td>
      <td className='px-2'>
        <div className='p-1 bg-mauve-200 text-gray-700 text-[12px] w-min rounded-sm border border-gray-300'>{f.tool}</div>
      </td>
      <td className='px-2'><Author f={f} /></td>
      <td className='px-2'><StatusBadge status={f.status} /></td>
      <td className='px-2 text-gray-400 font-mono text-[12px] whitespace-nowrap'>{ago(f.enrichedAt)}</td>
    </tr>
  )
}

export function FindingsTable({ items, onOpen }: { items: FindingItem[]; onOpen: (f: FindingItem) => void }) {
  return (
    <div className='w-full overflow-x-auto'>
      <table className='w-full'>
        <thead>
          <tr className='text-[12px] text-gray-500 font-mono border-b border-gray-300'>
            {HEADERS.map((h) => (
              <th key={h} className='text-start px-2 pb-2 font-normal'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((f, i) => (
            <Row key={f._id} f={f} last={i === items.length - 1} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  )
}