import React from 'react'
import RangeThreshold from '../components/RangeThreshold'
import Button from '../components/Button'
function Correlation() {
  return (
    <div className='p-2 flex flex-col gap-5 w-full'>
      <div className=' w-110 flex gap-2 flex-col'>
        <h2 className='text-[16px] font-serif font-[530]'>Evidence correlation engine</h2>
      <p className='text-[13px] line-clamp-3  text-gray-400 font-serif'>Controls how aggressively findings are clustered and how candidate 
        commits are ranked.
         These are the Layer 2 parameters from the RCA pipeline.</p>
      </div>
      <div className='flex flex-col gap-4'>
        <RangeThreshold min='0.5' max='0.99' step='0.01' title='Similarity threshold' default='0.5' description='Minimum vector similarity for two findings to be considered part of the same cluster.' />
         <RangeThreshold min='3' max='20' step='1' title='Top-K retrieval ' default='3' description='Number of semantically similar historical findings retrieved per new finding.' />
        
        </div>
        <div className='border-t border-gray-300 w-full mt-8 p-2 py-4 flex justify-end gap-4'>
          <Button title='Discard' className='text-sm border border-gray-300 rounded-sm font-serif px-4 font-medium align-middle cursor-pointer active:scale-95'/>
          <Button title='Save change' className='text-sm border border-gray-300 rounded-sm font-serif px-4 font-medium align-middle bg-black text-white cursor-pointer active:scale-95'/>
         

        </div>
    </div>
  )
}

export default Correlation