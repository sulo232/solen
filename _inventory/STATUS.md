# Solen Surface STATUS — the semantic layer

**What this is.** `SURFACE.md` (auto-generated) tells you what *exists*. This file — hand-kept and deliberately SHORT — tells you what a filesystem scan can't know: what's **partial**, what's **deprecated / don't-reuse**, and where the real entry point is. Read this when `npm run exists <keyword>` returns a hit.

**How to keep it alive.** Append a line when you ship a feature, deprecate something, or discover a "don't reuse X, use Y" trap. Do NOT mirror the whole codebase here — that's `SURFACE.md`'s job, and a copy would just rot. Only write down the non-obvious.

**Status vocab:** `complete` · `partial` · `planned` (not built) · `deprecated` (exists but don't use) · `trap` (looks reusable, isn't).

---

## Walk-in (QR queue + tips)

| Piece | Status | Note |
|---|---|---|
| Walk-in **backend** (queue join, atomic ticket counter, cancel+advance, mode gates, pay-first Connect hold, tips, adaptive ETA) | **complete** | Phases 0-6. Files: `lib/walkin/*`, `lib/barber/walkin-ticket.ts`, `app/api/walkin/*`. Live-tested join/cancel/counter. Payment paths need a Stripe-session e2e. |
| `app/[locale]/walk-in-join/page.tsx` (screen 1) | **complete** | Service pick → pay screen. NOT yet localized (English strings). No barber-pick / no free counter-pay path in the UI yet. |
| `app/[locale]/queue/[token]/page.tsx` (screen 2, live ticket) | **complete** | Localized de/en/fr/it, live polling, 4 states (waiting / in_chair / completed / cancelled+no_show). |
| **Booking tip page** | **EXISTS — reuse this** | `app/[locale]/tip/[bookingId]/page.tsx` (committed, localized de/en/fr/it, presets CHF 5/10/15 + custom). Uses a `Heart` lucide icon — user wants it swapped to Münzen-Hand (HandCoins). _(The inventory tool found this after a manual `find` missed it — exactly the bug it exists to prevent.)_ |
| **Walk-in tip UI** | **planned — adapt, don't rebuild** | Adapt the existing booking-tip page for a walk-in queue **token** (not `bookingId`). Entry point = the `completed` ("Fertig") state of `queue/[token]/page.tsx` (you tip after the cut). Mockup: `public/solen-walkin-customer-journey.html`. |
| `app/[locale]/walk-in-pay/page.tsx` | **partial** | Real Stripe Elements not wired yet (task #7). |
| `WalkInModal`, `WalkinAnalytics`, `WalkinHourlyChart`, `LiveQueuePanel` (dashboard) | **complete** | Operator/staff side. |

## Payments / refunds / VAT

| Piece | Status | Note |
|---|---|---|
| `tips` table + `/api/tips` (booking) + `/api/walkin/tip` (guest) | **complete** | 100% to salon via Stripe `transfer_data`, NO `application_fee`. Webhook marks `status='paid'`. |
| VAT/MWST (per-salon, 8.1% inclusive) | **complete** | `lib/vat.ts` `computeVat`. Receipt + emails VAT-aware. Salon toggle in dashboard settings. |
| Admin commission editor | **complete** | `app/[locale]/dashboard/commission-admin/page.tsx`. Edits `platform_settings`. |
| Commission-VAT (Solen's tax on its OWN fee) | **planned — deferred** | Deferred until commission revenue > CHF 100k (pre-launch, no liability). See memory `project_commission_vat_deferred`. |

## Deprecated / traps

| Piece | Status | Note |
|---|---|---|
| Legacy admin disputes page + API | **deprecated — removed** | Canonical customer report = `/report`. Keep `BookingDisputePanel`. |
| `price_disputes` guard in cron/auto-complete | **deprecated — removed** | Don't re-add. |
| `test_table` (DB) | **trap** | Junk table, RLS OFF, 0 rows. Drop candidate — don't build on it. |

## Known DB caveats

- **16 tables have RLS OFF** (see `_db-snapshot.json` `rlsDisabled`) — mostly `discovery_*` + `test_table` + `customer_segments`. Anon key can read/write them. Security review needed before launch; do NOT blindly enable RLS (no policies = total lockout).
- Live DB ≠ migration files (schema drift). Trust `_db-snapshot.json` for the backend, not `supabase/migrations/`.
