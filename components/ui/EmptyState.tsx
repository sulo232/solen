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
  eyebrow?: string;
  className?: string;
}

/**
 * Empty state with a lucide-react icon, title, optional message, and optional CTA.
 * Used when lists/grids have no results.
 */
export default function EmptyState({ icon: Icon, title, message, action, illustration, eyebrow, className }: EmptyStateProps) {
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
      <div className="relative mb-5 flex items-center justify-center w-16 h-16">
        {/* Soft halo — NO scale, explicit negative inset */}
        <div className="absolute -inset-5 rounded-full blur-xl" style={{ background: "rgba(232,98,74,.09)" }} />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-[20px]" style={{ background: "rgba(232,98,74,.10)" }}>
          <Icon size={28} className="text-s-coral" strokeWidth={1.5} />
        </div>
      </div>
      {eyebrow && (
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
          {eyebrow}
        </p>
      )}
      <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-lg mb-1.5">{title}</h3>
      {message && (
        <p className="font-body text-s-ink/50 dark:text-s-dm-text/50 text-sm max-w-xs leading-relaxed">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
