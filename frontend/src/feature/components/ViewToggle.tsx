import type { View } from '../types'

const OPTIONS: { value: View; label: string }[] = [
  { value: 'list', label: 'All findings' },
  { value: 'commits', label: 'By commit' },
]

export function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div className='ml-auto flex border border-gray-300 rounded-sm overflow-hidden text-[12px] font-mono'>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 cursor-pointer ${value === o.value ? 'bg-black text-white' : 'text-gray-600'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}