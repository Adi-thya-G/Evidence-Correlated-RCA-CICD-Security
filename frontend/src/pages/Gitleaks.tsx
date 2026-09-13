import GitleaksGrid from "@root/components/GitleaksGrid"
import SourceCode from "@root/components/TrivySourceCode" // same source viewer works — it's just line-based
import { useState,useEffect } from "react";
import { useRepoStore } from "@/stores/repoStore";
import SonarCard from "@root/components/SonarCard";
import { GetGitleaksReport } from "@/api/gitleaks";
interface queryProps {
  component: string;
  line: number;
  context?: number;
  scanId: string;
}

function Gitleaks() {
  const [data, setData] = useState<any>();
  const defaultRepo = useRepoStore((s) => s.default) ?? null;
  const [page, setPage] = useState(1);
  const [sourceCode, setSelectedSource] = useState<queryProps | null>(null);
  const [issues, setIssues] = useState<any>({});

  useEffect(() => {
    if (defaultRepo != null) {
      GetGitleaksReport({ repo_id: defaultRepo.repo_id, page, pageSize: 7 }).then(setData);
    }
  }, [defaultRepo, page]);

  useEffect(() => {
  if (sourceCode != null && data?.findings) {
    const match = data.findings.find(
      (f: any) => f.file === sourceCode.component && f.startLine === sourceCode.line
    );
    setIssues(match);
    console.log(match, sourceCode);
  }
}, [sourceCode]);
  return (
    <div className='p-6 flex flex-col gap-7'>
      <div className='w-full grid grid-cols-3 gap-3'>
        <SonarCard heading='Secrets found' value={data?.totalFindings ?? '—'} description='exposed secrets detected' className='' />
        <SonarCard heading='Files affected' value={new Set(data?.findings?.map((f: any) => f.file)).size || '—'} description='distinct files with secrets' className='' />
        <SonarCard heading='Rule types' value={new Set(data?.findings?.map((f: any) => f.ruleId)).size || '—'} description='distinct secret patterns matched' className='' />
      </div>

      <div className='w-full grid grid-cols-[6fr_4fr] gap-6'>
        {data?.findings != undefined && (
          <GitleaksGrid data={data} setPage={setPage} setSelectedSource={setSelectedSource} sourceCode={sourceCode} />
        )}
        <SourceCode sourceCode={sourceCode} issue={issues} />
      </div>
    </div>
  );
}

export default Gitleaks;