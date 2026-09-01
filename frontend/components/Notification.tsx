import React from 'react'
import '../src/App.css'
import Toggle from './Toggle'
function Notification() {
  return (
    <div className='p-2 flex flex-col gap-5 w-full '>
      <h2 className='font-serif text-[16px]  setting-font'>Delivery channels</h2>
      <div className='flex flex-col gap-2 '>
        <div className='relative w- flex flex-col gap-1  border-b border-gray-300 pb-5'>
         <h2 className='text-sm font-semibold '>Slack</h2>
         <p className='text-[12px] text-gray-400'>#payments-security — new critical clusters and gate blocks.</p>
         <div className='absolute right-2'>
          <Toggle  size='sm'/>

         </div>
        </div>
        <div className='relative w- flex flex-col gap-1  border-b border-gray-300 pb-5'>
         <h2 className='text-sm font-semibold '>Email digest</h2>
         <p className='text-[12px] text-gray-400'>Daily summary of new findings and triage queue changes.</p>
         <div className='absolute right-2'>
          <Toggle  size='sm'/>

         </div>
        </div>
        
      </div>
      <div className='py-4'>
        <h2 className='font-serif font-semibold text-[16px]'>Alert thresholds</h2>
        <p className='text-[13px] font-serif'>Notify immediately for</p>
        <select className='w-full p-2 mt-1 font-serif text-sm text-gray-800 bg-mauve-100 outline-none border
         border-mauve-200 rounded-sm'>
          <option>Critical only</option>
          <option>Critical + High</option>
          <option>All severities</option>
          </select>
      </div>
    </div>
  )
}

export default Notification