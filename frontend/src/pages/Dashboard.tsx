import React from 'react'
import { IoIosArrowRoundDown } from "react-icons/io";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
function Dashboard() {
  return (
   <div className='flex-1 h-full min-w-0  flex flex-col overflow-y-auto '>
  <header className='w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3'>
    <h2 className='text-xl text-black font-mono font-bold'>Overview</h2>
    
   
  </header>
  <div className='  p-5 flex flex-col gap-4 py-6 '>
     <div className='flex-1 grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1'>
      <div className='w-full h-30 border border-gray-300 rounded-xl p-4 flex flex-col justify-between'>
         <span className='block text-[12px] text-gray-500 font-serif'>{"Raw finding".toUpperCase()}</span>
         <span className='text-3xl block font-bold font-mono'>128</span>
         <span className='text-[12px] text-gray-500 font-mono'>across 4 scanners this run</span>
      </div>
      <div className='w-full h-30 border border-gray-300 rounded-xl p-4 flex flex-col justify-between'>
         <span className='block text-[12px] text-gray-500 font-serif'>{"Correlated clusters".toUpperCase()}</span>
         <span className='text-3xl block font-bold font-mono'>4</span>
         <span className='text-[12px] text-green-700 font-mono flex place-items-center '>
          <  IoIosArrowRoundDown size={20} /> from 51 pre-correlation</span>
      </div>
      <div className='w-full h-30 border border-gray-300 rounded-xl p-4 flex flex-col justify-between'>
         <span className='block text-[12px] text-gray-500 font-serif'>{"High-confidence causes".toUpperCase()}</span>
         <span className='text-3xl block font-bold font-mono'>9</span>
         <span className='text-[12px] text-red-700 font-mono'>≥ 85% causal likelihood</span>
      </div>
      <div className='w-full h-30 border border-gray-300 rounded-xl p-4 flex flex-col justify-between'>
         <span className='block text-[12px] text-gray-500 font-serif'>{"Deployment gate".toUpperCase()}</span>
         <span className='text-3xl block font-bold font-mono text-red-700'>1 blocked
</span>
         <span className='text-[12px] text-gray-500 font-serif'>unresolved high-confidence cause</span>
      </div>

     </div>
     <div className='grid grid-cols-[7fr_6fr] gap-4'>
        <div className='max-h-min pb-4 w-full border border-gray-200 rounded-xl  shadow-2xl shadow-mauve-200'>


         <div className='w-full p-3 border-b border-gray-300 flex flex-col gap-1 relative'>
          <h2 className='text-sm font-mono'>Correlated clusters</h2>
          <p className='text-[12px] text-gray-500'>Ranked by causal likelihood</p>
          <div className='absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 py-1 px-4 text-gray-600 font-serif border border-gray-300 rounded-2xl text-[12px]'>high confidence first</div>
         </div>

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        

         {/* row-1*/}

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        
           {/* row-1*/}

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        
          {/* row-1*/}

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        
          {/* row-1*/}

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        
          {/* row-1*/}

         <div className='flex  p-3 px-5  gap-3 border-b  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>
        
        
         {/* row 1 */}
         <div className='flex  p-3 px-5  gap-3  border-gray-300 place-items-center'>
          <div className='h-12 w-12 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center'>
               95%
          </div>
          <div className='flex flex-col '>
            <h2 className='text-sm font-serif font-semibold'>SQL string concatenation in query builder</h2>
             <h2 className='flex gap-3 text-gray-500 font-medium'> <span className='text-[12px] '>4 findings</span>
            <span className='text-[12px]'>src/db/query-builder.ts</span></h2>
          </div>
          <div className='h-full  justify-center place-items-center gap-2 grid  grid-cols-3'>
            {/* <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              sonar

            </div> */}
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              Gitleak

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              semgrep

            </div>
            <div className='bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm'>
              trivy

            </div>

          </div>
          <div className='h-full flex justify-center place-items-center mr-0'>
                 <MdOutlineKeyboardArrowRight/>
          </div>

         </div>

         
        
         
        </div>
        {/* second card */}
        <div className='w-full  border border-gray-300 rounded-xl shadow-2xl shadow-mauve-200 pb-3 '>
          <div className=' w-full border-b border-gray-300 p-3 relative '>
            <h2 className='font-serif'>Root cause detail</h2>
            <p className='text-[12px] text-gray-400'>Cluster #34 — 4 correlated findings</p>
            <span className='absolute right-2 text-red-800 bg-red-200 top-1/2 text-[12px] font-semibold p-1 font-mono px-3 rounded-2xl -translate-y-1/2 '>Deploy blocked</span>
          </div>
          <div className='p-3 flex flex-col gap-1 py-2'>
            <h2 className='text-[17px] font-bold font-serif '>SQL string concatenation in query builder</h2>
            <p className='text-[12px] text-gray-500'>src/db/query-builder.ts · lines 112–128</p>
          </div>
          <div className='relative w-full p-3 py-2'>
            
            <div className="w-full">
  <div className="flex justify-between items-center mb-1">
    <p className='text-[12px] text-gray-600 font-mono'>Causal likelihood  </p>
    <span className="text-sm font-semibold text-red-700">94%</span>
  </div>
  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
    <div className="h-full bg-red-700 rounded-full" style={{width:"94%"}}></div>
  </div>
</div>

          </div>
          <div className='p-3'>
  <span className='block text-[14px] font-serif text-gray-600'>Correlated findings</span>
  <div className='border-b border-gray-400 p-2 '>
    
    <span className=' text-sm font-serif flex place-items-center gap-1'><span className='flex w-1.5 h-1.5 rounded-full bg-gray-400 '></span>
SonarQube — SQL injection risk, blocker severity</span>
<span className='text-[12px] text-gray-400 px-3'>query-builder.ts:118</span>
  </div>
  <div className=' p-2 '>
    
    <span className=' text-sm font-serif flex place-items-center gap-1'><span className='flex w-1.5 h-1.5 rounded-full bg-gray-400 '></span>
Semgrep — unsanitized input reaches query string</span>
<span className='text-[12px] text-gray-400 px-3'>query-builder.ts:121</span>
  </div>
</div>
<div className='p-3 py-2 flex flex-col gap-3'>
  <span className='text-sm text-gray-500 font-mono'>Ranked candidate commits</span>
 <div className='w-full  border rounded-xl border-red-800 bg-red-100 flex justify-between p-2'>
  <span className='text-[14px] font-medium font-mono'>a3f9c1e</span>
  <span className='text-[14px] font-serif'>refactor: dynamic filter clause</span>
<span className='text-[14px] text-red-800 font-mono'>95%</span>
 </div>
 <div className='w-full  border rounded-xl border-gray-400 bg-gray-100 flex justify-between p-2'>
  <span className='text-[14px] font-medium font-mono'>a3f9c1e</span>
  <span className='text-[14px] font-serif'>refactor: dynamic filter clause</span>
<span className='text-[14px] text-black font-mono'>95%</span>
 </div>

</div>
<div className='p-3 py-2 flex flex-col gap-3'>
  <div className='w-full p-4 bg-black text-white flex flex-col gap-2 rounded-xl'>
    <h2 className='text-gray-400 text-sm font-mono'>LLM root-cause explanation</h2>
    <p className='text-[14px]'>Commit a3f9c1e introduced a dynamic WHERE clause built via direct string concatenation of the `filter` param. Both flagged lines trace to this change; no parameterization was added, matching the injection pattern both scanners independently flagged.</p>

  </div>

</div>
<div className='p-3 py-2 flex  gap-3'>
  <button className='w-full p-2 flex justify-center border border-gray-200 text-sm font-semibold font-mono rounded-sm hover:border-gray-400 cursor-pointer'>Assign to author</button>
  <button className='w-full p-2 flex justify-center border border-gray-400 text-sm font-semibold font-mono rounded-sm bg-red-500 text-white cursor-pointer'  >Block merge</button>
</div>
        </div>
     </div>
    </div>
</div>
  )
}

export default Dashboard