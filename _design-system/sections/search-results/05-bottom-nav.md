# Floating bottom nav , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, band 6. It appears at this position in the file because `scripts/measure-sections.mjs` sorts bands by `rect.top`, and this one is `position: fixed`, so its DOM position is not where its box is.
**Component:** `app/[locale]/_components/layout/BottomNav.tsx`
**Layer:** 1 (chrome, navigation)

## Layout

```
              ╭──────────────────────────────────────╮   366 x 58, radius 9999
              │   ⌕        ◎         ♡         ☺     │   4 items, flex-1 each
y 774         │ Suchen   Inspo   Gespeichert  Profil │   labels 12px, all grey
              ╰──────────────────────────────────────╯
y 832                    12px + safe-area
y 844  ─────────────────────────────────────────────────  viewport bottom
```

## Measured

| what | measured |
|---|---|
| box | top **774**, left **12**, width **366**, height **58** |
| surface background | `rgba(255, 255, 255, 0.8)` |
| padding | `0px` |
| border radius | `9999px` |
| text roles | **one** role: 12px / weight **400** / Inter / `rgb(107, 107, 107)` / line-height 12 / letter-spacing normal / **count 4** / sample `Suchen` |
| card entries | **0** (see note below) |
| images | 0 |
| className recorded | `md:hidden fixed inset-x-0 bottom-0 z-[700] [body[data-overlay-open]_&]:hidden mx-3 mb-3 rounded-full overflow-hidden mb-[calc(12px+env(safe-area-inset-bottom))] transition-[margin,` (truncated in the JSON) |

Box arithmetic closes: 844 viewport minus 12 bottom margin minus 58 height is 774, the measured top. `mx-3` on each side of 390 is the measured 366 width and left 12. `env(safe-area-inset-bottom)` resolved to 0 in this headless run.

**Why `cards` is empty for a band that is plainly a card.** `cardAnatomy(root)` in `scripts/measure-sections.mjs` walks `root.querySelectorAll("*")`, which is descendants only and never the root itself. The nav's own radius and shadow are therefore absent from its own card list. Its shadow is set inline at `BottomNav.tsx:233`: `0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)`, over `FROST_GLASS` with `backdrop-filter: blur(20px) saturate(1.6)`. That value is read from source and is **not measured** in this JSON.

**All four labels measured at weight 400 and `s-ink-2`, which means no tab is active on this route.** `BottomNav.tsx:117` makes "Suchen" active when `rest === "/"` or when `rest` matches `^\/(search|coiffeur|barbershop|nails|spa)(\/|$)`. On `/de/basel/coiffeur` the remainder is `/basel/coiffeur`, which that pattern does not match, so `isActive("")` is false. `profileActive` is false as well. The active recipe is `text-s-ink` plus `font-semibold` plus `strokeWidth 2.2`; the measurement shows one role at 400 and grey with a count of 4, so none of the four is in it. On `/de/coiffeur` the same bar would light one tab. That is a second cross-screen inconsistency in the same family as item S2, recorded here and not changed.

## Chrome position

Not applicable to this section. The search pill's box is recorded in `02-search-band.md`. This bar is the OTHER fixed chrome on the screen, and the plan's live sweep found it consistent: "The fixed bottom bar is identical on all 11" (`_plans/DESIGN_CONSISTENCY_2026-08-27.md` section 1(c)). This measurement adds the numbers behind that word for one of the eleven: **y 774, h 58, w 366, radius 9999, at a 390x844 viewport.**

## Tokens

- Surface: `FROST_GLASS` (`lib/frost-glass.ts`, V3-D420) with the blur raised from 4px to 20px for a band-sized surface. Measured background `rgba(255, 255, 255, 0.8)`.
- Radius `rounded-full`, inset `mx-3 mb-3`, bottom offset `calc(12px + env(safe-area-inset-bottom))`
- Item: `flex-1`, height `h-14` (56) expanded / `h-12` (48) condensed, gap 1
- Icons: lucide `Search`, `Compass`, `Heart`, `User`, size 24, strokeWidth 1.8 inactive / 2.2 active
- Label: `font-body text-[12px] leading-none`, `font-normal` inactive / `font-semibold` active, `text-s-ink-2` inactive / `text-s-ink` active

