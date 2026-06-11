# EmptyStateDiscovery

**File:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx`
**Layer:** 1 chrome (+ Layer 3 hint icon: heart #FF3366 / ink)
**Status:** shipped 2026-06-11; council-rebalanced same day (one heading, merged lead, 330px hero with in-situ frosted gesture button, 16/32 binary gap rhythm)

## API
`<EmptyStateDiscovery locale title lead bannerImg bannerTitle bannerSub bannerHref hintIcon="heart|stamp|bookmark" hintText railTitle railHref salons={EmptyRailSalon[]} />`
Server component, no hooks. `salons` = REAL rows (slug/name/cover/rating/count/quartier) from the caller's query; banner photo = top salon's cover. Never demo data.

## Anatomy (council recipe)
NO own title (page H1 owns the heading) -> 16px -> lead (empty message + gesture hint merged, max 2 lines) -> 32px -> HERO 330px (photo, bottom scrim, normal-case 13px label + 20px headline, FROST_GLASS icon button top-right teaching the gesture in-situ) -> 32px -> rail head (14px + ink Alle + chevron) -> real-salon rail.

## Use for / don't reuse for
- USE: profile-list empty states (favorites, stamps, looks).
- DON'T: form/error empties (FormFieldError, 14.4 copy) or the 404 family (15 typographic).

## Why
Round-3 owner punch: centered minimal empties read unbalanced + dead ("pitch black tile", "I can see the footer"). This fills the viewport with real discovery content instead.
