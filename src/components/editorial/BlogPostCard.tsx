import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
    <Link href={`/journal/${slug}`} className="group flex flex-col bg-white rounded-[2rem] p-4 h-full shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl mb-6">
        <Image 
          src={imageSrc} 
          alt={title} 
          fill 
          className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105" 
        />
      </div>
      <div className="flex flex-col flex-grow px-2 pb-2">
        <div className="flex justify-between items-center mb-4">
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
            {category}
          </span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{readTime}</span>
        </div>
        <h3 className="text-xl font-bold text-ink mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-auto leading-relaxed">
          {excerpt}
        </p>
      </div>
    </Link>
  )
}
