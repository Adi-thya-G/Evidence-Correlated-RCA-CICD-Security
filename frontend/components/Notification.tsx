import React, { useEffect, useState } from 'react'
import '../src/App.css'
import Toggle from './Toggle'
import { useSetting } from '@/stores/useSettingsStore'
import type { AlertThresholdProps } from '@/stores/useSettingsStore'
import { toast } from "sonner";
function Notification() {

  const {email,slack,alertThresholds}=useSetting();
  const updateNotification=useSetting((s)=>s.notificationSetting)

  const [isemail,setIsEmail]=useState(false);
  const [isslack,setIsSlack]=useState(false);
  const [alertThresholdser,setalertThresholds]=useState<AlertThresholdProps>("Critical only");
  console.log(alertThresholdser)

  useEffect(()=>{
    console.log(email,slack,alertThresholds)
    setIsEmail(email),
    setIsSlack(slack)
    setalertThresholds(alertThresholds);
  },[email,slack,alertThresholds])



  const onchange=async({isemail,isslack,alertThreshold}:{isemail:boolean,isslack:boolean,alertThreshold:AlertThresholdProps})=>{
    try {
      updateNotification({email:isemail,slack:isslack,alertThresholds:alertThreshold})
       toast.success("Settings saved", {
  description: "Notification setting is updated.",
});

    } catch (error) {
      toast.error("Failed to save settings", {
      description:
        "We couldn't update the Notification  settings. Please try again.",
    });
      
    }
    

  }

  return (
    <div className='p-2 flex flex-col gap-5 w-full '>
      <h2 className='font-serif text-[16px]  setting-font  font-[520]'>Delivery channels</h2>
      <div className='flex flex-col gap-2 '>
        <div className='relative w- flex flex-col gap-1  border-b border-gray-300 pb-5'>
         <h2 className='text-sm font-semibold '>Slack</h2>
         <p className='text-[12px] text-gray-400'>#payments-security — new critical clusters and gate blocks.</p>
         <div className='absolute right-2'>
          <Toggle  size='sm' checked={isslack} onChange={(next)=>{
            setIsSlack(next)
            onchange({isemail:isemail,isslack:next,alertThreshold:alertThresholdser})
            
          }}/>

         </div>
        </div>
        <div className='relative w- flex flex-col gap-1  border-b border-gray-300 pb-5'>
         <h2 className='text-sm font-semibold '>Email digest</h2>
         <p className='text-[12px] text-gray-400'>Daily summary of new findings and triage queue changes.</p>
         <div className='absolute right-2'>
          <Toggle  size='sm' checked={isemail} 
          onChange={(next)=>
          {
            console.log(next)
            setIsEmail(next)
            onchange({isemail:next,isslack:isslack,alertThreshold:alertThresholdser})
          }
          } />

         </div>
        </div>
        
      </div>
      <div className='py-4'>
        <h2 className='font-serif font-semibold text-[16px]'>Alert thresholds</h2>
        <p className='text-[13px] font-serif'>Notify immediately for</p>
        <select className='w-full p-2 mt-1 font-serif text-sm text-gray-800 bg-mauve-100 outline-none border
         border-mauve-200 rounded-sm' value={alertThresholdser} onChange={(e)=>{
          setalertThresholds(e.target.value as AlertThresholdProps)
          console.log(e.target.value)
           onchange({isemail:isemail,isslack:isslack,alertThreshold:e.target.value as AlertThresholdProps}) 
        }
         }>
          <option value="Critical only">Critical only</option>
          <option value="Critical + High">Critical + High</option>
          <option value="All severities">All severities</option>
          </select>
      </div>
    </div>
  )
}

export default Notification