// Grounded-in: app/[locale]/_components/homepage/Reviews.tsx
//
// exists-check: app/[locale]/dev/design-fixes/page.tsx already byte-copies this exact ReviewCard
// (its Pair B) into a Current + ONE proposed variant (shadow removed, border kept). This brief
// asks for a different split: TWO named sub-variants, hairline-only and shadow-only, so this is a
// second, independent byte-copy scoped to that comparison; the design-fixes copy is untouched.
// `npm run exists` ran this turn (see page.tsx header).
//
// Depicts: home review card -> app/[locale]/_components/homepage/Reviews.tsx (ReviewCard, an
// unexported inner function, byte-copied per the same pattern design-fixes/page.tsx already uses
// for this exact component).
//
// Not-a-salon-card: a review card (reviewer identity + stars + quote), not a salon result card.
//
// The real card carries `border-s-border` AND `shadow-elevation-2` together (LOCKFILE: "a card
// carrying elevation drops its border, never both"). VARY: two sub-variants, one keeping only the
// hairline border, one keeping only the shadow. Structure, copy, spacing and every other class are
// unchanged from the real ReviewCard.

import Link from "next/link";
import { ChevronRight, Star, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReviewCardData = {
  stars: number;
  text: string;
  initials: string;
  name: string;
  salonName: string;
  salonSlug: string;
  dateText: string;
};

function ReviewCardBody({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-[14px] font-semibold text-s-ink-2"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-[14px] font-semibold leading-[1.2] text-s-ink">
            {review.name}
          </div>
          <Link
            href={`/${locale}/salon/${review.salonSlug}`}
            aria-label={`View ${review.salonName}`}
            className="mt-0.5 inline-flex items-center gap-1 font-body text-[12px] font-normal text-s-ink-2 transition-colors duration-150 ease-glide hover:text-s-ink"
          >
            <Store size={11} strokeWidth={2.25} aria-hidden />
            <span className="max-w-[140px] truncate">{review.salonName}</span>
            <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[1px]">
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star key={i} size={12} stroke="none" aria-hidden className="fill-s-star" />
          ))}
        </div>
        <span className="shrink-0 font-body text-[12px] font-normal tabular-nums text-s-ink-2">
          {review.dateText}
        </span>
      </div>

      <p className="flex-1 font-body text-[14px] leading-[1.5] text-s-ink line-clamp-3">
        &ldquo;{review.text}&rdquo;
      </p>
    </>
  );
}

export function ReviewCardCurrent({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <div
      data-testid="review-current"
      className={cn(
        "relative flex min-h-[220px] w-[260px] flex-col rounded-2xl p-4",
        "border border-s-border bg-s-bg-surface shadow-elevation-2",
      )}
    >
      <ReviewCardBody review={review} locale={locale} />
    </div>
  );
}

export function ReviewCardHairlineOnly({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <div
      data-testid="review-hairline"
      className={cn(
        "relative flex min-h-[220px] w-[260px] flex-col rounded-2xl p-4",
        "border border-s-border bg-s-bg-surface",
      )}
    >
      <ReviewCardBody review={review} locale={locale} />
    </div>
  );
}

export function ReviewCardShadowOnly({ review, locale }: { review: ReviewCardData; locale: string }) {
  return (
    <div
      data-testid="review-shadow"
      className={cn(
        "relative flex min-h-[220px] w-[260px] flex-col rounded-2xl p-4",
        "bg-s-bg-surface shadow-elevation-2",
      )}
    >
      <ReviewCardBody review={review} locale={locale} />
    </div>
  );
}
