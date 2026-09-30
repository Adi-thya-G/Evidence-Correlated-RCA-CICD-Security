import { TOOLS } from '@/feature/constants'
import { useFindings } from '@/feature/useFindings'
import { CommitGroups } from '@/feature/components/CommitGroups'
import { FindingDrawer } from '@/feature/components/FindingDrawer'
import { FindingsTable } from '@/feature/components/FindingsTable'
import { ToolFilter } from '@/feature/components/ToolFilter'
import { ViewToggle } from '@/feature/components/ViewToggle'

export default function Finding() {
  const { tool, setTool, view, setView, selected, setSelected, items, count } = useFindings()

  return (
    <div className='w-full p-6 px-7 flex flex-col gap-7'>
      <div className='flex flex-wrap items-center gap-4'>
        <ToolFilter tools={TOOLS} active={tool} count={count} onChange={setTool} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-gray-400 font-serif text-center py-16'>
          No findings for this scanner. Run a scan or pick another filter.
        </p>
      ) : view === 'commits' ? (
        <CommitGroups items={items} onOpen={setSelected} />
      ) : (
        <FindingsTable items={items} onOpen={setSelected} />
      )}

      <FindingDrawer finding={selected} onClose={() => setSelected(null)} />
    </div>
  )
}