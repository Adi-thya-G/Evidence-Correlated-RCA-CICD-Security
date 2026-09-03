

interface RangeThresholdProps{
  min:string,
  max:string,
  step:string,
  default:string,
  title:string
  description:string,
  value?:number,
  setvalue?:React.Dispatch<React.SetStateAction<number>>
}

function RangeThreshold(props:RangeThresholdProps) {
  
  return (
    <div className='w-full pr-6 flex flex-col gap-2'>
       <label htmlFor="" className='text-sm font-serif'>{props.title}-<span className='font-mono'>{props.value}</span></label>
      <input  type="range" name="" id="" className='h-1 bg-mauve-200 border border-black accent-black w-full'  {...props} onChange={(e)=>props.setvalue && props.setvalue(Number(e.target.value))} value={props.value} />
      <p className='text-[12px] font-serif text-gray-500'>{props.description}</p>
    </div>
  )
}

export default RangeThreshold