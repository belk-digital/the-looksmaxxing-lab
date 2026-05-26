import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { EyebrowHeading } from './EyebrowHeading'

export function BlogPostCard({
  slug,
  title,
  category,
  excerpt,
  imageSrc,
  readTime,
}: {
  slug: string
  title: string
  category: string
  excerpt: string
  imageSrc: string
  readTime: string
}) {
  return (
    <Link href={`/journal/${slug}`} className="group flex flex-col gap-4 block h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm">
        <Image 
          src={imageSrc} 
          alt={title} 
          fill 
          className="object-cover transition-transform duration-slow ease-out-quart group-hover:scale-[1.04]" 
        />
      </div>
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-2">
          <EyebrowHeading gold={true} showRule={false} className="mb-0">
            {category}
          </EyebrowHeading>
          <span className="text-label-md text-ink-muted uppercase tracking-wider">{readTime}</span>
        </div>
        <h3 className="text-editorial-md font-serif text-ink mb-2 group-hover:text-gold-dark transition-colors duration-fast">
          {title}
        </h3>
        <p className="text-body-sm text-ink-muted line-clamp-2 mb-4">
          {excerpt}
        </p>
      </div>
    </Link>
  )
}
