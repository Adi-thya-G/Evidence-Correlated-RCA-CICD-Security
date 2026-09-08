
import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "@/stores/userAuth";
import { useLocation } from "react-router-dom";
function ProtectedRoute() {

  const {isAuthenticated,isLoading}=useUserStore()
  
 const location = useLocation();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

export default ProtectedRoute