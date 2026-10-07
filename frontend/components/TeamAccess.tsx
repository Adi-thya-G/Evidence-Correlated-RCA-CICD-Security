import React from 'react'
import TeamList from "./TeamList"
import { useRepoStore } from '../src/stores/repoStore'

function TeamAccess() {
  
  
  const defualt=useRepoStore((s)=>s.default)

  return (
    <div className='p-2 flex flex-col gap-5 w-full'>
      <div>
         <h2 className='font-serif text-[16px]  setting-font  font-[520] '>Team members</h2>
         <p className='text-[14px] text-gray-400'> Who can view findings, resolve clusters, and override the deployment gate.</p>
      </div>
      <div>
        {
          defualt?.repo_id==undefined ||<TeamList repoId={defualt?.repo_id}/>
        }
      </div>
    </div>
  )
}

export default TeamAccess