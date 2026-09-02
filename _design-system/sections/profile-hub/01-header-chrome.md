# Global header on /de/profile, the "Profil" title bar

**Reference:** no screenshot. Measured live, signed in as the seeded customer: `_design-system/sections/_measured/profile-hub.json`, band index 0.
**Component:** `app/[locale]/_components/layout/Header.tsx` (title slot at line 804, route-to-title map at line 494: `/profile/?$` renders "Profil")
**Layer:** 1 (chrome). Shared furniture, not owned by this screen.

## Layout

```
+--------------------------------------------------+  y 0
|  [back tile]  Profil                             |   h 84, transparent
+--------------------------------------------------+  y 84  main starts
```

Full-bleed, `sticky top-0`, `z-50`, `py-5`, background `transparent`. The title sits BESIDE the
back tile rather than as a page h1 in the body (owner 2026-06-11, Header.tsx line 456), which is
why `AccountHub` renders no page title of its own and its h1 is the customer's name instead.

## Measured (390x844, signed in, profile-hub.json band 0)
- Band box: top 0, left 0, width 390, height 84
- Surface: `background rgba(0, 0, 0, 0)`, `padding 20px 0px`, `border-radius 0px`
- One text role only: **18px / weight 700 / Inter Tight / `rgb(10, 10, 10)`**, line-height 27, letter-spacing -0.18px, count 1, sample `"Profil"`
- `imagery.imageCount` 0, `cards` empty

## Tokens
- Title: `font-heading text-[18px] font-bold tracking-[-0.01em]` (Header.tsx:804). The measured -0.18px is that -0.01em at 18px.
- Colour: `s-ink` `#0A0A0A`
- Surface: transparent, so the band takes the page's white.

## Interaction
- Back tile: browser history back.
- The title is not a control.

## Intentional deviations
- The screen carries no page h1. The title lives in the bar and the body h1 slot is spent on the customer's name (02-identity), which is the screen's display anchor.

## Empty state
None. The band renders identically for every signed-in state.

## Against the floors
- **18px is one of the seven distinct sizes** the screen renders, and it is the only element at that size (count 1). It is a legal LOCKFILE value (section H2 mobile), so the size itself is on-scale; the failure is the count of tiers on one screen, not this tier.
- **Weight 700 here is one of the four distinct weights** on the screen (400 / 500 / 600 / 700), against a ceiling of 2. This band owns one of the two over-ceiling weights.
- This band contributes 1 of the elements counted in the screen's **33.33% weight >= 600 share** (floors gate, first viewport), against the 30% ceiling.
- Imagery in this band: 0 images, 0 px of image area.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) This band spends one of the screen's size tiers (18px) and one of its bold elements on a title that restates the destination the customer just tapped. The ladder screen spends every one of its 5 tiers on content. Nothing else on the ladder moves here: no elevation step, no photographic area, no anchor.

## Provenance
- Owner 2026-06-11, profile sub-page titles sit beside the back tile (Header.tsx:456-461)
- Owner 2026-07-20/21 D1, "Konto" moved to `/profile/settings`, so `/profile` itself titles as "Profil" (Header.tsx:491-494)
