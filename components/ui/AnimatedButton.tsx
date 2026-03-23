"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-s-coral text-white shadow-warm-sm hover:bg-s-coral/90 active:bg-s-coral/85",
  secondary:
    "bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-s-ink dark:text-s-dm-text shadow-card hover:border-s-coral/40 hover:shadow-warm-sm",
  ghost:
    "bg-transparent text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-ink/5 dark:hover:bg-white/5 hover:text-s-ink dark:hover:text-s-dm-text",
  danger:
    "bg-s-coral text-white shadow-warm-md hover:bg-s-coral/90 active:bg-s-coral/85",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-button gap-1.5",
  md: "h-10 px-5 text-sm rounded-button gap-2",
  lg: "h-12 px-7 text-base rounded-button gap-2.5",
};

/**
 * Button with Framer Motion whileHover/whileTap feedback.
 * Supports loading state, all variants, and sizes.
 */
const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center font-body font-medium",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentPropsWithRef<typeof motion.button>)}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Lädt…
        </>
      ) : (
        children
      )}
    </motion.button>
  )
);

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
