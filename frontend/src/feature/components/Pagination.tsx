interface Props {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, total, onPage }: Props) {
  if (totalPages <= 1) return <p className='text-[12px] text-gray-400 font-mono'>{total} total</p>
  const btn = 'px-3 py-1.5 text-[12px] font-mono border border-gray-300 rounded-sm cursor-pointer disabled:opacity-40 disabled:cursor-default'
  return (
    <div className='flex items-center justify-between text-[12px] font-mono text-gray-400'>
      <span>Page {page} of {totalPages} · {total} total</span>
      <div className='flex gap-2'>
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}