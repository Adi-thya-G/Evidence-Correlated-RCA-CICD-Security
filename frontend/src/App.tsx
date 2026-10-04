import { useLocation } from "react-router-dom";
import "./App.css";
import SideNav from "@root/components/SideNav";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userAuth";
import { useRepoStore } from "@/stores/repoStore";
import { Toaster } from "sonner";
import {Bell} from "lucide-react"
import PopNotification from "@root/components/PopNotification";
import {useNotification} from "@/stores/useNotification"



function App() {

   const notificationData=useNotification((s)=>s.notifications)
   const fetchNotification=useNotification((s)=>s.fetchNotifications)
   const [notification, setNotification]=useState<boolean>(false);



  //hook that will fetch data from bakend about repository list
  const repoInitialFetch = useRepoStore((s) => s.initialFetch);
  // defualt repository mean current repo or the newest repo that as been change that repo is selected as default repo
  const defualt = useRepoStore((s) => s.default);
  // this will holld the entire repo in form array of object
  const repository = useRepoStore((s) => s.repository);
  // this is user initial fetch about user data
  const initialFetch = useUserStore((s) => s.initialFetch);
  // this is user reprsent current location header of website in header bar
  const location = useLocation();
   // usestate handle and manipulate current location of website that should displayed in navbar
  const [header, setHeader] = useState("");
  // this usestate hook are used to tell current selected repository by used it initail state will be default repository
  const [selectedRepo, setSelectedRepo] = useState("");
  //this will handle that update of selected repo in globally
  const updateRepo = useRepoStore((s) => s.update);

  // Fetch data about user and also repository
  useEffect(() => {
    initialFetch();
    repoInitialFetch()
    fetchNotification()
  }, [initialFetch, repoInitialFetch]);



  // Set selected repo when default repo arrives here setting selected repo as default repos
  useEffect(() => {
    if (defualt) {
      console.log(defualt)
      setSelectedRepo(defualt.name);
    }
  }, [defualt]);




  // this useeffect hooks is used handle current activity navbar;
  useEffect(() => {
    const data = location.pathname.split("/")[1];

    setHeader(data.charAt(0).toUpperCase() + data.slice(1).toLowerCase());
  }, [location]);

  return (
    <div className="w-full h-screen flex flex-row overflow-y-hidden">
      <Toaster position="top-right"/>
      <SideNav />

      <div className="flex-1 h-full min-w-0 flex flex-col  overflow-y-hidden relative">
          
        <header className="w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3">
          <h2 className="text-xl text-black font-serif font-bold">{header}</h2>

          <div className="flex items-center gap-3">
            <select
              className="p-2 border rounded-sm text-[14px] outline-none  bg-mauve-50 border-gray-400"
              value={selectedRepo}
              onChange={(e) => {
                setSelectedRepo(e.target.value);
                const selectRepo = repository.filter(
                  (ele) => ele.name == e.target.value,
                );
                updateRepo(selectRepo[0]);
              }}
            >
              {repository.map((ele) => (
                <option value={ele.name} key={ele.repo_id}>
                  {ele.name}
                </option>
              ))}
            </select>
            
             <div className="relative rounded-full w-8 h-8 flex items-center 
             justify-center bg-mauve-50 border border-gray-400 cursor-pointer" 
             onClick={()=>{setNotification((prev) => !prev)}}>
              
                <span className={`absolute -top-2/5 -right-1/4 text-center w-6 h-6 font-serif
               rounded-full text-[13px] text-white bg-red-500 border border-white ${notificationData.length==0?"hidden":"block"}`}>{notificationData.length}</span>
              
              <Bell size={18} className="text-gray-800" />
          </div>
          </div>
         
        </header>
         
        <div className="overflow-y-auto relative">
          {
            notification && <PopNotification/>
          }
        
          <Outlet />
        </div>
       
      </div>
    </div>
  );
}
export default App;
