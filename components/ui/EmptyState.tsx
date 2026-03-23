import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ILLUSTRATIONS = {
  "no-results": "/illustrations/no-results.svg",
  "coming-soon": "/illustrations/coming-soon.svg",
} as const;

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  illustration?: keyof typeof ILLUSTRATIONS;
  className?: string;
}

/**
 * Empty state with a lucide-react icon, title, optional message, and optional CTA.
 * Used when lists/grids have no results.
 */
export default function EmptyState({ icon: Icon, title, message, action, illustration, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      {illustration && (
        <Image
          src={ILLUSTRATIONS[illustration]}
          alt=""
          width={120}
          height={120}
          className="mb-4 opacity-80"
          priority={false}
        />
      )}
      <div className="relative mb-5">
        {/* Soft halo behind icon */}
        <div className="absolute inset-0 rounded-full bg-s-coral/10 scale-[1.8] blur-xl" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-card bg-s-coral/10">
          <Icon size={28} className="text-s-coral" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="font-heading font-semibold text-s-ink text-lg mb-1.5">{title}</h3>
      {message && (
        <p className="text-s-ink/50 font-body text-sm max-w-xs leading-relaxed">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
