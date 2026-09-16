import React, { useEffect, useState } from 'react'
import SonarCard from "@root/components/SonarCard"

import { useRepoStore } from '@/stores/repoStore';

import { GetTrivyReport,GetTrivySummary } from "@/api/trivyApi"
import TrivyGrid from "@root/components/TrivyGrid"
import SourceCode from "@root/components/TrivySourceCode"

const menu = ["Vulnerabilities", "Misconfigurations"];

interface queryProps {
  component: string;
  line?: number;
  pkgName?: string;
  context?: number;
  scanId: string;
}

function Trivy() {
  const [data, setData] = useState<any>();
  const defaultRepo = useRepoStore((s) => s.default) ?? null;
  const [page, setPage] = useState<number>(1);
  const [sourceCode, setSelectedSource] = useState<queryProps | null>(null);
  const [issues, setIssues] = useState<any>({});
  const [param, setParams] = useState("Vulnerabilities");

  const [summary, setSummary] = useState<any>();

useEffect(() => {
  if (defaultRepo != null) {
    setSummary(null)
    GetTrivySummary({ repo_id: defaultRepo.repo_id }).then(setSummary);
  }
}, [defaultRepo]);

  useEffect(() => {
    if (defaultRepo != null) {
      setData(null)
      GetTrivyReport({ repo_id: defaultRepo.repo_id, page: page, pageSize: 7 }).then((res) => {
        setData(res);
        console.log(res);
      });
    }
  }, [defaultRepo, page]);

  useEffect(() => {
    if (sourceCode != null && data?.findings) {
      // match on file + pkgName (SCA) or file + line (SAST) since Trivy findings
      // don't always share a single unique key the way Sonar's "component" does
      const match = data.findings.filter((ele: any) => {
        const sameFile = ele.file === sourceCode.component;
        if (sourceCode.pkgName) return sameFile && ele.pkgName === sourceCode.pkgName;
        if (sourceCode.line) return sameFile && ele.line === sourceCode.line;
        return sameFile;
      })[0];
      setIssues(match);
      console.log(match, sourceCode);
    }
  }, [sourceCode]);

  return (
    <div className='p-6 flex flex-col gap-7'>
      <div className='w-full grid grid-cols-5 gap-3'>
        <SonarCard heading='Critical' value={summary?.counts?.CRITICAL ?? '—'} description='critical severity findings' className='' />
<SonarCard heading='High' value={summary?.counts?.HIGH ?? '—'} description='high severity findings' className='' />
<SonarCard heading='Medium' value={summary?.counts?.MEDIUM ?? '—'} description='medium severity findings' className='' />
<SonarCard heading='Low' value={summary?.counts?.LOW ?? '—'} description='low severity findings' className='' />
<SonarCard heading='Total' value={summary?.total ?? '—'} description='total findings' className='' />
      </div>

      <div className='w-full p-2 pr-10 flex place-items-center justify-start border-b border-gray-300 gap-8'>
        <ul className='flex gap-4 text-[14px] font-serif'>
          {menu.map((ele) => (
            <li
              key={ele}
              className={`relative flex flex-col justify-center cursor-pointer ${param == ele ? "text-black" : "text-gray-500"}`}
              onClick={() => setParams(ele)}
            >
              {ele}
              <span className={`w-full h-0.5 absolute bg-black -bottom-2 transform translate-y-1/2 duration-300 ${param == ele || "hidden"}`}></span>
            </li>
          ))}
        </ul>
      </div>

      <div className='w-full grid grid-cols-[6fr_4fr] gap-6'>
        {data?.findings != undefined && (
          <TrivyGrid data={data} setPage={setPage} setSelectedSource={setSelectedSource} sourceCode={sourceCode} />
        )}
        <SourceCode sourceCode={sourceCode} issue={issues} scanId={data?.scanId} />
      </div>
    </div>
  );
}

export default Trivy;