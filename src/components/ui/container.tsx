import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      content: 'max-w-content px-6 md:px-12 lg:px-20',
      prose: 'max-w-prose px-6 md:px-12 lg:px-20',
      page: 'max-w-page px-6 md:px-12 lg:px-20',
      wide: 'max-w-wide px-6 md:px-12 lg:px-20',
      bleed: 'max-w-full px-0',
    },
  },
  defaultVariants: {
    size: 'page',
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={containerVariants({ size, className })}
        {...props}
      />
    )
  }
)
Container.displayName = 'Container'

export { Container, containerVariants }
