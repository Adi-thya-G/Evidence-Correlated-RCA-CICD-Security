import React, { useState } from 'react'
import Notification from '../../components/Notification'
import Correlation from '../../components/Correlation'
import DangerZone from '../../components/DangerZone'
import '../App.css'
const menu=["General","Scanners","Correlation","Notifications","Team & access","Danger zone"]

function Setting() {
 const [active,setActive]= useState<number>(0)
  return (
    <div className=' p-8 h-full flex flex-col gap-8 w-max'>
      <div className='w-max p-2 pr-10 flex place-items-center justify-start border-b border-gray-300 gap-8'>
        {
          menu.map((ele,index)=>(
            <span className={`text-sm font-medium px-1 ${index==active?"text-black":"text-gray-700 "}  relative font-serif cursor-pointer` } onClick={()=>setActive(index)}>
              {ele}
              {
                index==active&&<span className='w-full h-0.5 items-center bg-black block absolute -bottom-3/6 -translate-y-2/6'></span>
              }
            </span>
          ))
        }

      </div>
       {/* <Notification/> */}
       {/* <Correlation/> */}
       {/* <DangerZone/> */}

    </div>
  )
}

export default Setting