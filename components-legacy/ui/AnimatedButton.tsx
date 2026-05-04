"use client";

import { forwardRef, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/* Detect fine-pointer hover capability (Emil: gate hover on touch devices) */
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const subscribe = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(HOVER_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () =>
  typeof window !== "undefined" && window.matchMedia(HOVER_QUERY).matches;
const getServerSnapshot = () => false;

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
    "bg-s-coral text-white shadow-warm-sm hover:brightness-[1.06] active:brightness-[0.97]",
  secondary:
    "bg-white border border-s-ink/10 text-s-ink shadow-warm-md hover:border-s-coral/40 hover:shadow-warm-sm",
  ghost:
    "bg-transparent text-s-ink/60 hover:bg-s-ink/5:bg-white/5 hover:text-s-ink",
  danger:
    "bg-s-coral text-white shadow-warm-md hover:brightness-[1.06] active:brightness-[0.97]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-pill gap-1.5",
  md: "h-10 px-5 text-sm rounded-pill gap-2",
  lg: "h-12 px-7 text-base rounded-pill gap-2.5",
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
  ) => {
  const t = useTranslations("ui.button") as any;
  const hasHover = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <motion.button
      ref={ref}
      whileHover={hasHover && !disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
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
          {t("loading")}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
