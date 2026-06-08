'use client'

import React from 'react'
export function LayoutClientWrapper({ 
  children,
  header,
  footer
}: { 
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col relative z-0 isolate">
      {header}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      <div className="relative z-40 isolate">
        {footer}
      </div>
    </div>
  )
}
