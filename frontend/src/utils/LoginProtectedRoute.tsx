
import { useUserStore } from '@/stores/userAuth'
import type React from 'react'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function LoginProtectedRoute({children}:{children:React.ReactNode}) {
  const initialFetch=useUserStore((s)=>s.initialFetch)
  useEffect(()=>{
    initialFetch().then()
  },[initialFetch])

 const { isAuthenticated, isLoading } = useUserStore()

   if (isAuthenticated) 
    return <Navigate to="/" replace />
  if (isLoading && !isAuthenticated) 
    return <div>loading.....</div>

 

  return <>{children}</>
}

export default LoginProtectedRoute