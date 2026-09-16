import { useMemo, useState } from 'react'
import SeverityCard from "./SeverityCard"
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import type { SetStateAction, Dispatch } from 'react'

export type Issue = {
  key: string
  message: string
  component: string
  line: number
  effort: string
  severity: string // BLOCKER | CRITICAL | MAJOR | MINOR | INFO
  type: string      // BUG | VULNERABILITY | CODE_SMELL
  tags?: string[]   // e.g. ['es2015'], ['docker'] — depends on the file/rule
  rule?: string      // e.g. "typescript:S3863" — use to fetch CWE separately if needed
}

const FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'BUG', label: 'Bug' },
  { id: 'VULNERABILITY', label: 'Vulnerability' },
  { id: 'CODE_SMELL', label: 'Code smell' },
] as const

function typeLabel(type: string) {
  if (type === 'VULNERABILITY') return 'vulnerability'
  if (type === 'BUG') return 'bug'
  if (type === 'CODE_SMELL') return 'code smell'
  return type?.toLowerCase()
}


interface queryProps {
  key: string;
  line: number;
  context?: number;
}

function SonarQubeGrid({
  data,
  setPage,
  setSelectedSource,
  sourceCode
}: {
  data: { issues: Issue[] }
  setPage: Dispatch<SetStateAction<number>>,
  setSelectedSource: Dispatch<SetStateAction<queryProps|null>>,
  sourceCode:queryProps|null
}) {
  // IMPORTANT: don't mirror the `data` prop into useState. useState's
  // initial value is only used on the FIRST render — when `data` changes
  // on later renders (e.g. after fetching a new page), useState ignores
  // the new value entirely and keeps showing the old one. That was the
  // bug: clicking "next page" updated `data` in the parent just fine,
  // but this component kept rendering page 1's frozen snapshot.
  //
  // Fix: just read straight from the prop every render. There's no local
  // mutation of `issues` here (filtering doesn't need it), so there's no
  // reason to hold a separate copy in state at all.
  const issues = data?.issues ?? []
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filteredIssues = useMemo(
    () => (activeFilter === 'all' ? issues : issues.filter((i) => i.type === activeFilter)),
    [issues, activeFilter],
  )

  return (
    <div className="w-full rounded-xl border border-gray-300 h-max">
      <div className="p-3 px-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[17px] font-serif font-semibold">Open issues</h2>
          <p className="text-[13px] text-gray-500 font-serif">Sorted by severity</p>
        </div>

        <div className="flex gap-1 pt-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                activeFilter === f.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredIssues.length === 0 && (
        <div className="px-6 py-8 text-center text-[13px] text-gray-500 border-t border-gray-300">
          No issues match this filter.
        </div>
      )}

      {filteredIssues?.map((ele) => {
        const [file, ...rest] = String(ele.component).split(':')
        const filePath = rest.length ? rest.join(':') : file
        return (
          <div key={ele.key} className={`p-3 flex gap-3 border-t border-gray-300 hover:cursor-pointer ${sourceCode?.key==ele.component&&sourceCode.line==ele.line&&"bg-red-100 text-red-800"}`} onClick={()=>{
            setSelectedSource(
              {key: ele.component, line: ele.line,context: 5})
            
          }}>
            <SeverityCard title={ele.severity} />
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[14px] font-semibold font-serif">{ele.message}</h2>
              <p className="text-[12px] font-mono text-gray-500">
                {typeLabel(ele.type)}
                <br />
                {filePath}:{ele.line} · {ele.effort} effort
              </p>
            </div>
            {ele.tags && ele.tags.length > 0 && (
              <div className="flex flex-1 justify-end place-items-start gap-1">
                {ele.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-mauve-100 text-gray-700 text-[12px] p-1 border-gray-600 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex justify-between p-2">
        <button
          className="hover:bg-gray-100 hover:rounded-full p-1 hover:text-gray-700 font-bold cursor-pointer"
          onClick={() => setPage((prev) =>{
            if(prev==0)
               return 0;
             else{
              return prev-1
             }
          })}
        >
          <FiArrowLeft />
        </button>
        <button
          className="hover:bg-gray-100 hover:rounded-full p-1 hover:text-gray-700 font-bold cursor-pointer"
          onClick={() => setPage((prev) => prev + 1)}
        >
          <FiArrowRight />
        </button>
      </div>
    </div>
  )
}

export default SonarQubeGrid