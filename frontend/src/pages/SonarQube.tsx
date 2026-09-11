import React, { useState } from 'react'
import SonarCard from "@root/components/SonarCard"
import SeverityCard from "@root/components/SeverityCard"

const menu = ["Issues","Hotspot",];



function SonarQube() {
 
  const [param,setParams]=useState("issues");

  return (
    <div className='p-6 flex flex-col gap-7'>
      <div className='w-full grid grid-cols-5 gap-3'>
        <SonarCard heading='Issues' value='54' description='bugs, vulnerabilities, smells' className=''/>
         <SonarCard heading='Issues' value='54' description='bugs, vulnerabilities, smells' className=''/>
          <SonarCard heading='Issues' value='54' description='bugs, vulnerabilities, smells' className=''/>
           <SonarCard heading='Issues' value='54' description='bugs, vulnerabilities, smells' className=''/>
            <SonarCard heading='Issues' value='54' description='bugs, vulnerabilities, smells' className=''/>
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
      <div className='w-full  rounded-xl border border-gray-300 pb-4'>
        <div className='p-3 px-6 flex justify-start '>
          <div>
            <h2 className='text-[17px] font-serif font-semibold'>Open issues</h2>
            <p className='text-[13px] text-gray-500 font-serif'>Sorted by severity</p>
          </div>
        </div>
        <div className='p-3 flex gap-3 border-t border-gray-300'>
          <SeverityCard title='MINOR'/>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-[14px] font-semibold font-serif'>Copying recursively might inadvertently add sensitive data to the container</h2>
            <p className='text-[12px] font-serif text-gray-500'>vulnerability
backend/Dockerfile :12
·
20min effort</p>
          </div>
          <div className='flex flex-1 justify-end place-items-start'>
            <span className='bg-mauve-100 text-gray-700 text-[12px] p-1 border-gray-600 rounded-sm'>docker</span>

          </div>
        </div>
        <div className='p-3 flex gap-3 border-t border-gray-300'>
          <SeverityCard title='CRITICAL'/>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-[14px] font-semibold font-serif'>Copying recursively might inadvertently add sensitive data to the container</h2>
            <p className='text-[12px] font-serif text-gray-500'>vulnerability
backend/Dockerfile:12
·
20min effort</p>
          </div>
          <div className='flex flex-1 justify-end place-items-start'>
            <span className='bg-mauve-100 text-gray-700 text-[12px] p-1 border-gray-600 rounded-sm'>docker</span>

          </div>
        </div>
         <div className='p-3 flex gap-3 border-t border-gray-300'>
          <SeverityCard title='MAJOR'/>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-[14px] font-semibold font-serif'>Copying recursively might inadvertently add sensitive data to the container</h2>
            <p className='text-[12px] font-serif text-gray-500'>vulnerability
backend/Dockerfile:12
·
20min effort</p>
          </div>
          <div className='flex flex-1 justify-end place-items-start'>
            <span className='bg-mauve-100 text-gray-700 text-[12px] p-1 border-gray-600 rounded-sm'>docker</span>

          </div>
        </div>
        <div>

        </div>

      </div>
<div className='w-full h-60 bg-amber-300'>

      </div>
    </div>

    </div>
  )
}

export default SonarQube