'use client'

import { useState, useEffect } from 'react'
import { verifyCoupon } from '../actions'

interface ShippingMethod {
  method: string
  price: number
  estimatedDays?: number | null
}

interface ShippingZone {
  name: string
  methods?: ShippingMethod[] | null
}

interface ProcessingFee {
  id: string | number
  name: string
  amount: number
  type: 'fixed_amount' | 'percentage'
  isOptional: boolean
  isActive: boolean
}

interface CheckoutSummaryProps {
  subtotal: number
  shippingZones: ShippingZone[]
  processingFees: ProcessingFee[]
}

export default function CheckoutSummary({ subtotal, shippingZones, processingFees }: CheckoutSummaryProps) {
  // Coupon State
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState('')
  const [discount, setDiscount] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [appliedCode, setAppliedCode] = useState('')

  // Processing Fees State
  const initialSelectedFees = processingFees.filter(f => !f.isOptional).map(f => String(f.id))
  const [selectedFees, setSelectedFees] = useState<string[]>(initialSelectedFees)

  // Shipping State
  const defaultZone = shippingZones.length > 0 ? shippingZones[0] : null
  const defaultMethods = defaultZone?.methods || []
  const [selectedMethod, setSelectedMethod] = useState<string>(defaultMethods[0]?.method || '')
  
  const currentMethodObj = defaultMethods.find(m => m.method === selectedMethod)
  const baseShippingCost = currentMethodObj ? currentMethodObj.price : 0
  const actualShippingCost = freeShipping ? 0 : baseShippingCost

  // Fee Calculation
  let dynamicFeeTotal = 0
  for (const feeId of selectedFees) {
    const fee = processingFees.find(f => String(f.id) === feeId)
    if (fee) {
      const amount = fee.type === 'percentage'
        ? Math.floor((subtotal * fee.amount) / 100)
        : fee.amount
      dynamicFeeTotal += amount
    }
  }

  const total = Math.max(0, subtotal - discount) + actualShippingCost + dynamicFeeTotal

  const handleApplyCoupon = async () => {
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

  const handleRemoveCoupon = () => {
    setCode('')
    setStatus('idle')
    setMessage('')
    setDiscount(0)
    setFreeShipping(false)
    setAppliedCode('')
  }

  const handleFeeToggle = (feeId: string, isChecked: boolean) => {
    setSelectedFees(prev => {
      if (isChecked) {
        return [...prev, feeId]
      } else {
        return prev.filter(id => id !== feeId)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Shipping Method Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Shipping Method</h2>
        {defaultZone ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-2">Zone: {defaultZone.name}</p>
            {defaultMethods.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between border border-white/10 p-4 rounded-md">
                <div className="flex items-center">
                  <input
                    id={`shipping-${idx}`}
                    name="shippingMethod"
                    type="radio"
                    value={m.method}
                    checked={selectedMethod === m.method}
                    onChange={() => setSelectedMethod(m.method)}
                    className="h-4 w-4 border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900"
                  />
                  <label htmlFor={`shipping-${idx}`} className="ml-3 block text-sm font-medium text-white">
                    {m.method} 
                    {m.estimatedDays && <span className="text-gray-400 ml-2">({m.estimatedDays} days)</span>}
                  </label>
                </div>
                <div className="text-sm font-medium">
                  {freeShipping ? (
                    <span className="text-green-400">Free</span>
                  ) : (
                    <span>${(m.price / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-red-400">No shipping zones configured.</p>
        )}
      </div>

      {/* Coupon Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Coupon Code</h2>
        <div>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              disabled={status === 'valid'}
              className="block w-full rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            {status === 'valid' ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={status === 'loading'}
                className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Checking...' : 'Apply'}
              </button>
            )}
          </div>

          {appliedCode && (
            <input type="hidden" name="couponCode" value={appliedCode} />
          )}

          {status === 'valid' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <span>✅ {message}</span>
            </div>
          )}

          {status === 'invalid' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
              <span>❌ {message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing Fees */}
      {processingFees.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Additional Options</h2>
          <div className="space-y-4">
            {processingFees.map((fee) => {
              const feeValue = fee.type === 'percentage' 
                ? `+${fee.amount}% of subtotal` 
                : `+$${(fee.amount / 100).toFixed(2)}`
              
              const isChecked = selectedFees.includes(String(fee.id))

              return (
                <div key={fee.id} className="flex items-center">
                  <input
                    id={`fee-${fee.id}`}
                    name="processingFees"
                    type={fee.isOptional ? "checkbox" : "hidden"}
                    value={fee.id}
                    checked={isChecked}
                    onChange={(e) => handleFeeToggle(String(fee.id), e.target.checked)}
                    className={fee.isOptional ? "h-4 w-4 rounded border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-900" : ""}
                  />
                  {fee.isOptional ? (
                    <label htmlFor={`fee-${fee.id}`} className="ml-3 block text-sm font-medium text-white flex-1 flex justify-between cursor-pointer">
                      <span>{fee.name}</span>
                      <span className="text-gray-400">{feeValue}</span>
                    </label>
                  ) : (
                    <div className="ml-3 text-sm font-medium text-white flex-1 flex justify-between">
                      <span>{fee.name} (Required)</span>
                      <span className="text-gray-400">{feeValue}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount</span>
              <span>-${(discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping ({selectedMethod})</span>
            <span>
              {freeShipping ? (
                <span className="text-green-400">Free</span>
              ) : (
                `$${(baseShippingCost / 100).toFixed(2)}`
              )}
            </span>
          </div>
          {dynamicFeeTotal > 0 && (
            <div className="flex justify-between">
              <span>Processing Fees</span>
              <span>${(dynamicFeeTotal / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="pt-4 mt-4 border-t border-white/10 flex justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
