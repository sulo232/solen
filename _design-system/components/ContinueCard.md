<!-- exists-check: `npm run exists "continue card"` ran this turn, the one hit is a graveyard
entry for a DELETED second mockup page (continue-states.html, folded into search-a.html's own
CONT_STATES dot-picker, 2026-07-31), not a real component. `npm run exists "live activity"` and
"upcoming booking" also ran (0 real component hits; "live activity" only matched an unrelated
dashboard rail removed 2026-07-15). Genuinely new. -->

# ContinueCard

**File:** [app/[locale]/_components/homepage/ContinueCard.tsx](../../app/[locale]/_components/homepage/ContinueCard.tsx)
**Layer:** 1 chrome (hairline + the shared `--lift` shadow the search pill / filter pills already carry,
`shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]`, no new tokens)
**New:** 2026-08-01, I7 (`_plans/HOME_V3_CATEGORY_MAP.md`), source of truth
`public/_mockups/home-v3/search-a.html`'s `continuationCard()` / `CONT_STATES`.

---

## Purpose

The home feed's first element: a single card that resumes whatever the visitor was doing, ONE real
state at a time. The mockup previews **six** states behind a dot-picker (search continuation, booking
confirmed, walk-in queue position, payment pending, cancelled, review prompt) purely to show the
anatomy once. Production shows exactly one, chosen by priority from real data, never the dot-picker,
never a fabricated state.

---

## States built vs. not built (read this before touching priority order)

| # | Mockup state | Built? | Why |
|---|---|---|---|
| 1 | Booking confirmed | **Yes** (highest priority) | `GET /api/bookings/user?tab=upcoming` already exists and already answers "does this user have a next booking" (`bookings.status = "confirmed" AND starts_at >= now`, the same query `/profile`'s Termine list reads). No new backend. |
| 2 | Search continuation | **Yes** (fallback) | `useRecentSearches()` (`homepage/useRecentSearches.ts`) already persists the last 5 searches to `localStorage`, written by `SearchOverlay.tsx` on every real submit. No new backend. |
| 3 | Walk-in queue position | **No** | No customer-facing "my active ticket" query exists. `GET /api/walkin/queue-stats` is salon-level only (takes `salon_id`, not a user). `GET /api/walkin/queue/status` is keyed by a tracking **token**, and that token is never persisted anywhere the home page can read it back from (not localStorage, not the user's session). The mockup's own research comment reached the same conclusion independently: "No backend: a live queue position ...". Building this needs a new customer-scoped query against `barber_walkin_queue.customer_id`, real backend work, not a compose. |
| 4 | Payment pending | **No** | The mockup's "held for 10 minutes" implies a hold-expiry timestamp; nothing in `barber_walkin_queue` or `bookings` tracks one. Mockup's own comment: "No backend: ... a ten-minute hold countdown." `BookingStatus` (`lib/types.ts`) has no "payment pending" value either (`pending` / `pending_approval` / `confirmed` / `cancelled` / `completed` / `no_show`). |
| 5 | Cancelled | **No** | `bookings.status = "cancelled"` and `bookings.cancelled_at` both exist (confirmed via `app/api/bookings/[id]/cancel/route.ts`), so the STATUS is real. Two things stop it: (a) no column records who cancelled, so the mockup's "cancelled by the salon" copy can't be shown truthfully (only a neutral "Storniert" could be, no attribution); (b) there is no product-defined recency window anywhere in this codebase for "how long does a cancellation stay worth resurfacing", inventing one (e.g. "3 days") would itself be an unsourced business rule, not a data lookup. Buildable once an owner picks a window; not built this turn. |
| 6 | Review prompt | **No** | `bookings.review_prompt_sent` exists and is real (set by `app/api/cron/review-prompt/route.ts`), and `reviews.booking_id` exists, so "completed + prompted + not yet reviewed" is theoretically queryable, but no existing endpoint does that anti-join today. Building it is new backend query logic, not a compose of something already shipped. |

---

## Priority order (implemented)

1. Upcoming confirmed booking (state 1 above).
2. Most recent persisted search (state 2 above).
3. Nothing: the component returns `null` (no card renders at all), the same self-hide contract
   `WalkInBand` / `RecentlyViewedTiles` / `PopularLooks` already use elsewhere on this page.

The auth-gated booking fetch resolves before ANY state renders (an explicit `undefined` loading
state), so a logged-in visitor never flashes the search-continuation fallback and then swaps to their
booking a beat later.

---

## Anatomy (copied from the mockup's `.sa-cont`/`.sa-conttext`/`.sa-conttitle`/`.sa-contmeta`/
`.sa-contimg`/`.sa-conteyebrow`, byte-for-byte)

- Card: flex row, `gap-3.5` (14px), `p-3` (12px), `rounded-[18px]`, `border-s-border` hairline, white
  fill, `shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]` (the same `--lift` the mockup's search pill / filter
  pills share).
- Text block (flexes to fill): optional eyebrow (12px/600, a 7px dot + label, green for "Bestätigt"),
  title (14px/500, 2-line clamp), meta (12px, `s-ink-2`, 1-line truncate).
- Trailing visual: 88×88 photo at `rounded-[14px]`, `object-cover`. No real photo (the
  search-continuation state has no salon to show) falls back to a sunken tile holding a Lucide
  `Search` icon, never a bare grey box, never an invented photo.
- No chevron: the mockup defines a `.sa-contchev` CSS rule but never appends one in
  `continuationCard()`'s actual DOM, so none is built here either (matching what the mockup renders,
  not its unused leftover CSS).
