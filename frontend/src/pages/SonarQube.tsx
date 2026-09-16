import React, { useEffect, useState } from 'react'
import SonarCard from "@root/components/SonarCard"

import { useRepoStore } from '@/stores/repoStore';

import {GetSonarQubeReport, GetSonarQubeSummary} from "@/api/sonarQubeApi"
import SonarQubeGrid  from "@root/components/SonarQubeGrid"
import SourceCode from "@root/components/SourceCode"

const menu = ["Issues","Hotspot",];


interface queryProps {
  key: string;
  line: number;
  context?: number;
}




function SonarQube() {

  const [data,setData]=useState<any>();
  const defaultRepo = useRepoStore((s) => s.default)??null
  const [page,setPage]=useState<number>(1);
  const [sourceCode,setSelectedSource]=useState<queryProps|null>(null)
  const [issues,setIssues]=useState<any>({});
  const [summary, setSummary] = useState<any>(null); // add this

   useEffect(() => {
    if (defaultRepo != null) {
      GetSonarQubeReport({ projectKey: String(defaultRepo.repo_id), page: page, page_size: 7 }).then((res) => {
        setData(res);
      });

      // add this second call
      setSummary(null)
      GetSonarQubeSummary({ projectKey: String(defaultRepo.repo_id) }).then((res) => {
        setSummary(res);
        console.log(res,"summary")
      });
    }
  }, [defaultRepo, page]);

 

  useEffect(()=>{
    
    if(sourceCode!=null){
      setIssues(data.issues.filter((ele:any)=>ele?.
component==sourceCode.key)[0])
console.log(issues,sourceCode)
    }

  },[sourceCode])
 console.log(data?.issues[0]?.creationDate,data?.totalIssues
)
  const [param,setParams]=useState("issues");


  return (
    <div className='p-6 flex flex-col gap-7 max-h'>
      <div className='w-full grid grid-cols-5 gap-3'>
  <SonarCard
    heading='Issues'
    value={data?.totalIssues ?? "_"}
    description='bugs, vulnerabilities, smells'
     className=''
  />
  <SonarCard
    heading='Vulnerabilities'
    value={summary?.Vulnerabilities ?? "_"}
    description={summary?.Vulnerabilities_blocker ? `${summary.Vulnerabilities_blocker} blocker severity` : "no blockers"}
     className='text-amber-700'
  />
  <SonarCard
    heading='Security Hotspots'
    value={summary?.Security_hotspots ?? "_"}
    description='to review'
     className=''
  />
  <SonarCard
    heading='Code Smells'
    value={summary?.Code_smells ?? "_"}
    description={summary?.Code_smells_effort_label ? `≈ ${summary.Code_smells_effort_label} estimated effort` : ""}
    className=''
  />
  <SonarCard
    heading='Quality Gate'
    value={summary?.Quality_gate ?? "_"}
    description='pass/fail conditions'
     className='text-red-800'
  />
</div>
       <div className='w-full p-2 pr-10 flex place-items-center justify-start border-b border-gray-300 gap-8 '>
        <ul className='flex gap-4 text-[14px] font-serif '>
          {menu.map((ele)=>
          <>
          <li key={ele} className={`relative flex flex-col justify-center cursor-pointer ${param==ele?"text-black":"text-gray-500"}`} onClick={()=>setParams(ele)}>{ele} 

             <span className={`w-full h-0.5  absolute bg-black  -bottom-2  transform translate-y-1/2 duration-300  ${param==ele||"hidden"}`}></span>
          
          </li>
         
          </>
          )}
        </ul>
    </div>

    {/*this main content */}
    
    <div className='w-full grid grid-cols-[6fr_4fr] gap-6'>
      {/* first card */}
       {data?.issues!=undefined && <SonarQubeGrid data={data} setPage={setPage} setSelectedSource={setSelectedSource} sourceCode={sourceCode}/>}
      {/*second card design */}
      <SourceCode sourceCode={sourceCode} issue={issues} />
    </div>

    </div>
  )
}

export default SonarQube