# ProfileTabs

<!-- exists-check: net-new doc vs the components/*.md corpus (none named ProfileTabs). Closest
matches surfaced (lib/active-salon.ts, hooks/useSalonProfile.ts, SalonOpeningTimes.tsx, etc.)
are unrelated salon-detail/hours utilities, not a profile-hub tab component. This doc covers
the new app/[locale]/_components/profile/ProfileTabs.tsx, see its own exists-check comment. -->

**File:** [app/[locale]/_components/profile/ProfileTabs.tsx](../../app/[locale]/_components/profile/ProfileTabs.tsx)
**Layer:** 1 (chrome: tab bar, search field, tile grid) hosting Layer-3 children it renders (the success-green "Bestätigt" status pill on the hero, `EmptyStateDiscovery`'s hint icon).
**Locked since:** new, 2026-07-21, owner-approved D1 Pinterest-profile mockup (`public/_mockups/sweep-profile-pinterest/index.html`, D1 pane).
**Registry row:** [COMPONENT_REGISTRY.md](../COMPONENT_REGISTRY.md) (Primitives section).

---

## Purpose

The client half of the `/profile` content hub rebuild. `app/[locale]/profile/page.tsx` stays a server component: auth guard plus ALL data fetching (next-booking hero, past-booking tiles, saved-salon tiles, the empty-state rail salons), passed down as plain props. `ProfileTabs` owns everything interactive: which tab is active, the search query, the filtered tile list, and which empty-state pattern to show. No client-side fetch happens anywhere in this component, the page render is fully hydrated on first paint.

The old profile hub (row-list of management links: Haarprofil, Formulare, Einstellungen, Hilfe, Benachrichtigungen, Treue, Stempel, Einladen, sign-out) is gone from this route. Those rows now live at `/profile/settings`. `/profile` is content-only.

---

## Public API

```ts
export interface ProfileTabsProps {
  locale: string;
  avatarUrl: string | null;
  displayName: string;
  hero: ProfileHeroData | null;           // the single upcoming confirmed booking, or null
  pastBookings: ProfilePastBookingTile[]; // Termine tab source data
  savedSalons: ProfileSavedSalonTile[];   // Gespeichert tab source data
  emptyRailSalons: EmptyRailSalon[];      // real top-rated salons, feeds the Looks tab's EmptyStateDiscovery rail
}

export interface ProfileHeroData {
  dow: string; day: string; mon: string; time: string;
  salonName: string; serviceName: string; durationMinutes: number | null;
  address: string | null; price: number | null;
}

export interface ProfilePastBookingTile {
  id: string; salonName: string; salonPhoto: string | null;
  serviceName: string; dateLabel: string; // pre-formatted "TT.MM.", no times on cards
}

export interface ProfileSavedSalonTile {
  slug: string; name: string; photo: string | null;
}
```

All translated strings (tab labels, search placeholder, empty-state copy, the hero's "Nächster Termin" / "Bestätigt" / "Gesamtpreis" labels) are resolved inside this component via `useTranslations("profileHub")` and `useTranslations("bookingCard")`, not baked server-side. The server only sends raw data (numbers, dates, names).

---

## Anatomy (top to bottom)

1. **Tab bar**: 40px round `Avatar` (identity display, not a link) on the left, three centered tabs (Gespeichert / Termine / Looks, 22px gap, 15px text, active = 600 weight ink with a 3px ink underline, inactive = 400 weight `s-ink-2`), then a bell (links to `/{locale}/notifications`) and a gear (links to `/{locale}/profile/settings`), both 44px touch targets.
2. **Search field**: 46px tall, `rounded-card` (16px) rectangle, `border-s-border`, a Lucide `Search` icon plus a text input. Real client-side filter, case-insensitive substring match against `salonName` (both tabs) and `serviceName` (Termine only). No fabricated/decorative search, if the filter ever can't be wired cleanly the field should be omitted entirely rather than shipped inert.
3. **Live next-booking hero**: only rendered when `hero` is non-null. This is the page's pre-existing next-appointment card (date chip, salon name, service, address, time, status pill, price, "Details" link), unchanged in content and structure from the previous hub, just re-hosted here above the tile grid.
4. **2-col tile grid**: `grid-cols-2`, `gap-x-3 gap-y-4`. Each tile is a `SalonPhotoTile` (4/3 photo, `rounded-card`, `Scissors` icon fallback when no photo) plus 1 to 3 text lines below it (name, then tab-specific meta).

---

## States

| State | What renders |
|---|---|
| Termine, has items | 2-col grid: photo, salon name (14px/600), service name (12px, `s-ink-2`), date "TT.MM." (12px, `s-ink-3`). |
| Termine, genuinely empty | `EmptyState` (compact, `components-legacy/ui/EmptyState.tsx`): `Scissors` icon, "Noch keine Termine" title, a one-line lead. |
| Termine, search filtered to zero | Same `EmptyState` component, `Search` icon, "Keine Ergebnisse" copy, distinct from the genuinely-empty case even though the visual shell is shared. |
| Gespeichert, has items | 2-col grid: photo, salon name. Each tile links to `/{locale}/salon/{slug}`. No price/rating shown (this is a lightweight preview, the full favorites management UI stays at `/profile/favorites`). |
| Gespeichert, genuinely empty | `EmptyState`, `Scissors` icon, "Noch nichts gespeichert". |
| Gespeichert, search filtered to zero | `EmptyState`, `Search` icon, "Keine Ergebnisse". |
| Looks | Always `EmptyStateDiscovery` (full pattern: banner, hint row, real salon rail), mirroring `/profile/looks/page.tsx`'s own always-empty state 1:1, localized into all 4 locales (the source page hardcodes German only). The `looks` table and any ingestion flow do not exist yet, confirmed via `npm run exists` before this build. |
| Loading | None. All data is server-fetched by `page.tsx` before first paint, there is no client-side fetch and therefore no skeleton state in this component. |

---

## Do / Don't

### Do
- Keep all three tabs' tile shape uniform (4/3 photo, `rounded-card`, name below), it is the one visual language across the grid regardless of which tab is active.
- Route new tab-bar-shaped UI through this component. It is the one tabbed content hub on `/profile`.
- Reuse `EmptyStateDiscovery` for any future tab that is genuinely, permanently empty (mirrors the Looks tab's reasoning): a rich discovery pane earns its footprint there specifically because there is nothing else to show yet.

### Don't
- Don't reintroduce the old management row list (Haarprofil, Formulare, Treue, Stempel, Einladen, Hilfe, Einstellungen, sign-out) on this page, those live at `/profile/settings` now.
- Don't bake translated strings into the server-side props, `ProfileTabs` owns translation via `useTranslations`, keep the server side to raw data.
- Don't add a fourth tab without checking `TASTE_LOG.md` and the approved mockup first, the D1 pane locks the Gespeichert / Termine / Looks set.
- Don't use the homepage `SalonCard` for the tile grid, it was evaluated and rejected here (fixed horizontal-scroller width classes fight a CSS grid cell, and it requires `category`/`rating`/`variant` data the tile doesn't have), use the simple `SalonPhotoTile` pattern already in this file instead.

---

## Related

- **EmptyStateDiscovery** ([EmptyStateDiscovery.md](EmptyStateDiscovery.md)): the Looks tab's empty state, and the pattern any future permanently-empty tab should reuse.
- **EmptyState** (`components-legacy/ui/EmptyState.tsx`, undocumented primitive): the compact empty/no-results pattern used for Termine and Gespeichert.
- **Avatar** ([Avatar.md](Avatar.md)): the 40px tab-bar identity avatar.
- **/profile/settings**: where the old management rows moved to.
