"use client";

import { type LucideIcon, AlertTriangle, RotateCcw, Search } from "lucide-react";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

/**
 * <PageState /> — canonical loading/empty/error wrapper.
 *
 * Every page that renders list/grid data should use this one component for all three
 * states instead of reimplementing them. See DESIGN_SYSTEM.md §12.
 *
 * Usage:
 *   <PageState state="loading" />
 *   <PageState state="empty" emptyIcon={Search} emptyTitle={t("noResults")} />
 *   <PageState state="error" onRetry={() => refetch()} />
 *
 * Escape hatch: if you need deep empty-state customization (illustrations,
 * zone-specific motion), use <EmptyState> directly — but keep loading/error here.
 */

type PageStateValue = "loading" | "empty" | "error";

interface PageStateProps {
  state: PageStateValue;

  // Shared
  className?: string;
  zone?: 1 | 2 | 3 | 4;

  // Loading
  skeletonCount?: number;            // how many skeleton cards (default 6)
  skeletonVariant?: "card" | "row";  // default "card"

  // Empty
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;

  // Error
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function PageState({
  state,
  className,
  zone = 3,
  skeletonCount = 6,
  skeletonVariant = "card",
  emptyIcon = Search,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyAction,
  errorTitle = "Something went wrong",
  errorMessage = "Please try again in a moment.",
  onRetry,
  retryLabel = "Retry",
}: PageStateProps) {
  if (state === "loading") {
    return (
      <div className={className ?? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} variant={skeletonVariant === "row" ? "text" : skeletonVariant} />
        ))}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className={className}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
          zone={zone}
        />
      </div>
    );
  }

  // error
  return (
    <div className={className ?? "min-h-[40vh] flex items-center justify-center px-4"}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-s-coral/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-s-coral" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-heading font-semibold text-s-ink mb-2">{errorTitle}</h2>
        <p className="text-sm text-s-ink/60 mb-5">{errorMessage}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
