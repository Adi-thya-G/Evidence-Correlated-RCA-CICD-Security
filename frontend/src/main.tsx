import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { createBrowserRouter, RouterProvider } from "react-router";
import Dashboard from '@/pages/Dashboard.tsx';
import ProtectedRoute from '@/utils/ProtectedRoute.tsx';
import { Navigate } from 'react-router';
import Setting from '@/pages/Setting.tsx';
import Correlation from '@root/components/Correlation.tsx'
import Notification from "@root/components/Notification.tsx"
import DangerZone from "@root/components/DangerZone.tsx"
import Finding from '@/pages/Finding.tsx';
import Login from '@/pages/Login.tsx'
import LoginProtectedRoute from '@/utils/LoginProtectedRoute.tsx';
import General from "@root/components/General.tsx"
import SonarQube from './pages/SonarQube.tsx';
const router=createBrowserRouter([
  {
    path:"/login",
    element:
    <LoginProtectedRoute>
      <Login/>
    </LoginProtectedRoute>
    
  },
  {
  path:"/",
  element: <App/>,
  children:[
  //  {
  //   element:<ProtectedRoute/>,
  //   children:[
      {
        index:true, element:<Navigate to={"/overview"} replace/>
      },
      {
        path:"overview",
        element:<Dashboard/>
      },
      {
       path:"findings",
       element:<Finding/>
      },
      {
        path:"sonarqube",
        element:<SonarQube/>
      },
      {
       path:"settings",
       element:<Setting/>,
       children:[
         {
          index:true, element:<Navigate to={"general"} replace={true}/>
        },
         {
          path:"general",element:<General/>
        },
        {
          path:"correlation",element:<Correlation/>
        },
        {
          path:"notifications",element:<Notification/>
        },
        {
          path:"danger-zone",element:<DangerZone/>
        },
       
       
      //  ]
      // }
    ]
   }
  ]

}])
createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router}/>
)
