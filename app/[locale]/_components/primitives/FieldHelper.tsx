"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldHelperTone = "default" | "error" | "warning" | "success";

interface FieldHelperProps {
  tone?: FieldHelperTone;
  children: React.ReactNode;
  className?: string;
  /**
   * Render as an `aria-live="polite"` region. Defaults to `polite` for `error`/`warning` tones
   * (so screen readers announce validation changes without interrupting). Override with `false`
   * to suppress (e.g. when the parent already wraps multiple helpers in one live region).
   */
  live?: boolean;
}

/**
 * Solen V3 form-field helper / error / warning / success message (LIVE_TRUTH §F.1.0).
 *
 * - `default` → ink-3 `#7A6957`, weight 400, no icon (general explanatory helper text)
 * - `error`   → red `#D32F2F`, weight 500, alert-circle icon, `role="alert"`
 * - `warning` → amber `#F59E0B`, weight 500, alert-triangle icon
 * - `success` → green `#16A34A`, weight 500, check-circle icon
 *
 * Note on success: per §F.1.0 the DEFAULT success state has NO message (green border + checkmark
 * inside the field is enough; words are noise). `<FieldHelper tone="success">` is opt-in for
 * surfaces that explicitly want a confirmation line.
 *
 * @example
 * <FieldHelper>Mindestens 8 Zeichen.</FieldHelper>
 * <FieldHelper tone="error">Diese E-Mail-Adresse ist nicht gültig.</FieldHelper>
 */
export function FieldHelper({
  tone = "default",
  live,
  className,
  children,
}: FieldHelperProps) {
  const Icon =
    tone === "error" ? AlertCircle :
    tone === "warning" ? AlertTriangle :
    tone === "success" ? CheckCircle2 :
    null;

  const ariaLive =
    live === false
      ? undefined
      : (live === true || tone === "error" || tone === "warning")
        ? "polite"
        : undefined;

  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      aria-live={ariaLive}
      className={cn(
        "font-body leading-[1.4] text-[13px] flex items-start gap-[6px] mt-[6px]",
        tone === "default" && "font-normal text-s-ink-3",
        tone === "error" && "font-medium text-s-error",
        tone === "warning" && "font-medium text-s-warning",
        tone === "success" && "font-medium text-s-success",
        className,
      )}
    >
      {Icon && (
        <Icon
          className="w-[14px] h-[14px] shrink-0 mt-[2px]"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </p>
  );
}
