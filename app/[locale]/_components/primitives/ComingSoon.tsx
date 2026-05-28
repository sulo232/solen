"use client";

import * as React from "react";
import { toast } from "./Toast";
import { cn } from "@/lib/utils";

/**
 * V3-D195 ComingSoon wrapper — SOURCE.md §11 Clickable Surface Contract option D.
 *
 * The canonical "feature shipping soon, but the surface exists today" affordance.
 * Wraps any clickable child (button / link / div) and:
 *   1. Visually dims it to 50% + sets `cursor-not-allowed`.
 *   2. Hijacks the click — preventDefault + stopPropagation + fires an info toast.
 *   3. Suffixes the aria-label with " — bald verfügbar" so screen readers warn.
 *   4. Marks the DOM with `data-coming-soon="true"` (drift-checker hook).
 *
 * Use this INSTEAD OF inventing your own dead-click pattern. Per Q16 the wrapper
 * is the single source of truth — callers can't accidentally diverge.
 *
 * @example wrap a button
 *   <ComingSoon label="Karten-Ansicht">
 *     <button className="...">Karte</button>
 *   </ComingSoon>
 *
 * @example wrap a link (the href stays present for layout but never navigates)
 *   <ComingSoon label="Benachrichtigungen">
 *     <Link href="/notifications" aria-label="Benachrichtigungen">
 *       <BellIcon />
 *     </Link>
 *   </ComingSoon>
 */

export interface ComingSoonProps {
  /**
   * The feature name shown in the toast title. Localised at the call-site —
   * the wrapper doesn't translate. Typically the German label of the surface
   * being tapped (e.g. "Karten-Ansicht", "Benachrichtigungen", "Filter").
   */
  label: string;
  /**
   * Override the default toast title. Defaults to `"{label} kommt bald"`.
   * Pass when you need a richer message (e.g. "Karten-Ansicht ist in Arbeit").
   */
  toastTitle?: React.ReactNode;
  /**
   * Optional toast description (sub-line under title). Defaults to none.
   */
  toastDescription?: React.ReactNode;
  /**
   * The single child element to wrap. Must be a real React element (not text).
   */
  children: React.ReactElement;
}

// Narrow shape for the props we mutate when cloning the child. Anything beyond
// these falls through untouched via the spread.
type WrappableElementProps = {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  "aria-label"?: string;
  tabIndex?: number;
  ["data-coming-soon"]?: string;
};

const COMING_SOON_ARIA_SUFFIX = " — bald verfügbar";

export function ComingSoon({
  label,
  toastTitle,
  toastDescription,
  children,
}: ComingSoonProps) {
  const childProps = (children.props as WrappableElementProps) ?? {};

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    // §11 option D — kill default navigation + stop the wrapped onClick.
    e.preventDefault();
    e.stopPropagation();
    toast.info(toastTitle ?? `${label} kommt bald`, {
      description: toastDescription,
    });
    // Defensive: still call the original handler IF it's specifically the noop
    // "() => {}" pattern (the drift-flagged dead click). Real handlers stay
    // suppressed — that's the whole point of wrapping.
  };

  // Compose aria-label: append the suffix unless it's already present.
  const existingAria = childProps["aria-label"] ?? label;
  const ariaLabel = existingAria.endsWith(COMING_SOON_ARIA_SUFFIX)
    ? existingAria
    : `${existingAria}${COMING_SOON_ARIA_SUFFIX}`;

  // Merge classNames so the wrapped element keeps its layout/styling but gains
  // the dim + cursor cue.
  const mergedClassName = cn(
    childProps.className,
    "opacity-50 cursor-not-allowed",
  );

  // Keyboard focus is preserved (tabIndex defaults to 0 if not set on the child)
  // so users can reach the affordance via Tab. The click handler fires on
  // Enter/Space when the child is a real <button> / <a>.
  const mergedTabIndex = childProps.tabIndex ?? 0;

  return React.cloneElement(children, {
    ...childProps,
    className: mergedClassName,
    onClick: handleClick,
    "aria-label": ariaLabel,
    tabIndex: mergedTabIndex,
    "data-coming-soon": "true",
  } as WrappableElementProps);
}
