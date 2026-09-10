import React, { useState } from 'react'
import SonarCard from "@root/components/SonarCard"
import { NavLink } from 'react-router-dom'

const menu = ["issues","hotspot",];



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
       <div className='w-full p-2 pr-10 flex place-items-center justify-start border-b border-gray-300 gap-8 relative'>
        <ul className='flex gap-4 text-[14px] font-serif '>
          {menu.map((ele)=>
          <>
          <li key={ele} className=''>{ele} 

             {ele.includes(param) && (<span className='w-20 h-0.5  absolute bg-black h-0.3 bottom-0 translate-y-1/2 '></span>)
          }
          </li>
         
          </>
          )}
        </ul>
    </div>
    </div>
  )
}

export default SonarQube