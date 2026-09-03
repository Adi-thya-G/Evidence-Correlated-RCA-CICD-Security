import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  className?: string;
}


function Button({title,className,...props}:ButtonProps) {
  return (
    <button className={`p-2  ${className}`} {...props}>
    {title}
    </button>
  )
}

export default Button