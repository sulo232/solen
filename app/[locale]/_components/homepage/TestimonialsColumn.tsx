"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TestimonialsColumn — V2-D47 (2026-05-09) + V2-D49l split-tap (2026-05-10).
 *
 * Vertical marquee column of review cards. Pattern: render the reviews
 * list TWICE in a flex column, animate translateY 0 → -50% linearly. The
 * second copy is identical so the seam is invisible.
 *
 * V2-D49l SPLIT-TAP: each card has TWO independent click targets.
 *   1. Card body (full surface via absolute-positioned overlay button) →
 *      opens this review on the homepage. STUB today: routes to the salon's
 *      reviews page, since `/api/reviews/featured` + the inline-modal mount
 *      both ship in Phase 2. The handler comment marks the swap point.
 *   2. Salon-name pill (Store icon + name + chevron) → jumps to the salon
 *      detail page. Sits z-10 above the overlay button via relative
 *      positioning so its click takes precedence.
 *
 * HTML validity note: `<a>`-inside-`<a>` and `<a>`-inside-`<button>` are
 * both invalid. The overlay-button pattern is the only standards-compliant
 * way to give one card two distinct nav targets without nesting interactive
 * elements. Keyboard tab order: overlay button first (review), then salon
 * link (jump-to-salon).
 *
 * `prefers-reduced-motion` users get a static (no animation) column.
 */

export interface Review {
  stars: number;
  text: string;
  initials: string;
  name: string;
  /** City + relative time only — salonName field below renders separately. */
  meta: string;
  /** Display name for the salon link (e.g. "Salon Maria"). */
  salonName: string;
  /** Salon slug — used for the inner `/salon/[slug]` link target. */
  salonSlug: string;
}

export function TestimonialsColumn({
  reviews,
  duration = 30,
  className,
}: {
  reviews: Review[];
  duration?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  /**
   * Card-body click → opens this review on the homepage. STUB v1: routes
   * to the salon's reviews page, where the user can see this review in
   * its full salon context. Phase 2 swaps this for an inline-modal
   * mount (`<Modal>` primitive from §F.2) populated with the full review
   * payload + salon snippet card + "buchen" CTA.
   */
  const openReview = (slug: string) => {
    // V2-D49l TODO (Phase 2): replace with `setActiveReviewId(r.id)` to
    // open inline review modal. For now, salon's reviews page is the
    // closest existing surface.
    router.push(`/salon/${slug}/reviews`);
  };

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        animate={prefersReducedMotion ? undefined : { translateY: "-50%" }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration, repeat: Infinity, ease: "linear", repeatType: "loop" }
        }
        className="flex flex-col gap-4 pb-4 will-change-transform"
      >
        {[...Array(2)].map((_, copyIdx) => (
          <React.Fragment key={copyIdx}>
            {reviews.map((r, i) => (
              <div
                key={`${copyIdx}-${i}`}
                className={cn(
                  "relative rounded-xl border border-s-ink/[0.05] bg-white/[0.78] backdrop-blur-[10px]",
                  // V2-D47-3: cards bumped one notch up for mobile readability.
                  // p-3 (12px) felt too cramped at 2-col 375px width; p-4 (16px) better.
                  "p-4 shadow-[0_1px_3px_rgba(4,51,56,0.04)]",
                  "transition-[transform,box-shadow] duration-200 ease-glide",
                  "hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(4,51,56,0.10)]",
                  "focus-within:-translate-y-[2px] focus-within:shadow-[0_8px_20px_rgba(4,51,56,0.10)]",
                )}
              >
                {/* V2-D49l overlay button — full-card click target. Sits
                    UNDER the salon link via z-index so its click is
                    pre-empted when user taps the salon pill.
                    `aria-label` describes the action, not the content,
                    since SR users get the content from the relative content
                    block below. */}
                <button
                  type="button"
                  onClick={() => openReview(r.salonSlug)}
                  aria-label={`Bewertung von ${r.name} öffnen`}
                  className={cn(
                    "absolute inset-0 z-0 rounded-xl",
                    "active:scale-[0.98] active:duration-[80ms] transition-transform",
                    "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
                  )}
                />

                {/* Stars row */}
                <div
                  className="relative pointer-events-none inline-flex gap-[1px] text-[12px] text-[#F3A864] tracking-[0.05em]"
                  aria-hidden
                >
                  {"★".repeat(r.stars)}
                </div>

                {/* Quote — line-clamp-3 keeps narrow card heights consistent.
                    pointer-events-none lets the underlying overlay button
                    receive the click. */}
                <p className="relative pointer-events-none mt-2 font-body text-[13px] leading-[1.5] text-s-ink line-clamp-3">
                  &ldquo;{r.text}&rdquo;
                </p>

                {/* Author + meta + salon link */}
                <div className="relative mt-3 flex items-start gap-2.5">
                  <div
                    className="pointer-events-none font-display grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black text-s-brand"
                    style={{
                      background: "linear-gradient(135deg, #C2F0F1, #CAE8FF)",
                    }}
                    aria-hidden
                  >
                    {r.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="pointer-events-none font-body text-[12px] font-bold text-s-ink truncate">
                      {r.name}
                    </div>
                    <div className="pointer-events-none font-body text-[11px] text-s-ink-3 truncate">
                      {r.meta}
                    </div>
                    {/* V2-D49l salon link — secondary tap target, sits ABOVE
                        the overlay button via relative + z-10. Visually
                        cued as a link (brand color + chevron + Store icon)
                        so users know it's a separate navigation. */}
                    <Link
                      href={`/salon/${r.salonSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Salon ${r.salonName} ansehen`}
                      className={cn(
                        "relative z-10 mt-1.5 inline-flex items-center gap-1",
                        "font-body text-[11px] font-semibold text-s-brand",
                        "transition-colors duration-150 ease-glide hover:text-s-brand-mid",
                        "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm",
                      )}
                    >
                      <Store size={11} strokeWidth={2.25} aria-hidden />
                      <span className="truncate max-w-[120px]">{r.salonName}</span>
                      <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
