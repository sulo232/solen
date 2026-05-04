"use client";

import { AlertCircle } from "lucide-react";

/**
 * InlineError — Q22 error grammar, inline placement (under the field/section that errored).
 *
 * Distinct from `<Toast type="error">` (action-result feedback) and
 * `<ErrorFallback>` (page-level boundary). Use this for:
 *   - form field validation errors ("Email ungültig")
 *   - row-level errors in lists ("Konnte nicht laden")
 *   - section-level inline errors that don't warrant a toast or page fallback
 *
 * Anatomy: small icon + concise message, red token, no card chrome.
 *
 * i18n: caller localizes the message.
 */
interface InlineErrorProps {
  /** Concise error sentence */
  message: string;
  /** Hide the icon (icon-less variant for tight rows) */
  hideIcon?: boolean;
  className?: string;
  /** Optional retry handler — renders an inline link-button after the message */
  onRetry?: () => void;
  /** Localized retry-link label, e.g. "Erneut versuchen" */
  retryLabel?: string;
}

export default function InlineError({
  message,
  hideIcon = false,
  className,
  onRetry,
  retryLabel,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-1.5 font-body text-[11px] leading-[1.4]",
        "text-[--color-error]",
        className ?? "",
      ].join(" ")}
      style={{ color: "#D32F2F" }}
    >
      {!hideIcon && (
        <AlertCircle size={13} strokeWidth={2} className="shrink-0 mt-[1px]" aria-hidden />
      )}
      <span>
        {message}
        {onRetry && retryLabel && (
          <>
            {" "}
            <button
              type="button"
              onClick={onRetry}
              className="underline underline-offset-2 font-semibold hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-1"
            >
              {retryLabel}
            </button>
          </>
        )}
      </span>
    </div>
  );
}
