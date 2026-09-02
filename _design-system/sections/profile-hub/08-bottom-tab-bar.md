# Bottom tab bar

**Reference:** airbnb.ch mobile web at 375x812, measured 2026-08-10 and recorded verbatim in the component header. Measured live on this screen: `_measured/profile-hub.json`, band index 3.
**Component:** `app/[locale]/_components/layout/BottomNav.tsx`
**Layer:** 1 (chrome). Shared furniture on every customer route that is not a commit surface.

## Layout

```
   +------------------------------------------+   y 774
   |  [Search]  [Inspo]  [Saved]  [Profil]    |   h 58, radius 9999, frosted
   +------------------------------------------+   y 832
    x 12                                w 366
```

Four items, floating capsule, `mx-3 mb-3` plus `env(safe-area-inset-bottom)`. It condenses on
scroll (labels drop, height shrinks) rather than leaving the screen.

## Measured (390x844, signed in, band index 3)
- Band box: **top 774, left 12, width 366, height 58**
- Surface: `background rgba(255, 255, 255, 0.8)`, `padding 0px`, **`border-radius 9999px`**
- Inactive label role: **12px / weight 400 / Inter / `rgb(107, 107, 107)`**, line-height 12, count 3, sample `"Suchen"`
- Active label role: **12px / weight 600 / Inter / `rgb(10, 10, 10)`**, line-height 12, count 1, sample `"Profil"`
- `cards` is empty for this band: `cardAnatomy` scans a band's descendants, not the band root, and the radius and the frost live on the root itself.
- `imagery.imageCount` 0

Count 3 inactive plus count 1 active is the whole bar, which confirms four items and the Profil
tab as the active one on this route.

## Tokens
- `FROST_GLASS` (`lib/frost-glass.ts`), the V3-D420 house glass recipe, imported rather than re-derived, but **both of its depth values are overridden inline** at `BottomNav.tsx:230`: the blur goes to `blur(20px) saturate(1.6)` and the shadow to `0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)` (owner "liquid glass", 2026-08-10), against the recipe's own `0 1px 3px rgba(0, 0, 0, 0.10)`. The recipe supplies the background and the border; the depth is this band's own
- Active: 600 ink label plus filled glyph. Inactive: 400 `s-ink-2`. No brand colour on a selected state, inherited from the CONTENT TABS rule (owner 2026-07-21)
- Label 12px, not the reference's 10px: sub-12px is below the LOCKFILE 2.5 legibility floor and an armed drift gate refuses it

## Interaction
- Search tab: the locale root. Inspo: `/inspo`. Saved: **`/inspo/saved`** (BottomNav.tsx:96). Profil: `/profile` when signed in, `/auth/login` when not.
- The bar hides under `SalonMobileBookBar`, the booking flow, checkout and the queue tracker, because the sticky-CTA floor gives that slot to the commit action.

## Intentional deviations
Three from the measured Airbnb reference, each with its reason in the component header: 12px label not 10px (legibility floor), ink active not a brand colour (colour contract), four items not three (the fourth carries the city selector and the language switcher, which have no other trigger).

## Empty state
None.

## Against the floors
- Contributes **1 element** (the active label at 12/600) to the screen's **33.33% weight >= 600 FAIL**.
- Renders 1 of the seven distinct sizes (12), shared with the group labels.
- **Overlap, measured:** this band occupies y 774 to 832 and the sign-out band (07) sits at y 892. Nothing overlaps at capture, but the bar is fixed, so at the bottom of a 1038px document it covers the last 58px of content. Recorded as measured geometry, not as a defect claim: I did not check the scrolled-to-bottom state.
- Imagery 0.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) **This band is the screen's entire elevation budget, and it is one step short.** `BottomNav.tsx:230` sets `boxShadow: "0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)"`, and the measured band background `rgba(255, 255, 255, 0.8)` matches the `FROST_GLASS` recipe, so this bar carries the ONE distinct non-none box-shadow on the screen. Nothing else can add a second: the rows are forbidden a container, the avatar's card record measures `boxShadow "none"`, and the header is transparent. The gate's floor is 2 (`FLOOR_ELEVATION_COUNT`, `scripts/check-geometry.mjs:205`) and the ladder screen carries 3. **One against a floor of 2 is a FAIL**, which corrects the PASS this folder's README carried until 2026-08-27. I did not run the gate: this is a source census of every shadow-bearing element plus the measured surface match, and it agrees with the independent arithmetic in the README.

## Provenance
- Owner 2026-08-10, "I think I want to have, like, a bottom navigation bar for, you know, the web area"
- Owner 2026-08-10, "there shouldn't be, like, hamburger menu. There should be a profile", "and then saved maybe, like, a heart icon"
- Owner 2026-07-21 CONTENT TABS, active = 600 ink, inactive = 400 ink-2, no fill
- V3-D420 frost recipe
