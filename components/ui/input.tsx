import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-input border border-s-ink/[0.08] bg-[--sunken] px-3 py-2 text-sm font-body text-s-ink ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-s-ink/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-s-coral focus-visible:border-s-coral disabled:cursor-not-allowed disabled:opacity-50:text-s-dm-text/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
