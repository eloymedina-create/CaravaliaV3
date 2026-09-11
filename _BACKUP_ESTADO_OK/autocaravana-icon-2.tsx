import type React from "react"

interface AutocaravanaIcon2Props {
  size?: number
  className?: string
}

export const AutocaravanaIcon2: React.FC<AutocaravanaIcon2Props> = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 12H21M3 12V18H21V12M3 12V8C3 7.44772 3.44772 7 4 7H15L19 12M7 18V20M17 18V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10H10V14H6V10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10H18V14H14V10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
