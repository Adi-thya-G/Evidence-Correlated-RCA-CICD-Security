import React from 'react'

function Button({title,className}:{title:string,className:string}) {
  return (
    <button className={`p-2  ${className}`}>
    {title}
    </button>
  )
}

export default Button