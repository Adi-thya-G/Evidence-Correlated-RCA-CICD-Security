

import './App.css'

import SideNav from '../components/SideNav'
import Dashboard from './pages/Dashboard'
import Finding from './pages/Finding'
import Setting from './pages/Setting'

function App() {
  

  return (
    
 <div className='w-full h-screen flex flex-row  overflow-y-hidden'>
  
  <SideNav/>
    <div className='flex-1 h-full min-w-0  flex flex-col overflow-y-auto '>
     <header className='w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3'>
       <h2 className='text-xl text-black font-serif font-bold'>Settings</h2>
       
      
     </header>
     {/* <Finding/>
     <Dashboard/> */}
     <Setting/>
   </div>
 </div>
      
    
  )
}

export default App
