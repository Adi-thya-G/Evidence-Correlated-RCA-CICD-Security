import React from 'react'

interface Finding {
  _id: string
  severity: string
  ruleId: string
  message: string
  file: string
  startLine: number
  endLine: number
  author?: string
  commit?: string
}

interface queryProps {
  component: string
  line: number
  context?: number
  scanId: string
}

function GitleaksGrid({
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
    setSelectedSource({
      component: finding.file,
      scanId: data.scanId,
      line: finding.startLine,
      context: 5,
    });
  };

  return (
    <div className='w-full rounded-xl border border-gray-300'>
      <table className='w-full text-[13px] font-serif'>
        <thead>
          <tr className='border-b border-gray-300 text-left text-gray-500'>
            <th className='p-3'>Severity</th>
            <th className='p-3'>Rule</th>
            <th className='p-3'>Message</th>
            <th className='p-3'>File</th>
            <th className='p-3'>Line</th>
          </tr>
        </thead>
        <tbody>
          {data.findings.map((finding) => (
            <tr
              key={finding._id}
              onClick={() => handleRowClick(finding)}
              className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                sourceCode?.component === finding.file && sourceCode?.line === finding.startLine
                  ? 'bg-gray-100'
                  : ''
              }`}
            >
              <td className='p-3'>{finding.severity}</td>
              <td className='p-3'>{finding.ruleId}</td>
              <td className='p-3'>{finding.message}</td>
              <td className='p-3'>{finding.file}</td>
              <td className='p-3'>{finding.startLine}</td>
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

export default GitleaksGrid