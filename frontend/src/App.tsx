import { useLocation } from "react-router-dom";
import "./App.css";
import SideNav from "@root/components/SideNav";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userAuth";
import { useRepoStore } from "@/stores/repoStore";

function App() {
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
    repoInitialFetch();
  }, [initialFetch, repoInitialFetch]);

  // Set selected repo when default repo arrives here setting selected repo as default repos
  useEffect(() => {
    if (defualt) {
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
      <SideNav />

      <div className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto">
        <header className="w-full min-h-17 border-b border-gray-300 flex items-center justify-between px-3">
          <h2 className="text-xl text-black font-serif font-bold">{header}</h2>

          <div>
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
          </div>
        </header>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
export default App;