- No state-picker dots: `CONT_STATES`'s dot row is a MOCKUP preview device for showing all six
  variations on one page. It is not part of the anatomy of the real card and is not built.

---

## Copy (no new i18n strings, hard constraint)

- Eyebrow "Bestätigt"/"Confirmed"/"Confirmé"/"Confermato": `bookingCard.status.confirmed`, the same
  key `ProfileTabs.tsx` already uses for its own booking-status chips.
- Search-continuation meta "Zuletzt"/"Recent"/"Récents"/"Recenti": `ui.searchOverlay.recentLabel`, the
  same key `SearchOverlay.tsx` already renders above its own recent-search list.
- Search-continuation title: the recent search's own stored value (`recentLabel(r)` from
  `useRecentSearches.ts`, the literal query/service/city text the user searched), real data, not
  copy.
- Booking title: the real salon name. Booking meta: the real service name + an `Intl.DateTimeFormat`
  date/time string (locale-driven formatting, not a hand-typed date string).

---

## Public API

```ts
export default function ContinueCard(): JSX.Element | null;
```

No props. Reads `useLocale()` / `useRecentSearches()` internally and fetches its own booking data,
the same self-contained pattern `WalkInBand.tsx` already uses.

---

## Use for / Don't reuse for

**Use:** the homepage feed, as the very first child (before `MobileCategoriesRow`), matches the
mockup's `renderHome()`, where `continuationCard()` is appended before `recentlyViewed()` and every
rail.

**Don't reuse for:**
- Any surface where a state can't be proven with a real, already-shipped query. This component's
  entire contract is "never fabricate a state."
- `/profile` (a separate, already-existing `GET /api/profile/live-state` endpoint serves a similarly
  shaped priority card there: `upcoming` / `loyalty` / `deal` / `reply` / `rebook` / `empty`, not
  reused here because its priority list and copy are profile-specific, not home-specific).

---

## Related

- `homepage/WalkInBand.tsx`: the self-fetch + self-hide pattern this component copies.
- `homepage/useRecentSearches.ts`: the localStorage hook, unmodified, reused directly.
- `search/SearchOverlay.tsx`: writes the recent-search entries this card reads, and owns the
  identical `q`/`service`/`city` "resume a search" URL contract this card's search-continuation link
  reuses (`handleRecentClick`).
- `app/api/bookings/user/route.ts`: the booking query this card reads (`tab=upcoming`), unmodified.
- `app/api/profile/live-state/route.ts`: a same-shaped priority resolver for a different screen
  (`/profile`), not shared code, named here only so the two are never confused for one system.
