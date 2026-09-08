
import { useUserStore } from '@/stores/userAuth'
import type React from 'react'
import { Navigate } from 'react-router-dom'
function LoginProtectedRoute({children}:{children:React.ReactNode}) {
  const {isAuthenticated,isLoading,id} =useUserStore()
  if(!isAuthenticated)
     return <>{children}</>
  if(isLoading)
    return <div>loading.....</div>
  
  return <Navigate to={"/"} replace={true}/>
}

export default LoginProtectedRoute