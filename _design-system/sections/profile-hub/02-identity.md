# Identity band, the eyebrow + avatar + name + edit link

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`, band index 2 (the name column) plus the avatar card record and the 24px monogram role inside band index 1.
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:132-158`, avatar from `app/[locale]/_components/primitives/Avatar.tsx`
**Layer:** 2 (composed from the Avatar primitive) + Layer 1 chrome around it

## Layout

```
  Konto                                   12/600, s-ink-2, mb-3.5
  +--------+
  |  TK    |  Test Kunde                  28/600 Inter Tight, anchor
  | 60x60  |  Profil bearbeiten           14/500 s-accent link
  +--------+
  x=20      x=94                          gap 14
```

`pt-[18px]` opens the band. Avatar is `size={60}`, a number, so `Avatar` computes its monogram
font size as `Math.round(60 * 0.4)` = 24px (Avatar.tsx:93). The name and the link sit in a
`min-w-0 flex-1` column, which is the wrapper the measurement reports as its own band.

## Measured (390x844, signed in)
- Name column box: **top 134, left 94, width 276, height 66**
- Name: **28px / weight 600 / Inter Tight / `rgb(10, 10, 10)`**, line-height 42, letter-spacing -0.56px, count 1, sample `"Test Kunde"`
- Edit link: **14px / weight 500 / Inter / `rgb(39, 110, 241)`**, line-height 21, count 1, sample `"Profil bearbeiten"`
- Monogram: **24px / weight 600 / Inter Tight / `rgb(10, 10, 10)`**, line-height 36, count 1, sample `"TK"`
- Avatar card record (the only card record on the screen): `radiusPx 9999`, `boxShadow "none"`, `border "none"`, `background rgb(245, 245, 244)`, `padding 0px`, example size **60x60**
- Eyebrow "Konto" is the 12px / 600 / `rgb(107, 107, 107)` role, count 4 across the screen; one of those four is this band's (the other three are group labels, files 03 to 05)
- `imagery.imageCount` 0 in every band of this screen

The geometry is internally consistent with the source: header height 84, `pt-[18px]` = 102,
eyebrow line-height 18 = 120, `mb-3.5` 14 = **134**, which is the measured band top. Left 94 is
`px-5` 20 + avatar 60 + `gap-3.5` 14.

## Tokens
- Name: `font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink` (AccountHub.tsx:140)
- Edit link: `text-[14px] font-medium text-s-accent` `#276EF1`, the locked treatment for a small clickable bit (design-contract "link" row). Hit box grown by `-my-1 py-1` from 17px to 25px for WCAG 2.5.8, with no visual change (AccountHub.tsx:151-153)
- Eyebrow: `text-[12px] font-semibold text-s-ink-2` `#6B6B6B`, sentence case, never tracked uppercase
- Avatar fallback surface: measured `rgb(245, 245, 244)` = `#F5F5F4`, ink `#0A0A0A` (`Avatar.tsx:16`). **CORRECTED 2026-08-27: that hex is not `s-bg-sunken`, and the source comment on that line calling it one is wrong.** The locked `s-bg-sunken` is `#F4F4F5` (`tailwind.config.js:152`), the COOL value; `#F5F5F4` is the WARM one that taste rule 3 names by name ("COOL sunken `#F4F4F5`, no warm cream"). Two transposed channels, one step off the token, on the largest non-text element of the screen. Recorded, not changed: the palette entry lives in a shared primitive and this folder writes no source.

## Interaction
- Tap "Profil bearbeiten": `/{locale}/profile/edit`, an existing route.
- The avatar is not a control on this screen.

## Intentional deviations
- The name is 28px, not the approved mockup's measured 24px. The mockup value sat under the >= 28px display-anchor floor and under 1.8x body, so the anchor was taken to the floor (AccountHub.tsx header comment, deviation 2).
- The avatar renders a monogram, not a photograph, whenever `profiles.avatar_url` is null or not an http(s) URL (`app/[locale]/profile/page.tsx:150`).

## Empty state
No zero state. `displayName` falls back through `profiles.display_name`, then the email local part, then the translated title (page.tsx:149), so the anchor always has a string.

## Against the floors
- **Display anchor 28px: PASS** against the >= 28px floor. This band owns the pass; nothing else on the screen is above 18px.
- **Anchor ratio 2.15x: PASS** against the 1.8x floor (28 over a 13px median body, floors gate, first viewport). This band owns that pass too.
- **Imagery 0%: FAIL** against the 33% floor, and this band owns it. It is the only slot on the screen with an image source at all, and the measurement records `imageCount 0` and `imageAreaPx 0` in all five bands, so the monogram path is what rendered. The screen has no other photographic slot to fail with.
- This band contributes **2 elements** to the screen's weight >= 600 count: the 28px name and the 24px monogram, plus the 12px eyebrow makes 3.
- **Two of the seven distinct sizes are this band's alone**: 28 and 24. 24px is ALLOWED_PX only as a dashboard-heading cap (`scripts/lib/type-scale-allowed.mjs`), and it is not authored here at all: it is `Math.round(size * 0.4)` from the avatar primitive, so it is a derived size that lands on the screen's type ladder without being declared on it.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) Two rows land here and they fall opposite ways. **Anchor 28px against 30px**, and the RATIO is effectively identical (2.15x here, 2.14x there), so the shape of the hierarchy is right and only the top of it is 2px short. **Photographic share 0% against 34.66%**, and this band holds the screen's only image slot, so the whole distance on that row is owned here. The two are not the same kind of gap: 2px is a value, 34.66 points is a missing content class.

## Provenance
- Owner 2026-08-02, "konto hub better", `public/_mockups/restraint/account-hub.html`
- FLOORS LAW 6, display anchor >= 28px
- E4 2026-08-05, the hub had no route to the editor; the link points at the existing `/profile/edit`
- 2026-08-03, owner, account-row glyphs are ink, `_design-system/references/airbnb--profile-list.md` IMG_6900
