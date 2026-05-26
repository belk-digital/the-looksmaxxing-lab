import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function ImageFigure({
  src,
  alt,
  caption,
  className,
  width = 1200,
  height = 800,
}: {
  src: string
  alt: string
  caption?: string
  className?: string
  width?: number
  height?: number
}) {
  return (
    <figure className={cn("w-full my-12", className)}>
      <Image 
        src={src} 
        alt={alt} 
        width={width}
        height={height}
        className="w-full h-auto object-cover" 
      />
      {caption && (
        <figcaption className="text-body-sm italic text-ink-muted mt-3">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
