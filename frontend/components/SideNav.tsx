import { useUserStore } from "@/stores/userAuth";
import { Icon } from "@iconify/react";
import { Navigate, NavLink } from "react-router-dom";
import { IoMdLogOut } from "react-icons/io";
import { useRepoStore } from "../src/stores/repoStore";
const menuItems = [
  { name: "Overview", icon: "solar:home-2-outline" },
  { name: "Findings", icon: "solar:danger-triangle-outline" },
  { name: "Correlations", icon: "solar:link-round-outline" },
  { name: "Root causes", icon: "solar:bug-outline" },
  { name: "Deployment gate", icon: "solar:shield-check-outline" },
  { name: "SonarQube", icon: "solar:radar-2-outline" },
  { name: "Semgrep", icon: "solar:code-square-outline" },
  { name: "Trivy", icon: "solar:shield-warning-outline" },
  { name: "Gitleaks", icon: "mdi:water-alert-outline" },
  { name: "Settings", icon: "solar:settings-outline" },
];

function SideNav() {

  const {isAuthenticated,role,avatarUrl,displayName,login,clearUser} =useUserStore()
  const clearRepo =useRepoStore((s)=>s.clear)
 
  return (
    <div className="w-60 max-md:w-30 h-full flex flex-col  border-r  border-gray-300 shadow-2xl shadow-mist-200  ">
      <div className="w-full flex  px-6 py-8 ">
        <h2 className="font-mono font-bold text-[20px] relative flex gap-2 pl-4">
          <span className="w-2 h-2 bg-red-600 absolute bottom-1/4 left-0 rounded-full"></span>
          Verdict
        </h2>
      </div>
      <div className="w-full  flex flex-col flex-1   justify-between">
        <ul className="flex flex-col gap-1  w-full px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.name.toLocaleLowerCase()}
              className={({ isActive }) =>
                `flex items-center gap-3 group px-2 py-2 text-[16px] font-medium rounded-xl cursor-pointer transition-colors
     ${
       isActive
         ? "bg-black text-white"
         : "text-gray-600 hover:bg-black hover:text-white"
     }`
              }
            >
              <Icon icon={item.icon} className="text-xl shrink-0" />
              {item.name}
              {/* <span className="text-[10px] text-gray-700 group-hover:text-white ml-auto mr-1">{430}</span> */}
            </NavLink>
          ))}
        </ul>
        {
          isAuthenticated&&
          (
            <div className="w-full flex items-center  gap-3 border-t border-gray-300  px-4 py-4 relative">
            {
              
              avatarUrl 
              &&
              (<img className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-mono text-sm font-bold text-white" src={avatarUrl}/>
              )
              ||
              ( <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-mono text-sm font-bold text-white">
            { displayName &&(displayName?.charAt(0)+" "+displayName?.charAt(displayName.length-1) )||
            
             login&& (login?.charAt(0)+login?.charAt(login.length-1))}
          </span>)
            }

          <div className="flex flex-col ">
            <h2 className="text-sm font-medium leading-tight">{displayName||login}</h2>
            <p className="text-xs text-gray-400 leading-tight">{role}</p>
            <div className="absolute right-3 group">
              <div className="absolute -translate-y-1/2 -translate-x-4/3 group-hover:block hidden text-sm p-1 border border-gray-200 rounded-sm shadow shadow-gray-200 bg-white">
                logout
              </div>
              <button className="text-[13px] font-serif font-semibold flex justify-center place-items-center gap-2 border border-gray-200 shadow shadow-gray-300 rounded-xl cursor-pointer hover:bg-red-500 hover:text-white  p-2"
              onClick={()=>{
                clearUser()
                clearRepo()
                Navigate({to:"/login"})
              }}
              title="logout"
              
              > <IoMdLogOut size={16} width={10}/></button>

            </div>
          </div>
        </div>
          )
        }
      </div>
    </div>
  );
}

export default SideNav;
