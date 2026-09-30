import {useEffect, useState} from 'react'
import RangeThreshold from '../components/RangeThreshold'
import Button from '../components/Button'
import { toast } from "sonner";
import {useSetting} from '@/stores/useSettingsStore'
function Correlation() {

  const {threshold,retrieval}=useSetting((s)=>s)
  const updateSetting=useSetting((s)=>s.correlationSetting)

  const [thresholder,setThreshold]=useState<number>(0.5);
  const [retrievaler,setRetrieval]=useState<number>(3);

  useEffect(()=>{
    setRetrieval(retrieval),
    setThreshold(threshold)
  },[threshold,retrieval])

  const submit=async()=>{
     if(thresholder==threshold && retrieval==retrievaler)
     {
         toast.info("No changes to save", {
      description:
        "You haven't made any changes to the correlation settings.",
    });
    return;
     }
     updateSetting({threshold:thresholder,retrieval:retrievaler})
    
     toast.success("Settings saved", {
  description: "Correlation engine settings have been updated.",
});

  }


  const reset_data=async()=>{
      setThreshold(threshold);
      setRetrieval(retrieval);
  }

  return (
    <div className='p-2 flex flex-col gap-5 w-full'>
      <div className=' w-110 flex gap-2 flex-col'>
        <h2 className='text-[16px] font-serif font-[530]'>Evidence correlation engine</h2>
      <p className='text-[13px] line-clamp-3  text-gray-400 font-serif'>Controls how aggressively findings are clustered and how candidate 
        commits are ranked.
         These are the Layer 2 parameters from the RCA pipeline.</p>
      </div>
      <div className='flex flex-col gap-4'>
        <RangeThreshold min='0.5' max='0.99' step='0.01' title='Similarity threshold' default='0.5' description='Minimum vector similarity for two findings to be considered part of the same cluster.' value={thresholder} setvalue={setThreshold} />
         <RangeThreshold min='3' max='20' step='1' title='Top-K retrieval ' default='3' description='Number of semantically similar historical findings retrieved per new finding.' value={retrievaler} setvalue={setRetrieval} />
        
        </div>
        <div className='border-t border-gray-300 w-full mt-8 p-2 py-4 flex justify-end gap-4'>
          <Button title='Discard' className='text-sm border border-gray-300 rounded-sm font-serif px-4 font-medium align-middle cursor-pointer active:scale-95'  onClick={reset_data} />
          <Button title='Save change' className='text-sm border border-gray-300 rounded-sm font-serif px-4 font-medium align-middle bg-black text-white cursor-pointer active:scale-95' onClick={submit}/>
         

        </div>
    </div>
  )
}

export default Correlation