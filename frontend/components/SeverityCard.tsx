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
    <div className={`${color[title].className}   flex justify-center place-items-center px-1 py-2  font-serif text-[12px] rounded-md`} >
      {color[title].label}
    </div>
  )
}

export default SeverityCard