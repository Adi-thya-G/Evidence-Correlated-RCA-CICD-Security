type View = 'findings' | 'commits'

export function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div className='ml-auto flex border border-gray-300 rounded-sm overflow-hidden text-[12px] font-mono'>
      {(['findings', 'commits'] as const).map((v) => (
        <button key={v} onClick={() => onChange(v)} className={`px-3 py-1.5 cursor-pointer ${value === v ? 'bg-black text-white' : 'text-gray-600'}`}>
          {v === 'findings' ? 'All findings' : 'By commit'}
        </button>
      ))}
    </div>
  )
}