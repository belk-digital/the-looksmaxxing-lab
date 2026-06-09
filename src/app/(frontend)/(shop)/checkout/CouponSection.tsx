'use client'

import { useState } from 'react'
import { verifyCoupon } from '../actions'

interface CouponSectionProps {
  subtotal: number
}

export default function CouponSection({ subtotal }: CouponSectionProps) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState('')
  const [discount, setDiscount] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [appliedCode, setAppliedCode] = useState('')

  const handleApply = async () => {
    if (!code.trim()) {
      setStatus('invalid')
      setMessage('Please enter a coupon code')
      return
    }

    setStatus('loading')
    const result = await verifyCoupon(code.trim(), subtotal)

    if (result.valid) {
      setStatus('valid')
      setMessage(result.description || 'Coupon applied!')
      setDiscount(result.discount || 0)
      setFreeShipping(result.freeShipping || false)
      setAppliedCode(result.code || code.trim())
    } else {
      setStatus('invalid')
      setMessage(result.error || 'Invalid coupon')
      setDiscount(0)
      setFreeShipping(false)
      setAppliedCode('')
    }
  }

  const handleRemove = () => {
    setCode('')
    setStatus('idle')
    setMessage('')
    setDiscount(0)
    setFreeShipping(false)
    setAppliedCode('')
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h2 className="text-xl font-medium mb-4">Coupon Code</h2>
      <div>
        <label htmlFor="couponCode" className="block text-sm font-medium text-gray-300">
          Have a discount code?
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            id="couponCode"
            name="couponCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER20"
            disabled={status === 'valid'}
            className="block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          {status === 'valid' ? (
            <button
              type="button"
              onClick={handleRemove}
              className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              disabled={status === 'loading'}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {status === 'loading' ? 'Checking...' : 'Apply'}
            </button>
          )}
        </div>

        {/* Hidden input to pass the verified coupon code to the form submission */}
        {appliedCode && (
          <input type="hidden" name="couponCode" value={appliedCode} />
        )}

        {/* Status messages */}
        {status === 'valid' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>✅ {message}</span>
            {discount > 0 && (
              <span className="ml-2 font-semibold">— saves ${(discount / 100).toFixed(2)}</span>
            )}
            {freeShipping && (
              <span className="ml-2 font-semibold">+ Free Shipping!</span>
            )}
          </div>
        )}

        {status === 'invalid' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>❌ {message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
