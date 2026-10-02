// frontend/src/pages/Finding.tsx
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FindingListItem, Status, Tool } from '@root/types/findings'
import { TOOLS } from '@/feature/constants'
import { apiError } from '@/feature/utils'
import { useFindings } from '@/stores/useFinding'
import { useRepoStore } from '@/stores/repoStore'
import { ToolFilter } from '@/feature/components/ToolFilter'
import { ViewToggle } from '@/feature/components/ViewToggle'
import { FilterBar } from '@/feature/components/FilterBar'
import { FindingsTable } from '@/feature/components/FindingsTable'
import { CommitGroups } from '@/feature/components/CommitGroups'
import { Pagination } from '@/feature/components/Pagination'
import { FindingDrawer } from '@/feature/components/FindingDrawer'

export default function Finding() {
  const s = useFindings()
  const repoId = useRepoStore((r) => r.default?.repo_id)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())

  // 1) repo changed: wipe the old repo's data
  useEffect(() => {
    s.clear()
    setPicked(new Set())
    setDrawerOpen(false)
  }, [repoId])

  // 2) counts for the chips (ignores the tool filter on the backend)
  useEffect(() => {
    if (repoId) s.fetchSummary().catch(() => {})
  }, [repoId, s.status, s.severity])

  console.log("Finding component state:",s.items), 
  // 3) the list. The store setters only change state, so fetching is triggered here.
  useEffect(() => {
    if (!repoId) return
    setPicked(new Set())
    const load = s.view === 'commits' ? s.fetchCommitGroups() : s.fetchFindings()
    load.catch(() => {}) // the store already keeps the message in s.error
  }, [repoId, s.view, s.page, s.tool, s.status, s.severity, s.commit, s.search, s.sort])

  const count = (t: Tool | 'all') => (t === 'all' ? s.summary?.total ?? 0 : s.summary?.byTool?.[t] ?? 0)

  const open = (f: FindingListItem) => {
    s.setSelected(null)
    setDrawerOpen(true)
    s.fetchFindingById(f.id).catch((e) => toast.error('Could not load finding', { description: apiError(e, 'Please try again.') }))
  }
  const close = () => {
    setDrawerOpen(false)
    s.setSelected(null)
  }

  const changeStatus = async (status: Status, note?: string) => {
    if (!s.selected) return
    try {
      await s.updateStatus(s.selected.id, status, note)
      toast.success('Status updated')
    } catch (e) {
      toast.error('Could not update status', { description: apiError(e, 'Please try again.') })
    }
  }

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleAll = () =>
    setPicked((p) => (s.items.every((f) => p.has(f.id)) ? new Set() : new Set(s.items.map((f) => f.id))))

  const bulk = async (status: Status) => {
    try {
      await s.bulkUpdateStatus([...picked], status)
      toast.success(`${picked.size} finding${picked.size === 1 ? '' : 's'} updated`)
      setPicked(new Set())
    } catch (e) {
      toast.error('Bulk update failed', { description: apiError(e, 'Please try again.') })
    }
  }

  const empty = s.view === 'commits' ? s.commitGroups.length === 0 : s.items.length === 0

  return (
    <div className='w-full p-6 px-7 flex flex-col gap-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <ToolFilter tools={TOOLS} active={s.tool} count={count} onChange={s.setTool} />
        <ViewToggle value={s.view} onChange={s.setView} />
      </div>

      <FilterBar
        search={s.search} onSearch={s.setSearch}
        severity={s.severity} onSeverity={s.setSeverity}
        status={s.status} onStatus={s.setStatus}
        sort={s.sort} onSort={s.setSort}
        summary={s.summary}
      />

      {picked.size > 0 && (
        <div className='flex items-center gap-3 p-2 px-3 bg-mauve-100 border border-gray-300 rounded-sm text-sm font-serif'>
          <span>{picked.size} selected</span>
          <button disabled={s.updating} onClick={() => bulk('triaged')} className='px-3 py-1 rounded-sm bg-black text-white cursor-pointer disabled:opacity-50'>Mark triaged</button>
          <button disabled={s.updating} onClick={() => bulk('resolved')} className='px-3 py-1 rounded-sm border border-gray-300 bg-white cursor-pointer disabled:opacity-50'>Mark resolved</button>
          <button onClick={() => setPicked(new Set())} className='ml-auto text-gray-500 cursor-pointer'>Clear</button>
        </div>
      )}

      {s.loading && empty ? (
        <p className='text-sm text-gray-400 font-serif text-center py-16'>Loading findings…</p>
      ) : s.error && empty ? (
        <div className='text-center py-16 flex flex-col items-center gap-3'>
          <p className='text-sm text-red-600 font-serif'>{s.error}</p>
          <button onClick={() => s.fetchData().catch(() => {})} className='text-sm font-serif px-4 py-1.5 rounded-sm border border-gray-300 cursor-pointer active:scale-95'>Retry</button>
        </div>
      ) : empty ? (
        <p className='text-sm text-gray-400 font-serif text-center py-16'>No findings match these filters. Clear a filter or push a commit to start a scan.</p>
      ) : (
        <div className={s.loading ? 'opacity-60 transition-opacity' : ''}>
          {s.view === 'commits' ? (
            <CommitGroups items={s.commitGroups} onOpen={open} />
          ) : (
            <FindingsTable items={s.items} onOpen={open} picked={picked} onToggle={toggle} onToggleAll={toggleAll} />
          )}
        </div>
      )}

      {!empty && <Pagination page={s.page} totalPages={s.totalPages} total={s.total} onPage={s.setPage} />}

      <FindingDrawer
        open={drawerOpen}
        finding={s.selected}
        loading={s.detailLoading}
        updating={s.updating}
        onClose={close}
        onStatus={changeStatus}
      />
    </div>
  )
}