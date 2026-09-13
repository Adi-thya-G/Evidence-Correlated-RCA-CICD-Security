import { useEffect, useState } from 'react'
import { getTrivySourceCode } from "../src/api/trivyApi"

function TrivyDetailsCard({ key1, value }: { key1: string; value?: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-[12px] text-gray-800 font-serif block'>{key1}</span>
      <span className='text-[13px] font-serif font-semibold'> {value ?? '—'}</span>
    </div>
  )
}

interface queryProps {
  component: string;   // file path, e.g. "package-lock.json"
  line?: number;       // present for config/misconfig findings that have a real line
  pkgName?: string;     // present for SCA (dependency) findings, used when line is absent
  context?: number;
  scanId: string;
}

type SourceLine = {
  lineNumber: number
  text: string
  isTarget: boolean
}

// The full finding object this panel is showing detail for — same shape as
// the rows coming out of TrivyGrid. Passed in by whatever parent tracks
// "which finding is currently selected."
type FindingDetail = {
  tool: string
  category: string        // sca | config | secret ...
  ruleId: string           // CVE-... or rule id
  severity: string         // CRITICAL | HIGH | MEDIUM | LOW | UNKNOWN
  message: string
  file: string
  pkgName?: string
  installedVersion?: string
  fixedVersion?: string
  line?: number
}

function SourceCode({
  sourceCode,
  issue,
}: {
  sourceCode: queryProps | null
  issue?: FindingDetail
}) {
  const [data, setData] = useState<SourceLine[]>([])

  useEffect(() => {
    if (sourceCode != null) {
      getTrivySourceCode(sourceCode).then((res: { data?: { lines?: SourceLine[] } }) => {
        setData(res?.data?.lines ?? [])
      })
    }
  }, [sourceCode])

  const filePath = issue?.file
  const locationLabel = issue
    ? issue.line
      ? `line ${issue.line}`
      : issue.pkgName
        ? `pkg: ${issue.pkgName}`
        : ''
    : ''

  return (
    <div className='w-full h-max rounded-xl border border-gray-300 pb-5'>
      <div className='w-full p-3 flex flex-col place-items-baseline border-b border-gray-300'>
        <h2 className='text-[14px] font-serif '>Finding detail</h2>
        <p className='text-gray-500 text-[12px] font-serif'>
          {filePath ? `${filePath}${locationLabel ? ` · ${locationLabel}` : ''}` : 'Select a finding'}
        </p>
      </div>

      <div className='p-3 flex flex-col gap-2'>
        <h2 className='text-sm font-serif  font-semibold'>
          {issue?.message ?? 'No finding selected'}
        </h2>
        <p className='text-gray-500 font-serif text-[13px]'>
          {filePath ? `${filePath}${locationLabel ? ` · ${locationLabel}` : ''}` : ''}
        </p>

        <div className='flex gap-3 p-3 bg-mauve-100 rounded-sm '>
          <div className='w-full  flex flex-col gap-2'>
            <TrivyDetailsCard key1={"Category"} value={issue?.category} />
            <TrivyDetailsCard key1={"Severity"} value={issue?.severity} />
            <TrivyDetailsCard key1={"Rule"} value={issue?.ruleId} />
          </div>
          <div className='w-full  flex flex-col gap-2'>
            <TrivyDetailsCard key1={"Package"} value={issue?.pkgName} />
            <TrivyDetailsCard key1={"Installed"} value={issue?.installedVersion} />
            <TrivyDetailsCard key1={"Fixed in"} value={issue?.fixedVersion} />
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
              key={lineData.lineNumber}
              className={`p-1 flex gap-3 text-[12px] whitespace-pre-wrap break-all ${
                lineData.isTarget ? 'bg-red-950 block' : ''
              }`}
            >
              <span className='text-gray-400 select-none shrink-0'>{lineData.lineNumber}</span>
              <span>{lineData.text || '\u00A0'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-center'>
        <button className='text-white bg-black font-serif  px-4 rounded-sm cursor-pointer p-2 text-[14px]'>
          View Advisory
        </button>
      </div>
    </div>
  )
}

export default SourceCode