import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-0.5 text-label-sm uppercase tracking-wider font-sans transition-colors",
  {
    variants: {
      variant: {
        sale: "bg-error text-white",
        new: "bg-gold text-white",
        bestseller: "bg-ink text-cream",
      },
    },
    defaultVariants: {
      variant: "new",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  )
}

export { Badge, badgeVariants }
