import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — V3-D75-rule (2026-05-18).
 *
 * Canonical card primitive (shadcn-ui pattern, adapted to Solen V3 tokens:
 * border-radius `card` (16px), V3-D72 unified shadow `0 6px 24px rgba(0,0,0,0.06)`,
 * s-bg.surface white background, Hanken Grotesk body text, Bricolage Grotesque
 * headings via the `h3` cascade).
 *
 * Composition: Card > CardHeader (CardTitle + CardDescription) > CardContent >
 * CardFooter. All parts optional. Used as a generic content wrapper anywhere
 * SalonCard is too domain-specific — e.g. breadcrumb wrapper, info panels,
 * inline forms.
 *
 * See _rules/UTILITIES_INDEX.md "Card" entry.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card bg-s-bg-surface text-s-ink",
      "shadow-[0_6px_24px_rgba(0,0,0,0.06)]",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-s-ink",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("font-body text-[14px] text-s-ink-2", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
