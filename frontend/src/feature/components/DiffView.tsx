const lineStyle = (l: string) =>
  l.startsWith('+') ? 'bg-green-50 text-green-800'
  : l.startsWith('-') ? 'bg-red-50 text-red-800'
  : l.startsWith('@@') ? 'text-gray-400'
  : 'text-gray-600'

export function DiffView({ diff }: { diff?: string }) {
  if (!diff) return <p className='text-sm text-gray-400 font-serif'>No diff stored for this finding.</p>
  return (
    <pre className='text-[12px] leading-5 font-mono overflow-x-auto border border-gray-300 rounded-sm bg-mauve-100'>
      {diff.split('\n').map((l, i) => (
        <div key={i} className={`px-3 ${lineStyle(l)}`}>{l || ' '}</div>
      ))}
    </pre>
  )
}