"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3 TextInput style variants — LIVE_TRUTH §F.1.1.
 *
 * Layout-shift-safe approach for the 1px → 2px border transition (default vs error/warning/
 * success/active): we keep `border-1` always, then add `ring-1 ring-inset ring-{tone}` to
 * paint the second pixel from the inside. Visually identical to a 2px border, but the
 * box-model layout doesn't shift on state change. Spec compliance is preserved.
 */
const inputVariants = cva(
  cn(
    // base
    "block w-full font-body font-normal text-s-ink",
    "bg-s-bg-base border border-s-ink/10 rounded-[12px]",
    "placeholder:text-s-ink-3",
    "selection:bg-s-brand/20",
    "transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap",
    "caret-s-brand",
    // focus-visible (kbd-only) — 2px brand outline + 2px offset per §1
    "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
    "focus-visible:border-s-brand",
    // disabled — opacity .5, sunken bg, ink-3 text, not-allowed
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-3",
  ),
  {
    variants: {
      size: {
        sm: "h-10 text-[14px] px-3 py-[10px]",
        md: "h-14 text-[16px] px-4 py-3",
        lg: "h-16 text-[18px] px-5 py-[18px]",
      },
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
        // Active = mouse-focused / typing — peach-tinted bg + brand border
        active:
          "border-s-brand ring-1 ring-inset ring-s-brand bg-s-bg-active",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "default",
    },
  },
);

export type TextInputTone = NonNullable<VariantProps<typeof inputVariants>["tone"]>;
export type TextInputSize = NonNullable<VariantProps<typeof inputVariants>["size"]>;

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Size variant (LIVE_TRUTH §F.1.0a). Default `md`. */
  size?: TextInputSize;
  /** Visual tone (LIVE_TRUTH §F.1.0b). Default `default` — focus-visible only. */
  tone?: TextInputTone;
  /**
   * Show a trailing loading spinner (e.g. async email-availability check).
   * Field stays editable per §F.1.0b — don't lock during loading.
   */
  loading?: boolean;
  /**
   * For `type="password"`, render an inline reveal toggle button on the right.
   * Default false. When true, an Eye / EyeOff button toggles between
   * `type="password"` (hidden) and `type="text"` (visible).
   */
  revealable?: boolean;
}

/**
 * Solen V3 text input primitive (LIVE_TRUTH §F.1.1).
 *
 * Native `<input>` with V3 styling. Composes with `<FieldLabel>` (above) and
 * `<FieldHelper>` (below) for the full field anatomy.
 *
 * @example
 * <FieldLabel htmlFor="email" required>E-Mail-Adresse</FieldLabel>
 * <TextInput id="email" type="email" autoComplete="email" />
 * <FieldHelper>Wir senden dir eine Bestätigung.</FieldHelper>
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      className,
      type = "text",
      size = "md",
      tone = "default",
      loading = false,
      revealable = false,
      disabled,
      ...props
    },
    ref,
  ) {
    const [revealed, setRevealed] = React.useState(false);
    const isPassword = type === "password";
    const showReveal = revealable && isPassword;
    const inputType = showReveal && revealed ? "text" : type;

    // Trailing slot — priority: loading > success-check > password-reveal
    const showSpinner = loading;
    const showSuccessCheck = !loading && tone === "success";
    const showRevealBtn = !loading && !showSuccessCheck && showReveal;
    const hasTrailingSlot = showSpinner || showSuccessCheck || showRevealBtn;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          aria-busy={loading || undefined}
          aria-invalid={tone === "error" || undefined}
          className={cn(
            inputVariants({ size, tone }),
            hasTrailingSlot && "pr-11",
            className,
          )}
          {...props}
        />
        {hasTrailingSlot && (
          <div
            className={cn(
              "absolute right-[14px] top-1/2 -translate-y-1/2",
              "flex items-center justify-center w-5 h-5",
              "pointer-events-none [&>button]:pointer-events-auto",
            )}
          >
            {showSpinner && (
              <span
                role="status"
                aria-label="Wird geprüft"
                className="w-[14px] h-[14px] rounded-full border-2 border-s-brand/20 border-t-s-brand animate-spin"
              />
            )}
            {showSuccessCheck && (
              <CheckCircle2
                className="w-4 h-4 text-s-success"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            )}
            {showRevealBtn && (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className={cn(
                  "w-[18px] h-[18px] flex items-center justify-center",
                  "text-s-ink-2 hover:text-s-ink",
                  "transition-colors duration-150 ease-snap",
                  "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 rounded-sm",
                )}
                aria-label={revealed ? "Passwort verbergen" : "Passwort anzeigen"}
                tabIndex={disabled ? -1 : 0}
              >
                {revealed
                  ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden="true" />
                  : <Eye className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden="true" />
                }
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
