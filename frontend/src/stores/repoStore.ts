import api from "@/api/axiosInstance";
import {create} from "zustand"



export interface repoList{
  repo_id:number,
  default:boolean,
  name:string,
  full_name:string,
  createAt:Date | null,
  private:boolean


}

interface Irepo{
  repository:repoList[],
  default:repoList|null,
   initialFetch: () => Promise<void>;
   update:(repo:repoList)=>Promise<void>;
   clear:()=>Promise<void>

}
interface InitialState{
 repository:repoList[],
 default:repoList|null,
}

const initialstate:InitialState={
 repository:[],
 default:null
}

export const useRepoStore = create<Irepo>((set, get) => ({
  ...initialstate,
  initialFetch: async () => {
    const { data } = await api.get("/repo");
    const repos = Array.isArray(data?.data) ? data.data : [];
     console.log(data)
    set({
      repository: repos,
      default: repos.find((ele: repoList) => ele.default === true) ?? repos[0],
    });
  },
  update: async (repo: repoList) => {
    set((state) => ({
      ...state,
      default: repo,
    }));
  },
  clear:async()=>{
   set({...initialstate})
  }
}));