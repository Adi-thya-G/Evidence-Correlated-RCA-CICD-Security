import { useLocation } from 'react-router-dom';
import './App.css'
import SideNav from '@root/components/SideNav'
import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react';
import {useUserStore } from "@/stores/userAuth"
import { useRepoStore} from '@/stores/repoStore';
import type { repoList } from '@/stores/repoStore';
function App() {
  const repoInitialFetch = useRepoStore((s) => s.initialFetch);
  const defualt = useRepoStore((s) => s.default);
  const repository = useRepoStore((s) => s.repository);

  const initialFetch = useUserStore((s) => s.initialFetch);

  const location = useLocation();

  const [header, setHeader] = useState("");

  const [selectedRepo, setSelectedRepo] = useState("");

  const updateRepo=useRepoStore((s)=>s.update)

  // Fetch data
  useEffect(() => {
    initialFetch();
    repoInitialFetch();
  }, [initialFetch, repoInitialFetch]);

  // Set selected repo when default repo arrives
  useEffect(() => {
    if (defualt) {
      setSelectedRepo(defualt.name);
    }
  }, [defualt]);


  useEffect(() => {
    const data = location.pathname.split("/")[1];

    setHeader(
      data.charAt(0).toUpperCase() +
      data.slice(1).toLowerCase()
    );
  }, [location]);

  return (
    <div className="w-full h-screen flex flex-row overflow-y-hidden">

      <SideNav />

      <div className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto">

        <header className="w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3">

          <h2 className="text-xl text-black font-serif font-bold">
            {header}
          </h2>

          <div>
            <select
              className="p-2 border rounded-sm text-[14px] outline-none  bg-mauve-50 border-gray-400"
              value={selectedRepo}
              onChange={(e) => {
                setSelectedRepo(e.target.value);
                const selectRepo=repository.filter((ele)=>ele.name==e.target.value)
                updateRepo(selectRepo[0]);

              }}
            >
              {repository.map((ele) => (
                <option
                  value={ele.name}
                  key={ele.repo_id}
                >
                  {ele.name}
                </option>
              ))}
            </select>
          </div>

        </header>

       <div >
         <Outlet />

       </div>

      </div>
    </div>
  );
}
export default App
