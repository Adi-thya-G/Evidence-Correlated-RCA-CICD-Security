import { Icon } from "@iconify/react";

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
  return (
    <div className='w-60 max-md:w-30 h-full flex flex-col  border-r  border-gray-300 shadow-2xl shadow-mist-200  '>
       <div className='w-full flex  px-6 py-8 '>
       <h2 className="font-mono font-bold text-[20px] relative flex gap-2 pl-4">
  <span className="w-2 h-2 bg-red-600 absolute bottom-1/4 left-0 rounded-full"></span>
  Verdict
</h2>


       </div>
       <div className='w-full  flex flex-col flex-1   justify-between'>
          <ul className='flex flex-col gap-1  w-full px-2'>
        {



        menuItems.map((item)=>(
          <li
    key={item.name}
    className="flex items-center gap-3 group px-2 py-2 text-[16px] font-medium text-gray-600 hover:bg-black hover:text-white hover:rounded-xl cursor-pointer"
  >
    <Icon icon={item.icon} className="text-xl shrink-0" />
    {item.name}
    {/* <span className="text-[10px] text-gray-700 group-hover:text-white ml-auto mr-1">{430}</span> */}
  </li>
        
        ))}
            

          </ul>
        <div className="w-full flex items-center  gap-3 border-t border-gray-300  px-4 py-4">
  
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black font-mono text-sm font-bold text-white">
    AK
  </span>

  <div className="flex flex-col">
    <h2 className="text-sm font-medium leading-tight">Adithya</h2>
    <p className="text-xs text-gray-400 leading-tight">admin</p>
  </div>

</div>
       </div>
    </div>
  )
}

export default SideNav