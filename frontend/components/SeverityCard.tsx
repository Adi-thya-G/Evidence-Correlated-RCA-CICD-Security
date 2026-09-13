import React from 'react'



const color:Record<string,{
  label:string,
  className:string
}>={
  "MAJOR":{
    label:"MAJ",
    className:"text-white bg-red-600"

  },
  "CRITICAL":{
    label:"CRIT",
    className:"text-amber-600 bg-amber-100"
  },
 "MINOR":{
   label:"MIN",
   className:"text-gray-500 bg-gray-100"
 }
}

function SeverityCard({title}:{title:string}) {
  return (
    <div className={`${color[title].className}    w-8 h-8 flex justify-center place-items-center  font-serif p-2 text-[10px] rounded-md`} >
      {color[title].label}
    </div>
  )
}

export default SeverityCard