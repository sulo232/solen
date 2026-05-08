"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "type" | "value"
  > {
  /** Controlled checked state. Pair with `onCheckedChange`. */
  checked?: boolean;
  /** Uncontrolled initial checked state. */
  defaultChecked?: boolean;
  /** Fires when the user toggles the switch. */
  onCheckedChange?: (checked: boolean) => void;
  /** Optional label rendered to the LEFT of the switch (16px gap, right-aligned switch). */
  label?: React.ReactNode;
  /** Optional sub-label below the main label (12px ink-3). */
  subLabel?: React.ReactNode;
}

/**
 * Solen V3 switch primitive (LIVE_TRUTH §F.1.6).
 *
 * Boolean on/off toggle — distinct from checkbox ("include in this list").
 * Track 44×24px, knob 20×20px. On-state uses brand-teal — accepted exception to §1
 * ≤ 4-instance rule for settings pages with many switches (per V2-D14).
 *
 * Anti-pattern: using a switch for "select 1 of 2-5 mutually exclusive options" — that's
 * a radio group. Switch = on/off ONLY.
 *
 * @example
 * const [enabled, setEnabled] = React.useState(false);
 * <Switch
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="Push-Benachrichtigungen"
 *   subLabel="Termin-Erinnerungen 24h vorher"
 * />
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      onClick,
      label,
      subLabel,
      disabled,
      id,
      ...props
    },
    ref,
  ) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const next = !checked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange?.(next);
      onClick?.(event);
    };

    const switchButton = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleClick}
        id={id}
        className={cn(
          "relative shrink-0 w-11 h-6 rounded-full",
          "transition-colors duration-200 ease-snap",
          checked ? "bg-s-brand" : "bg-s-ink/15",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
          disabled && "opacity-40 cursor-not-allowed",
          !disabled && "cursor-pointer",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-[2px] w-5 h-5 rounded-full bg-white",
            "transition-[left,transform] duration-200 ease-snap",
            "shadow-[0_1px_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.04)]",
            checked ? "left-[22px]" : "left-[2px]",
            !disabled && "active:scale-[0.92] active:transition-transform active:duration-100 active:ease-thud",
          )}
        />
      </button>
    );

    if (!label) return switchButton;

    return (
      <label
        htmlFor={id}
        className={cn(
          "flex items-center justify-between gap-4",
          "py-[14px] border-b border-s-ink/[0.05] last:border-b-0",
          "cursor-pointer select-none",
          disabled && "cursor-not-allowed",
        )}
      >
        <span className="flex flex-col">
          <span className="font-body font-normal text-[14px] text-s-ink">{label}</span>
          {subLabel && (
            <span className="font-body font-normal text-[12px] text-s-ink-3 mt-1">
              {subLabel}
            </span>
          )}
        </span>
        {switchButton}
      </label>
    );
  },
);
