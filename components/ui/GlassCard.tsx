import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra strong blur — for modals / floating overlays */
  elevated?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
}

/**
 * Glassmorphism container — rounded-3xl, backdrop-blur, translucent white.
 * Use for cards, panels, sections throughout the Next.js layer.
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, elevated = false, noPadding = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-3xl border border-white/60",
        "bg-white/80 backdrop-blur-glass",
        "shadow-glass",
        !noPadding && "p-6",
        elevated && "bg-white/90 shadow-glass-hover border-white/80",
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
