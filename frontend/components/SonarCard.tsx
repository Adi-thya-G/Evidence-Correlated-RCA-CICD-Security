import React from 'react'

function SonarCard({heading,value,description,className}:{heading:string,value:string,description:string,className:string}) {
  return (
    <div className='w-full p-3 flex flex-col gap-1 border border-gray-300  rounded-xl'>
      <p className='font-serif text-[13px] text-gray-500'>{heading.toUpperCase()}</p>
      <h2 className={`${className} text-[26px] font-semibold `}>{value}</h2>
      <p className='font-serif text-[12px] text-gray-600'>{description}</p>
    </div>
  )
}

export default SonarCard