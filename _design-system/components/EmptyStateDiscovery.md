# EmptyStateDiscovery

**File:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx`
**Layer:** 1 chrome (+ Layer 3 hint icon: heart #FF3366 / ink)
**Status:** shipped 2026-06-11 (mockup 19 v3 Option B, owner-picked)

## API
`<EmptyStateDiscovery locale title lead bannerImg bannerTitle bannerSub bannerHref hintIcon="heart|stamp|bookmark" hintText railTitle railHref salons={EmptyRailSalon[]} />`
Server component, no hooks. `salons` = REAL rows (slug/name/cover/rating/count/quartier) from the caller's query; banner photo = top salon's cover. Never demo data.

## Anatomy (full height, no centered void)
Title + lead top -> discovery banner (DS-10 scrim, white label) -> sunken hint row (icon disc + one-liner) -> real-salon rail anchored low (210px cards, star + blue count + quartier).

## Use for / don't reuse for
- USE: profile-list empty states (favorites, stamps, looks).
- DON'T: form/error empties (FormFieldError, 14.4 copy) or the 404 family (15 typographic).

## Why
Round-3 owner punch: centered minimal empties read unbalanced + dead ("pitch black tile", "I can see the footer"). This fills the viewport with real discovery content instead.
