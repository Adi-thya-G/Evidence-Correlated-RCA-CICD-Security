

import './App.css'

import SideNav from '../components/SideNav'
import Dashboard from './pages/Dashboard'

function App() {
  

  return (
    
 <div className='w-full h-screen flex flex-row  overflow-y-hidden'>
  
  <SideNav/>
 <Dashboard/>
 </div>
      
    
  )
}

export default App
