import { useEffect, useState } from 'react'
import { getSourceCode } from "@/api/sonarQubeApi"

function SonarDetailsCard({ key1, value }: { key1: string; value?: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-[12px] text-gray-800 font-serif block'>{key1}</span>
      <span className='text-[13px] font-serif font-semibold'> {value ?? '—'}</span>
    </div>
  )
}

interface queryProps {
  key: string;
  line: number;
  context?: number;
}

type SourceLine = {
  line: number
  code: string       // syntax-highlighted HTML string from SonarQube
  isFlagged: boolean // true for the line the issue is actually on
}

// The full issue object this panel is showing detail for — same shape as
// the rows coming out of SonarQubeGrid. Passed in by whatever parent
// tracks "which issue is currently selected."
type IssueDetail = {
  type: string        // BUG | VULNERABILITY | CODE_SMELL
  severity: string     // BLOCKER | CRITICAL | MAJOR | MINOR | INFO
  status: string        // OPEN | CONFIRMED | RESOLVED | CLOSED
  effort: string
  rule: string
  author?: string
  message: string
  component: string
  line: number
  tags?: string[]
}

function SourceCode({
  sourceCode,
  issue,
}: {
  sourceCode: queryProps | null
  issue?: IssueDetail
}) {
  const [data, setData] = useState<SourceLine[]>([])

  useEffect(() => {
    if (sourceCode != null) {
      getSourceCode(sourceCode).then((res:Array<any>) => {
        setData(res ?? [])
      })
    }
  }, [sourceCode])

  const filePath = issue
    ? String(issue.component ?? '').split(':').slice(1).join(':') || issue.component
    : undefined

  return (
    <div className='w-full h-max rounded-xl border border-gray-300 pb-5'>
      <div className='w-full p-3 flex flex-col place-items-baseline border-b border-gray-300'>
        <h2 className='text-[14px] font-serif '>Issue detail</h2>
        <p className='text-gray-500 text-[12px] font-serif'>
          {filePath ? `${filePath}:${issue?.line}` : 'Select an issue'}
        </p>
      </div>

      <div className='p-3 flex flex-col gap-2'>
        <h2 className='text-sm font-serif  font-semibold'>
          {issue?.message ?? 'No issue selected'}
        </h2>
        <p className='text-gray-500 font-serif text-[13px]'>
          {filePath ? `${filePath} · line ${issue?.line}` : ''}
        </p>

        <div className='flex gap-3 p-3 bg-mauve-100 rounded-sm '>
          <div className='w-full  flex flex-col gap-2'>
            <SonarDetailsCard key1={"Type"} value={issue?.type} />
            <SonarDetailsCard key1={"Severity"} value={issue?.severity} />
            <SonarDetailsCard key1={"Status"} value={issue?.status} />
          </div>
          <div className='w-full  flex flex-col gap-2'>
            <SonarDetailsCard key1={"Effort"} value={issue?.effort} />
            <SonarDetailsCard key1={"Rule"} value={issue?.rule} />
            <SonarDetailsCard
              key1={"Tags"}
              value={issue?.tags?.length ? issue.tags.join(', ') : '—'}
            />
          </div>
        </div>
      </div>

      <div className='w-full p-3'>
        <div className='bg-black text-white font-serif p-2 rounded-sm'>
          {data.length === 0 && (
            <div className='text-gray-400 text-[12px] p-2'>No source lines to show.</div>
          )}
          {data.map((lineData) => (
            <div
              key={lineData.line}
              className={`p-1 flex gap-3 text-[12px] whitespace-pre-wrap break-all ${
                lineData.isFlagged ? 'bg-red-950 block' : ''
              }`}
            >
              <span className='text-gray-400 select-none shrink-0'>{lineData.line}</span>
              <span
                // SonarQube returns pre-highlighted HTML (spans with syntax
                // classes) per line, not plain text — must be injected as
                // HTML rather than rendered as a string.
                dangerouslySetInnerHTML={{ __html: lineData.code || '&nbsp;' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-center'>
        <button className='text-white bg-black font-serif  px-4 rounded-sm cursor-pointer p-2 text-[14px]'>
          Assign to Author
        </button>
      </div>
    </div>
  )
}

export default SourceCode