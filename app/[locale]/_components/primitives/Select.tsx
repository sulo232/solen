"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3 Select style variants — LIVE_TRUTH §F.1.3.
 *
 * v1 ships native `<select>` on every device. iOS / Android render their platform pickers
 * (wheel / sheet) — we get correct mobile UX for free. Custom dropdowns (typeahead, multi-select,
 * virtualized lists) defer to v2.
 */
const selectVariants = cva(
  cn(
    // base — strip browser-default chevron, mirror TextInput
    "block w-full appearance-none font-body font-normal text-s-ink",
    "bg-s-bg-base border border-s-border rounded-[12px]",
    "cursor-pointer",
    "transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap",
    // padding-right 40px to leave room for the custom chevron
    "pr-10",
    // focus-visible
    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
    // disabled
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-2",
    // unstyle the placeholder option in some browsers
    "[&_option:disabled]:text-s-ink-2",
  ),
  {
    variants: {
      size: {
        sm: "h-10 text-[14px] pl-3 py-[10px]",
        md: "h-14 text-[16px] pl-4 py-3",
        lg: "h-16 text-[18px] pl-5 py-[18px]",
      },
      tone: {
        default: "",
        error:
          "border-s-error ring-1 ring-inset ring-s-error",
        warning:
          "border-s-warning ring-1 ring-inset ring-s-warning",
        success:
          "border-s-success ring-1 ring-inset ring-s-success",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "default",
    },
  },
);

export type SelectTone = NonNullable<VariantProps<typeof selectVariants>["tone"]>;
export type SelectSize = NonNullable<VariantProps<typeof selectVariants>["size"]>;

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Size variant. Default `md`. */
  size?: SelectSize;
  /** Visual tone. Default `default`. */
  tone?: SelectTone;
}

/**
 * Solen V3 select primitive (LIVE_TRUTH §F.1.3).
 *
 * Native `<select>` with V3 styling and a Lucide chevron rendered as a sibling overlay.
 * Use a `<option value="" disabled selected>` first row for placeholder-style "select one"
 * UX — see example below.
 *
 * @example
 * <FieldLabel htmlFor="city">Stadt</FieldLabel>
 * <Select id="city" defaultValue="">
 *   <option value="" disabled>Stadt wählen</option>
 *   <option value="basel">Basel</option>
 *   <option value="zurich">Zürich</option>
 *   <option value="bern">Bern</option>
 * </Select>
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, size = "md", tone = "default", children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={tone === "error" || undefined}
          className={cn(selectVariants({ size, tone }), className)}
          {...props}
        >
          {children}
        </select>
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none",
            "text-s-ink-2",
          )}
        >
          <ChevronDown className="w-[14px] h-[14px]" strokeWidth={2.5} />
        </span>
      </div>
    );
  },
);
