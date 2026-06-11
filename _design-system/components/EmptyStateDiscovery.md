# EmptyStateDiscovery

**File:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx`
**Layer:** 1 chrome (+ Layer 3 hint icon: heart #FF3366 / ink)
**Status:** shipped 2026-06-11, final form same day: v2 widgets (200px banner + hint row + rail) KEPT per owner; the balance fix was the PAGE TITLE moving into the global header beside the back tile (Header.tsx deepPageTitle, profile-subpage route map) so the only in-body heading is the empty message.

## API
`<EmptyStateDiscovery locale title lead bannerImg bannerTitle bannerSub bannerHref hintIcon="heart|stamp|bookmark" hintText railTitle railHref salons={EmptyRailSalon[]} />`
Server component, no hooks. `salons` = REAL rows (slug/name/cover/rating/count/quartier) from the caller's query; banner photo = top salon's cover. Never demo data.

## Anatomy (final)
Page title = in the GLOBAL HEADER beside the back tile (not in the body). Body: 'Noch keine X.' 22px h2 -> lead -> 200px discovery banner (DS-10 scrim) -> sunken hint row (heart #FF3366 / ink icon disc) -> real-salon rail anchored low (ink Alle + chevron).

## Use for / don't reuse for
- USE: profile-list empty states (favorites, stamps, looks).
- DON'T: form/error empties (FormFieldError, 14.4 copy) or the 404 family (15 typographic).

## Why
Round-3 owner punch: centered minimal empties read unbalanced + dead ("pitch black tile", "I can see the footer"). This fills the viewport with real discovery content instead.
