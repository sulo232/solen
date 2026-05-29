import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

/**
 * Card text-hierarchy primitives — LOCKFILE §2.5 rule A13 (V3-D346 / V3-D348).
 *
 * Inside any repeating card or list-item (salon card, stylist card, service
 * row, review item, package card, search result) there is exactly ONE ink
 * anchor: the entity NAME. Everything else recedes to grey. These two
 * components bake those weights + colors so a card physically can't over-bold
 * its meta — the failure the user flagged 2026-05-28:
 * "using too bold ... multiple times that destroys my eye."
 *
 *   <CardName>Salon Maria</CardName>      // the one anchor — 500 / text-s-ink
 *   <CardMeta>14:30 · CHF 80</CardMeta>   // recessive meta — 400 / text-s-ink-2
 *
 * AESTHETIC axis: Uber contrast model (one darker anchor, calm grey rest),
 * measured in public/_pixel-refs/uber/. See LOCKFILE §2.5 rule A13.
 *
 * IMPORTANT — cn() is clsx (no tailwind-merge): a conflicting weight/color
 * passed via className will NOT reliably override the baked class. `className`
 * is for LAYOUT only (truncate, text-[Npx] sizes, leading, margins, flex). If
 * you bypass these and write raw `font-bold text-s-ink` on card meta, the drift
 * checker flags it (INFO A13).
 */

type CardTextProps = {
  children: ReactNode;
  /** Render element. Defaults: CardName=div, CardMeta=span. */
  as?: ElementType;
  /** LAYOUT classes only (truncate, text-[Npx], leading, mt-*, flex). Never weight/color. */
  className?: string;
};

/**
 * The single ink anchor of a card / list-item: the entity name.
 * Locked recipe: `text-s-ink font-medium` (500). Size via `className`.
 */
export function CardName({ children, as: Tag = "div", className }: CardTextProps) {
  return <Tag className={cn("font-body text-s-ink font-medium", className)}>{children}</Tag>;
}

/**
 * Recessive card / list-item meta: rating, distance, time, price, duration,
 * count, address, availability. Locked recipe: `text-s-ink-2 font-normal` (400).
 */
export function CardMeta({ children, as: Tag = "span", className }: CardTextProps) {
  return <Tag className={cn("font-body text-s-ink-2 font-normal", className)}>{children}</Tag>;
}
