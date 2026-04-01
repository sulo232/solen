import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-btn font-body text-sm font-medium transition-[transform,filter,background-color,border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.98]",
        secondary:
          "bg-s-ink/[0.05] text-s-ink hover:bg-s-ink/[0.09] dark:bg-s-dm-text/[0.08] dark:text-s-dm-text dark:hover:bg-s-dm-text/[0.14]",
        outline:
          "border border-s-ink/10 text-s-ink/70 hover:border-s-coral/40 hover:text-s-coral dark:border-s-dm-text/10 dark:text-s-dm-text/60 dark:hover:border-s-coral/40 dark:hover:text-s-coral",
        ghost:
          "text-s-ink/60 hover:text-s-coral hover:bg-s-coral/[0.06] dark:text-s-dm-text/60 dark:hover:text-s-coral dark:hover:bg-s-coral/[0.08]",
        destructive:
          "bg-s-error text-white hover:brightness-[1.06] active:scale-[0.98]",
        link: "text-s-coral underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2 min-h-[44px]",
        sm: "h-9 px-4 text-xs min-h-[44px] min-w-[44px]",
        lg: "h-14 px-8",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, fullWidth, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {children}
          </>
        ) : children}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
