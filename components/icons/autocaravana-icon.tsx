import Image from "next/image"
import type React from "react"

interface AutocaravanaIconProps {
  className?: string
  size?: number
}

export const AutocaravanaIcon: React.FC<AutocaravanaIconProps> = ({ className, size = 24 }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hqi6UnodNk6DOhvWanQgMJ1RHgxYWE.png"
        alt="Icono de autocaravana"
        fill
        className="object-contain"
      />
    </div>
  )
}
