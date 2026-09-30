import React, { useEffect, useState } from 'react'
import '../App.css'
import { NavLink, Outlet } from 'react-router-dom'
import {useSetting,useDangerZone} from '@/stores/useSettingsStore'
import { useRepoStore } from '@/stores/repoStore';
import type{repoList,InitialState} from "@/stores/repoStore"
 const menu = [
  { label: "General",        path: "general" },
  { label: "Scanners",       path: "scanners" },
  { label: "Correlation",    path: "correlation" },
  { label: "Notifications",  path: "notifications" },
  { label: "Team & access",  path: "team-access" },
  { label: "Danger zone",    path: "danger-zone" },
];

function Setting() {

  const fetchData=useSetting((s)=>s.fetchData)
  const fetchDangerData=useDangerZone((s)=>s.fetch_data)

   const defaultRepo=useRepoStore((s)=>s.default) as repoList

  useEffect(()=>{
    if(defaultRepo!=null){
    fetchData().then()
    fetchDangerData()
    }
  },[defaultRepo])

 const [active,setActive]= useState<number>(0)
  return (
    <div className=' p-8 h-full flex flex-col gap-8 w-max'>
      <div className='w-max p-2 pr-10 flex place-items-center justify-start border-b border-gray-300 gap-8'>
       {menu.map((ele) => (
  <NavLink
    key={ele.label}
    to={ele.path}
    className={({ isActive }) =>
      `text-sm font-medium px-1 relative font-serif cursor-pointer
       ${isActive ? "text-black" : "text-gray-700"}`
    }
  >
    {({ isActive }) => (
      <>
        {ele.label}
        {isActive && (
          <span className="w-full h-0.5 bg-black block absolute -bottom-3/6 -translate-y-2/6" />
        )}
      </>
    )}
  </NavLink>
))}
      </div>
      <Outlet/>
    </div>
  )
}

export default Setting