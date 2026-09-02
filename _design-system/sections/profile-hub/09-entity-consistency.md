# Entity consistency, the salon on the profile surface (FLOORS LAW 8)

**Reference:** no screenshot. Source read 2026-08-27 in this worktree, plus `_measured/profile-hub.json`.
**Component:** the rule governs `components-legacy/SalonCard.tsx` and `app/[locale]/_components/homepage/SalonCard.tsx`. The hub itself renders neither.
**Layer:** 3 (a shared entity component and its variants), stated here because the hub is the entry point to the one profile-surface screen that renders a salon.

This file has **no band of its own** in `profile-hub.json`, and cannot have one: the hub renders
no store card at all. It exists because FLOORS LAW 8 is a rule about a RELATIONSHIP between
screens, and every other file in this folder scopes itself to one band on one screen, which is
the exact hole FLOORS LAW 8 was written to close.

## What the law says was broken

CLAUDE.md FLOORS LAW 8 records the defect by name: the same salon rendered on two live surfaces
the same minute, as one photo at a 5/4 ratio with a 22px radius on `/de`, and as a three-photo
collage at 195/131 with a different radius and no price on `/de/profile`.

## Layout

```
  ENTITY: one salon

  /de                         /profile/favorites            /de/profile (this hub)
  +----------------+          +----------------+            (no salon renders here
  |  photo 5/4     |          |  photo 5/4     |             at all, since 2026-08-02)
  |  radius 22px   |          |  radius 16px   |
  +----------------+          +----------------+
  homepage/SalonCard          components-legacy/SalonCard

           ^                           ^
           +--- same entity, two implementations, two radii
```

## Measured

**The collage half of the defect is closed.** Verified three ways:
- `profile-hub.json` records `imagery.imageCount 0` and `imageAreaPx 0` in all five bands, and one
  card record on the whole screen (the 60x60 avatar circle, `radiusPx 9999`). No 195x131 tile, no
  three-photo grid, nothing at any other radius.
- `app/[locale]/profile/page.tsx:8-17` records the removal, naming the "3-photo collage grid" and
  FLOORS LAW 8/9 by number.
- `_design-system/REMOVED.md` lines 115 and 116 carry it in the graveyard twice. Line 116 reads
  "a store rendered as a collage here and as a SalonCard on /de". A graveyard hit means it is not
  re-proposed without an explicit owner yes.

**The two-implementations half is NOT closed, and the record in the source overstates it.**
`app/[locale]/profile/page.tsx:15-17` claims the law is satisfied because "the one place a store
still needs to render for a saved item is /profile/favorites, which already composes the real
`SalonCard` (components-legacy/SalonCard.tsx)". Read against the code, "the real SalonCard" is not
a single object. There are **two different components with the same name**, both live, both
rendering a salon:

| file | photo | radius | rendered on |
|---|---|---|---|
| `components-legacy/SalonCard.tsx:184` | `aspect-[5/4]` | `rounded-[16px]` | `/profile/favorites` (via `_components/profile/FavoritesList.tsx:12,104`), `/brand/[slug]`, `/dashboard/settings` |
| `app/[locale]/_components/homepage/SalonCard.tsx:426` | `aspect-[5/4]` | `rounded-[22px]` | `/de`, via `AvailableThisWeek`, `ForYouSalonRows`, `ForYouAffinityRow`, `RecentlyViewed`, `TopCategoryRails`, `SalonOfMonth`, all importing `./SalonCard`; also `SalonVenuesNearby`, `CategoryBrowseRails`, `CategoryMobileRails` |

So the 5/4 ratio the law names now agrees across both. **The radius does not: 22px on `/de`, 16px
on the profile surface.** The pair the law named as two objects for one entity is still two
objects for one entity. What changed on 2026-08-02 is that the profile-surface object stopped
being a bespoke collage and became a second card, which is a smaller gap, not a closed one.

`app/[locale]/profile/page.tsx` does **not** import either card. Its only two occurrences of the
string `SalonCard` are prose comments (lines 17 and 119). The hub renders no salon.

## The rule for this surface

1. **The profile surface composes `components-legacy/SalonCard.tsx`.** That is what
   `FavoritesList.tsx` already does, and per FLOORS LAW 9 (screens are composed, not drawn) a page
   or feature file may not hand-build a salon card next to it. Nothing here proposes a new
   component.
2. **If a genuine density difference is ever justified, it is a VARIANT of that same component,
   not a second implementation.** The mechanism already exists and is already named:
   `SalonCardProps.variant?: "default" | "compact"` (`components-legacy/SalonCard.tsx:33`), with
   the compact arm at lines 109 to 144. A new density need extends that union. It does not fork.
3. **`variant="compact"` is not free to reuse as-is.** Its own source comment (lines 117 to 121)
   scopes it to "dashboard settings preview only, not a customer-facing surface" and keeps a
   solid-colour cover that the 2026-07-26 FLOORS LAW 2 pass deliberately did not touch. Putting it
   on a customer surface is a widening decision with an owner-approval cost, not a free pick.
4. **The bespoke `CollageTile` stays dead.** REMOVED.md 115 and 116.

## Interaction
Not applicable. This file defines no control.

## Intentional deviations
None claimed. The 22 versus 16 split is drift, not a deviation anybody chose for this surface.

## Empty state
`/profile/favorites` owns the zero state for saved salons. The hub's Gespeichert row states the
count and never renders a card, so it has no card empty state of its own (see `05-personal-group.md`).

## Against the floors
- **FLOORS LAW 8: FAIL, one radius apart.** Same entity, two components, `rounded-[22px]` versus
  `rounded-[16px]`. The severity dropped on 2026-08-02 and the defect did not close.
- **FLOORS LAW 9: PASS on this surface.** `FavoritesList.tsx` composes the registered card rather
  than hand-drawing one, and the hub hand-draws no card at all.
- **Benchmark ladder:** not applicable. The ladder grades one screen's type and elevation; this
  file grades a relationship between screens, which is the axis the ladder does not carry.
- One citation in the neighbouring source does not resolve: `search/SalonResultCard.tsx:346,414`
  attributes its own 22px-to-16px move to "TASTE_LOG.md:187 2026-07-15", and neither the string
  "Kill 18+22" nor that decision is at that line in `_design-system/TASTE_LOG.md` today. The move
  itself is real and visible in the file. Only the pointer is stale. Recorded, not changed.

## Provenance
- CLAUDE.md FLOORS LAW 8 (2026-07-29), the same-thing-looks-the-same rule and the measured pair that produced it
- CLAUDE.md FLOORS LAW 9 (2026-07-29), screens are composed, not drawn
- Owner 2026-08-02, "konto hub better", the rebuild that deleted the collage
- `_design-system/REMOVED.md` 115, 116, the graveyard record
