"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * V3 Textarea style variants — LIVE_TRUTH §F.1.2.
 *
 * Same layout-shift-safe approach as TextInput: 1px border + ring-1 ring-inset for stuck states.
 * `resize: vertical` only — never `resize: both` (breaks layouts per §F.1.2 spec).
 */
const textareaVariants = cva(
  cn(
    // base
    "block w-full font-body font-normal text-s-ink leading-[1.5]",
    "bg-s-bg-base border border-s-ink/10 rounded-[12px]",
    "px-4 py-3 text-[14px]",
    "placeholder:text-s-ink-3",
    "selection:bg-s-brand/20",
    "transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap",
    "caret-s-brand",
    "resize-y min-h-[88px] max-h-[280px]",
    // focus-visible
    "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
    "focus-visible:border-s-brand",
    // disabled
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-3",
  ),
  {
    variants: {
      tone: {
        default: "",
        error:
          "border-s-error ring-1 ring-inset ring-s-error " +
          "focus-visible:outline-s-error focus-visible:border-s-error",
        warning:
          "border-s-warning ring-1 ring-inset ring-s-warning " +
          "focus-visible:outline-s-warning focus-visible:border-s-warning",
        success:
          "border-s-success ring-1 ring-inset ring-s-success " +
          "focus-visible:outline-s-success focus-visible:border-s-success",
        active:
          "border-s-brand ring-1 ring-inset ring-s-brand bg-s-bg-active",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export type TextareaTone = NonNullable<VariantProps<typeof textareaVariants>["tone"]>;

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual tone (LIVE_TRUTH §F.1.0b). Default `default` — focus-visible only. */
  tone?: TextareaTone;
}

/**
 * Solen V3 textarea primitive (LIVE_TRUTH §F.1.2).
 *
 * Used for: review write, report-content reasons, salon profile bio (B2B), B2B reply-to-review.
 * Pair with `<TextareaCounter>` when char limit matters.
 *
 * @example
 * <FieldLabel htmlFor="review">Deine Bewertung</FieldLabel>
 * <Textarea id="review" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
 * <TextareaCounter current={text.length} max={1000} />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, tone = "default", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={tone === "error" || undefined}
        className={cn(textareaVariants({ tone }), className)}
        {...props}
      />
    );
  },
);

interface TextareaCounterProps {
  current: number;
  max: number;
  className?: string;
}

/**
 * Companion character counter for `<Textarea>` (LIVE_TRUTH §F.1.2).
 *
 * Avant Garde Gothic 400 11px ink-3, tabular-nums, bottom-right outside the field.
 * Switches to brand-teal when within 20% of max (≥ 80% used) — soft warn, not blocking.
 */
export function TextareaCounter({ current, max, className }: TextareaCounterProps) {
  const ratio = max > 0 ? current / max : 0;
  const isWarn = ratio >= 0.8;

  return (
    <p
      aria-live="polite"
      className={cn(
        "font-body font-normal text-[11px] tabular-nums text-right mt-[6px]",
        isWarn ? "text-s-brand font-medium" : "text-s-ink-3",
        className,
      )}
    >
      {current} / {max}
    </p>
  );
}
