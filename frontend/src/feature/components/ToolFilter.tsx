interface Props {
  tools: string[]
  active: string
  count: (t: string) => number
  onChange: (t: string) => void
}

export function ToolFilter({ tools, active, count, onChange }: Props) {
  return (
    <>
      {tools.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-pressed={active === t}
          className={`p-2 px-3 w-max ${active === t ? 'bg-black text-white font-semibold' : 'bg-mauve-200 text-gray-700'} text-[12px] rounded-2xl flex gap-2 font-mono cursor-pointer`}
        >
          <span>{t}</span>({count(t)})
        </button>
      ))}
    </>
  )
}