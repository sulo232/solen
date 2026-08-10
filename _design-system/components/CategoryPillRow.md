<!-- exists-check (2026-08-10): `npm run exists CategoryPillRow` returned 0 matches before this file
was written. The row itself is not new (it shipped as inline JSX inside `layout/Header.tsx` under
V3-D364/V3-D421k), only its file location is. Reused verbatim from Header.tsx: HEADER_CATEGORIES,
the press-state handling, the isActive derivation, every visual class and inline boxShadow string,
the mask-image. Not reused: the local focus-ring utility classes (redundant with the global link
focus treatment, see the file header comment) and Header's own `menuOpen` state (this component
subscribes to the `solen:menu-state` window event Header already broadcasts instead, the same
pattern `layout/CityTopBar.tsx` already consumes). -->

# CategoryPillRow

**File:** [app/[locale]/_components/layout/CategoryPillRow.tsx](../../app/[locale]/_components/layout/CategoryPillRow.tsx)
**Layer:** 1 chrome (moved 1:1 off `layout/Header.tsx`, adds no new visual tokens)
**New:** 2026-08-10, owner (dictated): "I also want the icon, you know, the icon was, like,
underneath of the search bar, you know, like, selecting and stuff and, like, maybe, like, a little
bit smaller." = the category pill row (All / Coiffeur / Barber / Nails / Spa / Inspo), moved BELOW
the search bar on every route that shows it. It was ABOVE the search bar before this change because
it rendered as a sibling of `layout/Header.tsx`, which mounts before `<main>` on every route; no
`order` utility on a shared ancestor can interleave a sibling of `<main>` between two of `<main>`'s
own children, so the row was extracted into its own component and mounted directly after each
route's own search pill instead.

---

## Purpose

The mobile-only (`md:hidden`) horizontal category strip. Renders directly under a page's own search
pill on: the homepage (`page.tsx`, after `<HomeSearchPill>`), every category/search route
(`search/SearchTemplate.tsx`, after the sticky search band; covers `/coiffeur`, `/barbershop`,
`/nails`, `/spa`, `/search`), and the bare `/inspo` route (`inspo/page.tsx`, after its own
`<HomeSearchPill>`, confirmed by grep to NOT use `SearchTemplate`, only a stale comment reference to
it). Self-gates its own visibility (see below), so it is safe to mount unconditionally at all three
call sites, including `SearchTemplate.tsx`, which also renders on 2-segment city-category routes
(e.g. `/basel/coiffeur`) where the row correctly renders nothing, same as it did inside Header.tsx.

---

## Why a standalone component instead of staying inline in Header.tsx

Header.tsx mounts once per route, before `<main>`, and used to render this row as a plain (never
sticky, see below) sibling right after its own `</header>`. That put the row physically above
every route's search pill in the DOM regardless of any flex/order CSS, because the search pill lives
INSIDE `<main>`, a completely different subtree. The only way to place the row after the search pill
in the rendered order is to render it from inside (or immediately after) the element that owns the
search pill, which differs per route (`page.tsx`'s sticky wrapper / `SearchTemplate.tsx`'s sticky
search band / `inspo/page.tsx`'s inline pill). A standalone component that derives its own
active-route state from `usePathname()` composes cleanly at all three sites without prop-drilling
locale, menu-open state, or route-derived booleans down from each host.

---

## Public API

```ts
export default function CategoryPillRow(): JSX.Element | null;
```

No props. Client component (`"use client"`). Pulls `locale` from `useLocale()` (next-intl) and
derives its own `isHome` / `isDiscover` / `categorySegment` from `usePathname()`, reproducing
`layout/Header.tsx`'s exact regexes (not a new derivation). Returns `null` when none of those are
true (mirrors Header's former `showCategoryChrome` gate).

---

## State + external wiring

- **`pressedCategory` / press feedback:** local `useState`, JS-held for 220ms per tap (unchanged
  from Header.tsx; iOS Safari never fires `:active` on an element with no touch listener, so a
  CSS-only press window is zero-length).
- **`menuOpen` fade:** Header.tsx already broadcasts `solen:menu-state` (`{ detail: { open } }`) on
  every mobile-menu open AND close, consumed the same way by `layout/CityTopBar.tsx`. This
  component listens for the same event instead of adding a new mechanism (no change to Header.tsx
  needed for this half of the extraction).

---

## Deliberately NOT sticky

Owner, 2026-08-01, live and literal: "why is the category pills still sticky? What the fuck are you
doing bro? No." The row is a plain child in normal document flow at every call site, no
`sticky`/`fixed` class anywhere in this file. Each host renders it as a sibling AFTER its own sticky
search-pill wrapper (never nested inside the sticky element), so the sticky wrapper's own flow-space
keeps this row positioned directly beneath it regardless of scroll position.

---

## The one geometry change in this same turn

Owner: "maybe, like, a little bit smaller, so it fits more... so people can know that it's actually
scrollable." MEASURED, not eyeballed (see the in-file comment on the `role="tablist"` row for the
full before/after numbers). The ONLY value touched here (on top of an already-shipped first-pass
shrink still in Header.tsx's working-tree diff at the time of this extraction): pill horizontal
padding `px-3` -> `px-2.5`. Nothing else about the pill's own treatment changed, per the owner's own
words about this row: "not on a category, it's already good. It only looks good how it is."

---

## Use for / Don't reuse for

**Use:** directly after a route's own search pill, on any route that shows the global category
navigation (home / category / search / inspo).

**Don't reuse for:** any surface without a search pill above it (this row's whole reason for
existing is "underneath the search bar"); deep/profile pages, PDP, dashboard, checkout, none of
which show category chrome.

---

## Related

- `layout/Header.tsx` — the row's previous home; still owns `CATEGORY_SEARCH_SEGMENTS`/
  `categorySegment` for its own unrelated logic (compact search-pill fusion, `MobileCityChip` route
  gate, the header's own scroll-collapse fold) and still broadcasts `solen:menu-state`.
- `homepage/HomeSearchPill.tsx` — the search pill this row sits under on home and `/inspo`.
- `search/SearchTemplate.tsx` — the search pill this row sits under on every category/search route.
- `layout/CityTopBar.tsx` — the other existing consumer of the `solen:menu-state` window event,
  the precedent this component's `menuOpen` listener follows.
