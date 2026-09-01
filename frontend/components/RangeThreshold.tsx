import React, { useState } from 'react'

interface RangeThresholdProps{
  min:string,
  max:string,
  step:string,
  default:string,
  title:string
  description:string
}

function RangeThreshold(props:RangeThresholdProps) {
  const [value,setvalue]=useState<string>(props?.default);
  return (
    <div className='w-full pr-6 flex flex-col gap-2'>
       <label htmlFor="" className='text-sm font-serif'>{props.title}-<span className='font-mono'>{value}</span></label>
      <input  type="range" name="" id="" className='h-1 bg-mauve-200 border border-black accent-black w-full'  {...props} onChange={(e)=>setvalue(e.target.value)} value={value} />
      <p className='text-[12px] font-serif text-gray-500'>{props.description}</p>
    </div>
  )
}

export default RangeThreshold