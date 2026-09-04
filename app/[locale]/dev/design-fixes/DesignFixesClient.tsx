"use client";

// Grounded-in: app/[locale]/_components/homepage/SalonCard.tsx, components-legacy/SalonCard.tsx
//
// Depicts: walk-in salon tiles rendered through the shared card -> app/[locale]/_components/homepage/SalonCard.tsx
// (the real converged card used across the homepage, search, and /favoriten today).
// Depicts: a saved-salon tile exactly as /profile/favorites renders it -> components-legacy/SalonCard.tsx
// (imported unchanged by app/[locale]/_components/profile/FavoritesList.tsx).
//
// exists-check: net-new vs app/[locale]/_components/homepage/SalonCard.tsx and
// components-legacy/SalonCard.tsx (both imported here unmodified, not duplicated) and
// app/[locale]/_components/profile/FavoritesList.tsx (the real caller whose exact props this
// mirrors for the legacy card; not edited, since it owns real DELETE-favorite wiring this
// comparison page must not touch). `npm run exists design-fixes` ran this turn at page.tsx.
//
// Two small client pieces PAIR A and PAIR C need a hook (useTranslations) or a function prop
// (onFavoriteToggle) a Server Component cannot pass, so they live here instead of inline in
// page.tsx. Both are thin: real components in, no new visual treatment invented.

import { useTranslations } from "next-intl";
import { SalonCard, type SalonCardProps } from "@/app/[locale]/_components/homepage/SalonCard";
import LegacySalonCard from "@/components-legacy/SalonCard";
import { CardMeta } from "@/app/[locale]/_components/primitives";

/**
 * PAIR A "Proposed" half: the real walk-in salons through the real homepage SalonCard.
 * SalonCard has no slot for a secondary "wait" line (Row 3 is address + price only), so the
 * wait status renders as a plain line directly under the card, in the card's own meta size and
 * colour (CardMeta, 12px, text-s-ink-2) rather than SalonCard's success-green hero number. This
 * is the one open choice the brief flagged: SalonCard was not extended with a new prop for it.
 */
export function WalkinProposedRow({
  items,
}: {
  items: { cardProps: SalonCardProps; waitMinutes: number; waitMinutesMax: number }[];
}) {
  const t = useTranslations("home.sections");
  return (
    <div className="-mr-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map(({ cardProps, waitMinutes, waitMinutesMax }) => {
        const sofort = waitMinutes <= 0;
        return (
          <div key={cardProps.slug} className="shrink-0">
            <SalonCard {...cardProps} />
            <CardMeta className="mt-1 px-[2px] text-[12px]">
              {sofort ? t("freeNow") : t("waitRange", { min: waitMinutes, max: waitMinutesMax })}
            </CardMeta>
          </div>
        );
      })}
    </div>
  );
}

/**
 * PAIR C "Current" half: the exact call FavoritesList.tsx makes (isFavorited, onFavoriteToggle
 * present so the filled heart renders in its real state), minus the real DELETE mutation, which
 * belongs to the live favorites feature and is out of scope for a visual comparison. The handler
 * is a no-op purely because a Server Component cannot pass a function as a prop; FavoritesList's
 * real removeFavorite (optimistic drop + DELETE + undo toast) is untouched at its real call site.
 */
export function SavedCardCurrent({ salon, locale }: { salon: Record<string, unknown>; locale: string }) {
  return (
    <LegacySalonCard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      salon={salon as any}
      locale={locale}
      isFavorited
      onFavoriteToggle={() => {}}
    />
  );
}
