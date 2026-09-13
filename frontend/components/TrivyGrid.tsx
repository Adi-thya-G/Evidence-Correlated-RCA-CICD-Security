import React from 'react'

interface Finding {
  _id: string
  severity: string
  message: string
  ruleId: string
  file: string
  pkgName?: string
  installedVersion?: string
  fixedVersion?: string
  line?: number
}

interface queryProps {
  component: string
  scanId: string
  line?: number
  pkgName?: string
  context?: number
}

function TrivyGrid({
  data,
  setPage,
  setSelectedSource,
  sourceCode,
}: {
  data: { findings: Finding[]; page: number; totalPages: number; scanId: string }
  setPage: (p: number) => void
  setSelectedSource: (q: queryProps) => void
  sourceCode: queryProps | null
}) {
  const handleRowClick = (finding: Finding) => {
    const query: queryProps = finding.line
      ? { component: finding.file, scanId: data.scanId, line: finding.line, context: 5 }
      : { component: finding.file, scanId: data.scanId, pkgName: finding.pkgName, context: 5 };
    setSelectedSource(query);
  };

  return (
    <div className='w-full rounded-xl border border-gray-300'>
      <table className='w-full text-[13px] font-serif'>
        <thead>
          <tr className='border-b border-gray-300 text-left text-gray-500'>
            <th className='p-3'>Severity</th>
            <th className='p-3'>Message</th>
            <th className='p-3'>Package</th>
            <th className='p-3'>File</th>
          </tr>
        </thead>
        <tbody>
          {data.findings.map((finding) => (
            <tr
              key={finding._id}
              onClick={() => handleRowClick(finding)}
              className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                sourceCode?.component === finding.file &&
                (sourceCode?.pkgName === finding.pkgName || sourceCode?.line === finding.line)
                  ? 'bg-gray-100'
                  : ''
              }`}
            >
              <td className='p-3'>{finding.severity}</td>
              <td className='p-3'>{finding.message}</td>
              <td className='p-3'>{finding.pkgName ?? '—'}</td>
              <td className='p-3'>{finding.file}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='flex justify-center gap-3 p-3'>
        <button
          disabled={data.page <= 1}
          onClick={() => setPage(data.page - 1)}
          className='px-3 py-1 border rounded disabled:opacity-40'
        >
          Prev
        </button>
        <span className='text-[12px] self-center'>
          Page {data.page} of {data.totalPages}
        </span>
        <button
          disabled={data.page >= data.totalPages}
          onClick={() => setPage(data.page + 1)}
          className='px-3 py-1 border rounded disabled:opacity-40'
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default TrivyGrid