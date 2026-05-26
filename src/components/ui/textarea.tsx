'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"

const textareaVariants = cva(
  "flex w-full rounded-sm border px-4 py-3 min-h-[120px] font-sans text-body-md transition-all duration-200 ease-out placeholder:text-ink-subtle focus-visible:outline-none focus-visible:shadow-focus focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-cream-warm border-border",
        error: "bg-cream-warm border-error text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={textareaVariants({ variant: error ? "error" : variant, className })}
          ref={ref}
          {...props}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-error text-body-sm mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
