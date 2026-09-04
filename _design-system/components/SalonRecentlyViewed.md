# SalonRecentlyViewed

<!-- exists-check: net-new vs _design-system/components/SalonCard.md, SearchOverlay.md,
     SearchTemplate.md, MapSalonDetail.md, CategoryHero.md, Skeleton.md, SkeletonCard.md,
     SearchBar.md. Read the closest match (SalonCard.md) first: SalonCard is the CARD, this is a
     RAIL that renders SalonCards, so the two are host and guest rather than duplicates, and this
     doc links to it rather than restating any of its anatomy. The three search docs describe the
     search surfaces, not a salon-detail section. No existing doc covers a salon-page
     recently-viewed rail. -->

**File:** [app/[locale]/_components/salon/SalonRecentlyViewed.tsx](../../app/[locale]/_components/salon/SalonRecentlyViewed.tsx)
**Layer:** 1 (chrome, a carousel that hosts [SalonCard](./SalonCard.md))
**Locked since:** 2026-08-15

---

## Purpose

The salon page's "Zuletzt angesehen" rail: a horizontal carousel of the salons this visitor actually
opened, sitting directly above the "Ähnliche Stores" rail.

Owner, 2026-08-15: *"instead of having, like, in [Ihrer Nähe], what about if we have, like, specific
to their searches and something similar or something similar to the store instead."*

That is two asks in one sentence, so it became two rails:

| rail | answers | source |
|---|---|---|
| **SalonRecentlyViewed** (this) | "specific to their searches" | `useRecentlyViewed`, localStorage |
| **SalonVenuesNearby** | "something similar to the store" | `/api/salons/by-category` |

`SalonVenuesNearby` was renamed from "In der Nähe" to "Ähnliche Stores" in the same change. It never
filtered on geography; it always pulled other salons in this salon's category, so the old heading
described something the code did not do.

## Anatomy

Nothing here is drawn from scratch. It composes:

- `useRecentlyViewed` (`homepage/useRecentlyViewed.ts`), asked for 7 so that excluding the current
  salon still leaves a full rail of 6.
- [SalonCard](./SalonCard.md), the same card the home page and search already use.
- The carousel geometry copied from `SalonVenuesNearby`: card width `(100vw - 44px) / 1.25`, 12px
  gap, a quarter of the next card peeking as the scroll promise. The two rails sit next to each
  other, so they have to be the same object.

## The one rule that matters

**It returns `null` when there is nothing to show.** Not a skeleton, not an empty state, not a
fallback heading.

That is the 2026-07-06 hide-while-empty decision, and it is also why the homepage `RecentlyViewed`
section could not simply be reused here: that one swaps its heading to "Top auf Solen" for a visitor
with no history, which turns an empty personal rail into a generic one. On a salon page that would
be a second, worse similar-stores rail directly above the real one.

## The cost, stated rather than hidden

For a first-time visitor this rail does not exist. `useRecentlyViewed` reads localStorage, so
somebody arriving from search or a shared link has seen exactly one salon, the one they are on, and
this rail excludes it. Pre-launch that describes nearly every visit.

That is precisely why it ships **alongside** the similar-stores rail instead of replacing it. The
similar rail is computed from the salon itself and always has rows, so the page never loses its
discovery block on a first visit. Replacing the old rail outright, which is the simplest reading of
what was asked for, would have been a downgrade for new traffic.

## Copy

Heading is `recentlyViewed.title`, which already shipped in all four locales. No new copy was
written for this component.

## Don't

- Do not make it a page's only discovery block. It is empty by design for new visitors.
- Do not give it an empty state. Hiding is the decision, not an omission.
- Do not fabricate history to fill it. The hook's demo list is NODE_ENV-gated and never reaches a
  real visitor.
