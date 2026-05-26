import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const labelVariants = cva(
  "block text-body-sm font-medium text-ink-muted mb-2"
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={labelVariants({ className })} {...props}>
      {children}
      {required && <span className="text-gold ml-1">*</span>}
    </label>
  )
)
Label.displayName = "Label"

export { Label }
