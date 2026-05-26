'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, Shield } from 'lucide-react'

export function SettingsClient() {
  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-4xl">
      
      <div className="flex flex-col mb-10 border-b border-border-subtle pb-4">
        <h1 className="text-label-xl uppercase tracking-wider text-ink mb-2">
          Account Settings
        </h1>
        <p className="text-body-sm text-ink-muted">
          Manage your personal information, security preferences, and notifications.
        </p>
      </div>

      <div className="flex flex-col gap-16">
        
        {/* Personal Info Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-label-lg uppercase tracking-wider text-ink border-b border-border-subtle pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName" className="text-label-sm text-ink-muted uppercase tracking-wider">First Name</Label>
              <Input id="firstName" defaultValue="Alex" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName" className="text-label-sm text-ink-muted uppercase tracking-wider">Last Name</Label>
              <Input id="lastName" defaultValue="Sterling" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="phone" className="text-label-sm text-ink-muted uppercase tracking-wider">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
            </div>
            <div className="md:col-span-2 mt-2">
              <Button variant="dark">Save Changes</Button>
            </div>
          </div>
        </section>

        {/* Email & Password (Clerk offload) */}
        <section className="flex flex-col gap-6">
          <h2 className="text-label-lg uppercase tracking-wider text-ink border-b border-border-subtle pb-2">Sign In & Security</h2>
          <div className="bg-cream-warm p-6 rounded-sm border border-border-subtle max-w-2xl flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cream rounded-full border border-border-subtle text-ink">
                <Shield size={20} />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-label-md uppercase tracking-wider text-ink">Authentication managed securely</span>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  Your email (<strong className="text-ink font-medium">alex@example.com</strong>) and password are encrypted and managed securely via our authentication provider. 
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-subtle">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                Update Password <ExternalLink size={14} />
              </Button>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                Change Email <ExternalLink size={14} />
              </Button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="flex flex-col gap-6">
          <h2 className="text-label-lg uppercase tracking-wider text-ink border-b border-border-subtle pb-2">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="flex flex-col gap-2">
              <Label htmlFor="language" className="text-label-sm text-ink-muted uppercase tracking-wider">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency" className="text-label-sm text-ink-muted uppercase tracking-wider">Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="flex flex-col gap-6">
          <h2 className="text-label-lg uppercase tracking-wider text-ink border-b border-border-subtle pb-2">Notifications</h2>
          <div className="max-w-2xl flex flex-col gap-6">
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="marketing-email" className="text-body-md font-medium text-ink">Marketing Emails</Label>
                <span className="text-body-sm text-ink-muted">Receive updates on new products, research, and exclusive sales.</span>
              </div>
              <Switch id="marketing-email" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="order-sms" className="text-body-md font-medium text-ink">Order SMS Updates</Label>
                <span className="text-body-sm text-ink-muted">Get real-time text messages about your order shipments and deliveries.</span>
              </div>
              <Switch id="order-sms" defaultChecked />
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
