import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use elevated for modals/floating overlays (keeps glass effect) */
  elevated?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
}

/**
 * V4 Card container — solid backgrounds, clean borders, elevation shadows.
 * Elevated variant keeps glassmorphism for modals/overlays only.
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, elevated = false, noPadding = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-card",
        elevated
          ? "glass-frost shadow-elevation-3"
          : "bg-[--raised] shadow-elevation-1 border border-s-ink/[0.06]",
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
