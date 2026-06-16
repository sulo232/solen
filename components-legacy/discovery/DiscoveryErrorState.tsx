"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import ErrorState from "@/components-legacy/ui/ErrorState";

/**
 * DiscoveryErrorState — inline "feed failed to load" state.
 *
 * Was an empty `<div/>` stub (a failed fetch showed nothing). Now wired to the
 * shared, locked <ErrorState> primitive (Layer-3 semantic red chip + headline +
 * ink "Try again" pill) so the feed NEVER shows a blank panel on error.
 * `onRetry` re-runs the page's fetch; `reset` is accepted for the route-level
 * error boundary path.
 */
export default function DiscoveryErrorState({
  reset,
  onRetry,
}: {
  error?: Error;
  reset?: () => void;
  onRetry?: () => void;
}) {
  const t = useTranslations("discovery");
  return (
    <ErrorState
      icon={WifiOff}
      title={t("errorTitle")}
      message={t("errorMessage")}
      retryLabel={t("errorRetry")}
      onRetry={onRetry ?? reset ?? (() => {})}
    />
  );
}
