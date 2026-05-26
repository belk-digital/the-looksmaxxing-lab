'use client'

import * as React from 'react'
import { Accordion as AccordionPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'
import { PlusIcon } from 'lucide-react'

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('not-last:border-b border-border-subtle', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger focus-visible:ring-3 focus-visible:ring-ring/50 relative flex flex-1 items-center justify-between rounded-md border border-transparent py-6 text-left text-body-lg font-sans outline-none transition-all hover:text-ink focus-visible:border-ring focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-ink',
          className,
        )}
        {...props}
      >
        {children}
        <PlusIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 text-ink-muted transition-transform duration-500 ease-out-quart group-data-[state=open]/accordion-trigger:rotate-45 ml-4"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-open:animate-accordion-down data-closed:animate-accordion-up overflow-hidden text-sm"
      {...props}
    >
      <div
        className={cn(
          'h-(--radix-accordion-content-height) [&_a]:underline-offset-3 pb-4 pt-0 [&_a]:underline [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
