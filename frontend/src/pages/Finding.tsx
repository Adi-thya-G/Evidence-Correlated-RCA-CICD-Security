import React, { useState } from 'react'
const array=["All","SonarQube","Semgrep","Trivy","Gitleaks"]

function Finding() {
  const [active,setActive]=useState<number>(0);
  return (
    <div className='w-full p-6 px-7 flex flex-col gap-7 '>
       <div className='flex gap-4'>
      {
        array.map((ele,index)=>(
          <div key={index} className={` p-2 px-3  w-max ${active==index?"bg-black text-white font-semibold":"bg-mauve-200 text-gray-700"}  text-[12px] rounded-2xl flex flex-row  gap-2 font-mono cursor-pointer `} onClick={()=>setActive(index)}>
        <span>{ele}</span>
     (128)
      </div>
        ))
      }
     
    </div>
    <div className='w-full '>
      <table className='w-full'>
        <thead className='w-full justify-start'>
          <tr className='text-[12px] text-gray-500  font-mono w-full place-items-end justify-items-start border-b border-gray-300 '>
            <th className='text-start px-2'>Finding</th>
            <th className='text-start px-2'>Scanner</th>
            <th className='text-start px-2'>Severity	</th>
            <th className='text-start px-2'>Status</th>
            <th className='text-start px-2'>Detected</th>
          </tr>
        </thead>
        <tbody>
 {
  [1,2,3,4,5,6,7,8,11].map((ele)=>(
<tr className={`${ele==11||"border-b"} border-gray-300 hover:bg-mauve-100 cursor-pointer `} key={ele}>
    <td className='px-2'>
      <div className='w-full flex flex-col items-start gap-0.5 p-2'>
        <h2 className='text-[15px] font-serif'>
          SQL injection risk in dynamic query
        </h2>

        <p className='text-[13px] text-gray-400 font-serif'>
          src/db/query-builder.ts:118
        </p>
      </div>
    </td>
    <td className='px-2'>
      <div className=' p-1 bg-mauve-200 text-gray-700 text-[12px] flex justify-center place-items-center w-min rounded-sm border border-gray-300'>
        sonarQube

      </div>

    </td>
     <td className='px-2 '>
     <div className='w-min p-1  px-2 bg-red-100 text-red-600 text-[12px] font-mono rounded-2xl font-semibold'>
        Critical
     </div>

    </td>
    <td className='px-2 '>
     <div className='flex gap-1 place-items-center'>
      <span className='w-1 h-1 bg-green-800 rounded-full '></span>
      <span className='text-green-700 text-[12px] font-mono'>resolved</span>

     </div>

    </td>
    <td>
      <div className='flex gap-1 text-gray-400 font-mono text-[12px]'>
        <span className=''>2h</span>
        <span>ago</span>

      </div>
    </td>
  </tr>
  ))
   
 }
</tbody>
      </table>
    </div>

    </div>
   
  )
}

export default Finding