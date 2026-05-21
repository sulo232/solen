"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Indeterminate state — Lucide minus icon, brand bg.
   * Used for parent-toggle UX in nested checkbox groups (e.g. cookie consent
   * "Alle Kategorien" master toggle when sub-categories are mixed).
   *
   * Note: HTML doesn't support `indeterminate` as an attribute — it's a JS-only
   * property on the DOM node. We sync it via effect.
   */
  indeterminate?: boolean;
  /**
   * The label text or node beside the checkbox. If omitted, only the box renders
   * — useful for table-row checkboxes where the row itself is the label.
   */
  children?: React.ReactNode;
}

/**
 * Solen V3 checkbox primitive — Variant A (boxed) per LIVE_TRUTH §F.1.4.
 *
 * Used in classic forms: B2B settings, profile settings, cookie consent categories,
 * report-content reasons. For filter sheets use `<PillToggle mode="multi">` instead
 * (Variant B — same data binding, different rendering).
 *
 * @example
 * const [subscribed, setSubscribed] = React.useState(false);
 * <Checkbox checked={subscribed} onChange={(e) => setSubscribed(e.target.checked)}>
 *   Newsletter abonnieren
 * </Checkbox>
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { className, indeterminate, disabled, checked, children, id, ...props },
    forwardedRef,
  ) {
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLInputElement, []);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <label
        className={cn(
          "group inline-flex items-center gap-[10px] cursor-pointer select-none py-[6px]",
          "font-body font-normal text-[16px] text-s-ink",
          disabled && "cursor-not-allowed opacity-40",
          className,
        )}
      >
        <input
          ref={internalRef}
          type="checkbox"
          disabled={disabled}
          checked={checked}
          id={id}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex items-center justify-center shrink-0",
            "w-5 h-5 border-2 border-s-ink/25 bg-s-bg-base rounded-[6px]",
            "transition-colors duration-150 ease-snap",
            "peer-checked:bg-s-brand peer-checked:border-s-brand",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-s-brand peer-focus-visible:outline-offset-2",
            "group-active:scale-[0.92] [&]:transition-transform",
            indeterminate && "!bg-s-brand !border-s-brand",
          )}
        >
          {indeterminate ? (
            <Minus className="w-[14px] h-[14px] text-white" strokeWidth={3} aria-hidden="true" />
          ) : (
            <Check
              className={cn(
                "w-[14px] h-[14px] text-white",
                "transition-transform duration-300 ease-spring",
                checked ? "scale-100" : "scale-0",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          )}
        </span>
        {children && <span>{children}</span>}
      </label>
    );
  },
);
