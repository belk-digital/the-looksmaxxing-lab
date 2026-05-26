'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  title: string
  content: string
}

interface ProductReviewsProps {
  reviews: Review[]
}

export function ProductReviews({ reviews }: ProductReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(5)
  const [sort, setSort] = useState('recent')

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0
  
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating
    if (sort === 'lowest') return a.rating - b.rating
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const visibleReviews = sortedReviews.slice(0, visibleCount)

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 
      : 0
  }))

  return (
    <div className="flex flex-col md:flex-row gap-16 w-full">
      
      {/* Left: Summary */}
      <div className="w-full md:w-1/3 flex flex-col gap-8 shrink-0">
        <div>
          <h2 className="text-display-sm font-display text-ink mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-4">
            <span className="text-display-md text-ink">{averageRating.toFixed(1)}</span>
            <div className="flex flex-col">
              <div className="flex text-gold">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} fill={i <= Math.round(averageRating) ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-body-sm text-ink-muted mt-1">Based on {reviews.length} reviews</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {distribution.map(dist => (
            <div key={dist.stars} className="flex items-center gap-4 text-body-sm">
              <span className="w-12 text-ink">{dist.stars} Stars</span>
              <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-ink-muted">{dist.count}</span>
            </div>
          ))}
        </div>

        <Button variant="dark" className="w-full mt-4">Write a Review</Button>
      </div>

      {/* Right: Review List */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8 border-b border-border-subtle pb-4">
          <span className="text-label-md uppercase tracking-wider text-ink">
            {reviews.length} Reviews
          </span>
          <div className="w-40">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="border-none bg-transparent shadow-none px-0 justify-end gap-2 text-label-sm uppercase tracking-wider text-ink">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {visibleReviews.map((review) => (
            <div key={review.id} className="flex flex-col gap-2 border-b border-border-subtle pb-8 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-label-md uppercase tracking-wider text-ink">{review.author}</span>
                  <div className="flex text-gold">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={1} />
                    ))}
                  </div>
                </div>
                <span className="text-body-sm text-ink-muted">
                  {new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h4 className="text-body-lg font-medium text-ink mt-2">{review.title}</h4>
              <p className="text-body-md text-ink-muted">{review.content}</p>
            </div>
          ))}
          
          {visibleReviews.length === 0 && (
            <div className="text-body-md text-ink-muted italic">
              No reviews yet. Be the first to review!
            </div>
          )}
        </div>

        {visibleCount < reviews.length && (
          <div className="flex justify-center mt-12">
            <Button variant="secondary" onClick={() => setVisibleCount(v => v + 5)}>
              Load More Reviews
            </Button>
          </div>
        )}
      </div>

    </div>
  )
}
