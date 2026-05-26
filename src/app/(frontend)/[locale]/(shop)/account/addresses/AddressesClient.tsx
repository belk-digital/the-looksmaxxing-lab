'use client'

import React, { useState } from 'react'
import { buttonVariants, Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const MOCK_ADDRESSES = [
  {
    id: 'addr-1',
    firstName: 'Alex',
    lastName: 'Sterling',
    line1: '123 Biohack Way',
    line2: 'Apt 4',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'United States',
    phone: '(555) 123-4567',
    isDefault: true
  },
  {
    id: 'addr-2',
    firstName: 'Alex',
    lastName: 'Sterling',
    line1: '400 Tech Plaza',
    line2: 'Suite 900',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'United States',
    phone: '(555) 987-6543',
    isDefault: false
  }
]

export function AddressesClient() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border-subtle pb-2">
        <h1 className="text-label-xl uppercase tracking-wider text-ink">
          Saved Addresses
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Add New Address Card / Trigger */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="h-full min-h-[280px] bg-cream-warm border-2 border-dashed border-border-subtle rounded-sm flex flex-col items-center justify-center gap-4 text-ink-muted hover:text-ink hover:border-ink hover:bg-cream-warm/50 transition-all group">
              <div className="w-12 h-12 rounded-full bg-cream border border-border-subtle flex items-center justify-center group-hover:bg-ink group-hover:text-cream transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-label-md uppercase tracking-wider">Add New Address</span>
            </button>
          </DialogTrigger>

          {/* Address Modal */}
          <DialogContent className="sm:max-w-[600px] bg-cream border border-border-subtle p-0 overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-cream-warm/50">
              <DialogHeader>
                <DialogTitle className="text-label-lg uppercase tracking-wider text-ink">Add a New Address</DialogTitle>
                <DialogDescription className="text-body-sm text-ink-muted">
                  Fill in your shipping details below.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName" className="text-label-sm text-ink-muted uppercase tracking-wider">First Name</Label>
                  <Input id="firstName" placeholder="First Name" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName" className="text-label-sm text-ink-muted uppercase tracking-wider">Last Name</Label>
                  <Input id="lastName" placeholder="Last Name" />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="line1" className="text-label-sm text-ink-muted uppercase tracking-wider">Street Address</Label>
                  <Input id="line1" placeholder="Street Address" />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="line2" className="text-label-sm text-ink-muted uppercase tracking-wider">Apartment, suite, etc. (optional)</Label>
                  <Input id="line2" placeholder="Apartment, suite, etc." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city" className="text-label-sm text-ink-muted uppercase tracking-wider">City</Label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="state" className="text-label-sm text-ink-muted uppercase tracking-wider">State</Label>
                  <Select>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      {/* ... other states */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="zip" className="text-label-sm text-ink-muted uppercase tracking-wider">ZIP Code</Label>
                  <Input id="zip" placeholder="ZIP Code" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone" className="text-label-sm text-ink-muted uppercase tracking-wider">Phone</Label>
                  <Input id="phone" type="tel" placeholder="(555) 555-5555" />
                </div>
                <div className="col-span-2 flex items-center space-x-2 mt-2">
                  <Checkbox id="default" />
                  <label
                    htmlFor="default"
                    className="text-body-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink"
                  >
                    Set as default shipping address
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-border-subtle bg-cream-warm/50 flex sm:justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="dark" onClick={() => setOpen(false)}>Save Address</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Existing Addresses */}
        {MOCK_ADDRESSES.map(address => (
          <div key={address.id} className="relative p-6 border border-border-subtle rounded-sm flex flex-col gap-6 justify-between bg-cream">
            {address.isDefault && (
              <div className="absolute -top-3 left-6 bg-gold text-ink text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
                Default Address
              </div>
            )}
            
            <div className="flex flex-col gap-1 text-body-sm text-ink-muted leading-relaxed mt-2">
              <span className="text-ink font-medium text-body-md mb-2">{address.firstName} {address.lastName}</span>
              <span>{address.line1}</span>
              {address.line2 && <span>{address.line2}</span>}
              <span>{address.city}, {address.state} {address.postalCode}</span>
              <span>{address.country}</span>
              <span className="mt-2 text-ink-muted/70">{address.phone}</span>
            </div>

            <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Edit2 size={14} />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2 text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200">
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  )
}
