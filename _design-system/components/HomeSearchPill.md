<!-- exists-check (2026-08-01): `npm run exists "SearchPill"` / `npm run exists "search pill"` /
`npm run exists "HomeSearchPill"` all returned 0 matches before this file was written. The closest
existing surface is SearchTemplate.tsx's own in-page search pill (the `bigSearchRef` block, ~lines
1246-1364 of that file), which only mounts on the category/search routes; the home route (`/`) had
no search-pill chrome at all before this component. Reused from it: every visual class (border,
`rounded-pill`, shadow, icon sizes, the 44px trailing tile) and the `ui.searchChrome.searchPlaceholder`
/ `salonDetail.openMenu` i18n keys, copied 1:1, not re-typed. -->

# HomeSearchPill

**File:** [app/[locale]/_components/homepage/HomeSearchPill.tsx](../../app/[locale]/_components/homepage/HomeSearchPill.tsx)
**Layer:** 1 chrome (copies locked `SearchTemplate.tsx` pill classes, adds no new visual tokens)
**New:** 2026-08-01, owner ask ("why is homepage still that bro"): every prior chrome pass landed on
the category pages (`/coiffeur` etc), the home page (`/`) never got the matching mobile chrome and
the two surfaces read as different products. Approved mockup:
`public/_mockups/home-v3/search-a.html` (the "All" pill selected = the home state).

---

## Purpose

Mobile-only search pill rendered directly under Header.tsx's category-pill row on the home route,
matching the visual treatment of the search pill `SearchTemplate.tsx` already renders on
`/coiffeur`, `/barbershop`, `/nails`, `/spa`, `/search`. Replaces the old Hero's 3-field
`SearchBar.tsx` form on mobile only; desktop keeps that form unchanged.

---

## Why a new file instead of importing SearchTemplate's pill directly

SearchTemplate's pill is not an exported subcomponent, it's inline JSX deeply coupled to that
component's own state: `activeCategory`/`q`/`cityName` (what the pill's line 1 shows),
`openSearchOverlay` (what tapping it does), `bigSearchRef` (the IntersectionObserver that reveals
the floating map FAB), and the `scrollProgress` motion value that morphs its padding/shadow on
scroll. None of that state exists on the home page, and mounting a second `SearchTemplate`-shaped
state machine on `/` just to reuse one block of markup would be a much larger, riskier change than
the chrome-consistency ask actually calls for. This file copies the pill's CLASSES (the part the
task asked to reuse: "reuse that component or its markup") and gives it home-appropriate behavior
(a real link to `/search`) instead.

---

## Public API

```ts
export default function HomeSearchPill({ locale }: { locale: string }): JSX.Element;
```

Client component (`"use client"`, uses `useTranslations` + a `window.dispatchEvent` click handler).
No `md:` gating inside the file, the call site (`Hero.tsx`) wraps it in a `md:hidden` sibling next
to the `max-md:hidden` desktop hero block, mirroring FLOORS LAW 8 ("the same thing looks the same
everywhere") between the home and category-route pill treatments.

---

## Behavior differences from SearchTemplate's pill (both behavioral, not visual)

1. **Destination.** SearchTemplate's pill opens an in-place `SearchOverlay` composer. This pill
   links to `/{locale}/search`, the existing "all services, no category" route (same destination
   Header.tsx's desktop "Alle Services" link already points at). No overlay/composer is mounted on
   the home page, wiring one in for this alone was judged out of scope for a chrome-consistency
   pass.
2. **Real interactive elements.** A `<Link>` + `<button>` instead of SearchTemplate's
   `role="button"` divs, avoids nesting a button inside a div-as-button and gets native
   Enter/Space handling for free.
3. **Not sticky.** SearchTemplate's pill is pinned (`sticky top-0 z-[55]`) because Header.tsx's own
   `categoryCollapsed` scroll-fold makes the header collapse away underneath it. That fold was
   deliberately NOT widened to the home route (see the comment above the category-tab row in
   `Header.tsx`): the home page has nothing to hand the top-chrome slot off to, so pinning this
   pill too would fight the permanently-visible category-pill row for the same `top:0` space. This
   pill scrolls away with the rest of the feed like every other homepage section.

---

## i18n

`tChrome("searchPlaceholder")` (`ui.searchChrome` namespace) — the exact same key/fallback
SearchTemplate's pill renders when no category/query is set. `tSD("openMenu")` (`salonDetail`
namespace) for the trailing hamburger's aria-label — same key `Header.tsx`'s own hamburger and
SearchTemplate's trailing slot both already use. No new i18n keys in any locale.

---

## Use for / Don't reuse for

**Use:** the mobile homepage only, directly under the Header's category-pill row (mounted from
`Hero.tsx`).

**Don't reuse for:** category/search routes (those already render the real `SearchTemplate` pill,
importing this instead would be a regression), any desktop viewport, any route that needs the real
`SearchOverlay` composer wiring (search results filtering, city/date pickers).

---

## Related

- `search/SearchTemplate.tsx` — the pill this copies its classes from (`bigSearchRef` block).
- `layout/Header.tsx` — mounts the category-pill row above this pill (`HEADER_CATEGORIES`,
  `showCategoryChrome`) and owns the `solen:open-menu` listener this pill's trailing button fires.
- `homepage/Hero.tsx` — the call site; wraps the old 3-field `SearchBar.tsx` hero in `max-md:hidden`
  and this pill in `md:hidden`, splitting mobile/desktop at that one component.
