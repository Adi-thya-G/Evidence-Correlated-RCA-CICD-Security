import { useLocation } from 'react-router-dom';
import './App.css'
import SideNav from '@root/components/SideNav'
import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react';
import {useUserStore } from "@/stores/userAuth"
function App() {

  const initialFetch=useUserStore((s)=>s.initialFetch)

  const location=useLocation();
  const [header,setHeader]=useState<string>("")

    useEffect(() => {
    initialFetch().then();
  }, [initialFetch]);

  useEffect(()=>{
    const data=location.pathname.split("/")[1]
    setHeader(data.charAt(0).toUpperCase()+data.slice(1).toLowerCase())
  },[location])

  return (
    
 <div className='w-full h-screen flex flex-row  overflow-y-hidden'>
  
  <SideNav/>
    <div className='flex-1 h-full min-w-0  flex flex-col overflow-y-auto '>
     <header className='w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3'>
       <h2 className='text-xl text-black font-serif font-bold'>{header}</h2>
       
     </header>
     <Outlet/>
   </div>
 </div>
      
    
  )
}

export default App
