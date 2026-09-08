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
  // mockup-ok: dead-class removal only, base input law already renders this fill/border/radius with higher specificity (V3-D-input-fill-2026-07-17)
  cn(
    // base
    "block w-full font-body font-normal text-s-ink",
    // Depth system (2026-06-09, LOCKFILE §3.5): filled-gray at rest (Apple pattern), pops to
    // white + ink border on focus. The fill/border/radius themselves are now dead classes
    // here (removed 2026-07-17): globals.css's base input law already renders them with
    // higher specificity than these plain utilities, so re-declaring them here was a lie.
    // The `tone` variants below still own their border-color/ring on top of that base.
    "placeholder:text-s-ink-2",
    "selection:bg-s-ink/20",
    "transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap",
    "caret-s-brand",
    // Keyboard outline comes from the shared modality rule; pointer focus
    // preserves the resting field colors.
    // disabled: opacity .5, sunken bg, ink-3 text, not-allowed. Distinct from read-only below:
    // disabled = "not available right now" (removed from tab order, unfocusable, unselectable);
    // read-only = "this value is fixed by design" (still focusable + selectable, so its value
    // can be copied). Collapsing both into one state loses that distinction for sighted AND
    // assistive-tech users (states-forms-10). Full opacity, default cursor, no dimming.
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-2",
    // mockup-ok: reuses the exact disabled-state tokens (bg-s-bg-sunken / text-s-ink-2, both
    // already LOCKFILE-approved), no new hex. Not wired into any page yet (0 call-sites), so
    // this changes zero pixels on any live customer surface today, it is a primitive-API
    // addition per the finding's own enforcement note (states-forms-10).
    "read-only:cursor-default read-only:bg-s-bg-sunken read-only:text-s-ink-2 read-only:focus-visible:border-s-border read-only:focus-visible:bg-s-bg-sunken",
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
          "border-s-error ring-1 ring-inset ring-s-error",
        warning:
          "border-s-warning ring-1 ring-inset ring-s-warning",
        success:
          "border-s-success ring-1 ring-inset ring-s-success",
        // Active = mouse-focused / typing — peach-tinted bg + brand border
        active: "border-s-ink ring-1 ring-inset ring-s-ink bg-s-bg-active",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "default",
    },
  },
);

export type TextInputTone = NonNullable<
  VariantProps<typeof inputVariants>["tone"]
>;
export type TextInputSize = NonNullable<
  VariantProps<typeof inputVariants>["size"]
>;

export interface TextInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
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
  /** Localized accessible labels for the password reveal control. */
  revealLabels?: { show: string; hide: string };
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
      revealLabels = { show: "Passwort anzeigen", hide: "Passwort verbergen" },
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
            hasTrailingSlot && "!pr-11",
            className,
          )}
          {...props}
        />
        {hasTrailingSlot && (
          <div
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2",
              "flex h-11 w-11 shrink-0 items-center justify-center",
              "pointer-events-none [&>button]:pointer-events-auto",
            )}
          >
            {showSpinner && (
              <span
                role="status"
                aria-label="Wird geprüft"
                className="w-[14px] h-[14px] rounded-full border-2 border-s-border border-t-s-brand animate-spin"
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
                  "flex h-11 w-11 shrink-0 items-center justify-center",
                  "text-s-ink-2 hover:text-s-ink",
                  "transition-colors duration-150 ease-snap",
                  "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 rounded-sm",
                )}
                aria-label={revealed ? revealLabels.hide : revealLabels.show}
                tabIndex={disabled ? -1 : 0}
              >
                {revealed ? (
                  <EyeOff
                    className="w-[18px] h-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="w-[18px] h-[18px]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
