'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  'inline-flex items-center justify-center font-sans uppercase tracking-wider font-medium transition-all duration-300 ease-out-quart rounded-sm focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:   'bg-cream-sand text-ink border border-ink hover:bg-ink hover:text-white',
        secondary: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-white',
        ghost:     'bg-transparent text-ink hover:bg-cream-warm',
        link:      'bg-transparent text-ink underline underline-offset-4 hover:text-gold-dark px-0 py-0 h-auto',
        dark:      'bg-ink text-white border border-ink hover:bg-ink-soft',
        outline:   'bg-transparent text-ink border border-border-default hover:bg-cream-warm hover:text-ink',
      },
      size: {
        sm: 'text-label-md px-4 py-2 h-9',
        md: 'text-label-lg px-6 py-3 h-12',
        lg: 'text-label-lg px-10 py-4 h-14',
        icon: 'h-10 w-10',
        "icon-sm": 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  asChild?: boolean
}

const Spinner = () => (
  <motion.svg
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    viewBox="0 0 24 24"
    width="20"
    height="20"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="60 100"
      strokeLinecap="round"
    />
  </motion.svg>
)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, asChild, ...props }, ref) => {
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(buttonVariants({ variant, size, className }), (children.props as any).className),
        ref,
        ...props
      } as any)
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
