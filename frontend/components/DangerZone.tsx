
import { useEffect, useState } from 'react'
import Button from './Button'
import {useDangerZone} from '@/stores/useSettingsStore'
import type{ DangerZone } from '@/stores/useSettingsStore'
function DangerZone() {

  const [correlation_history,setCorrelation_history]=useState<boolean>(false)
  const [Disconnect_repository,setDisconnect_repository]=useState<boolean>(false)
  
  const correlationHistory=useDangerZone((s)=>s.correlation_history);
  const DisconnectRepository=useDangerZone((s)=>s.Disconnect_repository);

  const updateDangerZone=useDangerZone((s)=>s.update_data)

  useEffect(()=>{
    setCorrelation_history(correlationHistory)
    setDisconnect_repository(DisconnectRepository)
  },[correlationHistory,DisconnectRepository])


  const update=async({correlation_history,Disconnect_repository}:{correlation_history:boolean,Disconnect_repository:boolean})=>{
   updateDangerZone({correlation_history ,Disconnect_repository})
  }

  return (
    <div className='p-2 flex flex-col gap-5 w-ful'>
      <div className=' w-110 flex gap-2 flex-col'>
        <h2 className='text-[16px] font-serif font-[530]'>Danger zone</h2>
      <p className='text-[13px] line-clamp-3  text-gray-400 font-serif'>These actions are irreversible. They affect all team members on this repository.</p>
      </div>
      <div className='w-full  border border-red-200 bg-red-50 rounded-md p-4' >
        <div className='border-b border-red-200 p-3 relative'>
          <h2 className='text-[14px] font-serif font-[530]'>Reset correlation history</h2>
          <p className='w-3/6 text-[12px] text-gray-400'>Clears all clusters and candidate-commit rankings. Findings are kept.</p>
          <Button title={correlation_history?'Clear History':'Reset'} className={` 
          ${correlation_history?"bg-red-700 text-white ":"bg-white "}  text-[12px] font-serif 
           text-red-700 border border-red-200 p-1 rounded-sm cursor-pointer
          px-4 absolute right-2 top-1/2 -translate-y-1/2 active:bg-red-700 active:text-white  hover:text-white hover:bg-red-700 `}
          onClick={(e)=>{
            
            update({correlation_history:!correlation_history,Disconnect_repository:Disconnect_repository})
            setCorrelation_history((pre)=>!pre)
          }}
          />
        </div>
         <div className=' border-red-200 p-3 relative'>
          <h2 className='text-[14px] font-serif font-[530]'>Disconnect repository</h2>
          <p className='w-3/6 text-[12px] text-gray-400'>Removes payments-api from Verdict. Scan history is deleted after 30 days.</p>
          <Button title={Disconnect_repository?"Connected":'Disconnect'} className={`${Disconnect_repository?"bg-red-700 text-white":"bg-white"} 
          text-[12px] font-serif text-red-700 border border-red-200 p-1 rounded-sm cursor-pointer px-4 absolute right-2 top-1/2 -translate-y-1/2 active:text-white active:bg-red-700 hover:text-white hover:bg-red-700 `}
          onClick={()=>{
             update({correlation_history:correlation_history,Disconnect_repository:!Disconnect_repository})
            setDisconnect_repository((pre)=>!pre)
          }}
          />
        </div>

      </div>
    </div>
  )
}

export default DangerZone