## Interaction

- Four `Link` items, labels read from the `navigation` namespace in `messages/de.json`: Suchen (`/{locale}`), Inspo (`/{locale}/inspo`), Gespeichert (`/{locale}/inspo/saved`), and a fourth that resolves to `/{locale}/profile` with the label Profil when a session exists and to `/{locale}/auth/login` with the label Anmelden when it does not.
- Scroll direction condenses the bar: it drops the labels (`max-h-0 opacity-0`), shortens each item from 56 to 48, and steps its side margin from 12 to 24. It never narrows to a capsule and never unmounts. The measurement caught it expanded, at 58 tall with all four labels present.
- `[body[data-overlay-open]_&]:hidden` hides it while a full-screen sheet is up, rather than unmounting it, so the condensed state does not re-animate on every sheet open.
- `aria-current="page"` on the active item, which on this route is on none of them.

## Intentional deviations

- **Active is ink, not a brand colour.** Airbnb's is Rausch red on icon and label; the file states this deviation itself at line 33.
- **The bar floats rather than running edge to edge.** The file records that Instagram on the web was measured at a real 375-wide viewport and is a solid dark slab with `backdrop-filter: none`, so the glass recipe here is Solen's own `FROST_GLASS` and not a guess at theirs. That measurement note is quoted in the source and is not re-derived here.
- The fourth item is Profile, replacing a hamburger, owner 2026-08-10 ("there shouldn't be, like, hamburger menu. There should be a profile.", quoted at `BottomNav.tsx:70`). **It does not fire `solen:open-menu`, and this line said it did. Corrected 2026-08-27.** `BottomNav.tsx` holds no `dispatchEvent` and no `CustomEvent` anywhere in the file; item four is a `Link` (`:276`) to `/{locale}/profile` when a session exists and `/{locale}/auth/login` when it does not, which is what this file's own Interaction section already describes correctly. The claim came from a comment in `SearchTemplate.tsx:1383`, repeated in `HomeSearchPill.tsx:293`, and this spec inherited the comment instead of reading the file it names. The only listener is `Header.tsx:546-547` and the only surviving trigger on this route is the header hamburger. Full trace in `02-search-band.md`.

## Empty state

None. The bar renders the same four items on every route where it renders at all.

## Against the floors

This band sits inside the first viewport (774 to 832 of 844), so it counts.

- **F2 imagery 41.03% PASS**: contributes 0 px, and its 58px band is part of the denominator that the rails' 41.03% is measured against.
- **F6 display anchor 18px FAIL against 28**: contributes 12px text only.
- **F7a bold share 28.57% PASS against the 30% ceiling**: this band contributes **4 elements, none of them bold**, which is the largest single pull downward on the screen's bold share. Had one tab been active, that element would be `font-semibold` and the share would rise.
- **F7b anchor ratio 1.5x FAIL against 1.8**: contributes 4 more elements at 12px, holding the median body term at 12.
- **F7c four distinct sizes PASS**: contributes 12px, already used by the cards.
- **ELEVATION five levels PASS against a floor of 2**: this bar's inline `0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)` is one distinct box-shadow value on the screen. It is read from source, not from this JSON.

Against the owner's target ladder: this band is the one place besides the search pill where text sits below weight 600, which matches the ladder's "emphasis at 500, not 600" only by accident, since here nothing is emphasised at all.

## Provenance

- Owner 2026-08-10, "look how insta or any other social media does it with the bottom nav bar, liquid glass"
- Owner 2026-08-11, "bottom nav bar when it collapses too small" , the condense keeps full width and loses only labels
- Owner 2026-08-10, "there shouldn't be a hamburger menu. There should be a profile"
- V3-D420 `FROST_GLASS`, blur raised to 20px for a band-sized surface
- N1 (2026-08-11) , `data-overlay-open` hides rather than unmounts
- Design contract touch-target row , 44px floor, and the file notes Airbnb's own items measure the same
