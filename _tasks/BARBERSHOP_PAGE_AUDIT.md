# Barbershop page audit — what's missing & how to put it all together

**Date:** 2026-05-31
**Trigger:** User noticed (a) barbershop pages have "a lot of missing stuff compared to hair salons", and
(b) the walk-in flow should let you pick an individual staff member / barber like the booking side does.

**STATUS (2026-05-31):** ✅ Phase 0 done (Blade & Stone seeded → Team/Portfolio/Hours/11 services all render).
✅ Phase 1 done (barber picker in walk-in panel → threads `staff_id` → pay page shows chosen barber). No
migration was needed — see correction below. Remaining: seed the other 3 barbershops (Phase 0 replicate).

---

## TL;DR — it's a DATA gap, not a code gap

The salon page renders the **same components for every category** (V3-D205 universal-components rule —
no `if category === 'barbershop'` branches; verified by grep). The only category logic is a label default
and the breadcrumb. So barbershop pages can't be "missing sections" structurally.

What's actually happening: **barbershops were seeded as stubs.** Every data-gated section
(`SalonTeam`, `SalonPortfolio`, `SalonReviews`, `SalonOpeningTimes`) silently collapses when its data is
empty — and barbershops have empty data. The page looks sparse because the *content* is thin, not the template.

**One fix (seed the barbershops, especially staff) lights up 4 empty sections AND unblocks the barber
picker the user asked for.** They're the same root cause.

---

## Evidence — data richness by category (live DB, 2026-05-31)

| category | salons | avg services | avg staff | avg gallery | % w/ about | % w/ hours | % w/ IG | avg reviews |
|---|---|---|---|---|---|---|---|---|
| coiffeur | 6 | 4.3 | **1.3** | **1.8** | 83% | 50% | 17% | **2.3** |
| **barbershop** | 4 | 3.0 | **0.0** | **0.0** | 100% | **0%** | 0% | **0.0** |
| nails / makeup / waxing | 4 ea | 3.0 | 0.0 | 0.0 | 100% | 0% | 0% | 0.0 |

Concrete — Blade & Stone (the barbershop we're demoing) vs a fully-populated coiffeur:

| | Blade & Stone 🧔 | Atelier Haarwerk 💇 |
|---|---|---|
| Services | 3 | **12** |
| Staff (→ Team section) | **0** | 4 |
| Gallery (→ Portfolio) | **0** | 11 |
| Reviews | **0** | 14 |
| Opening hours | **none** ("unbekannt") | set |
| Instagram | none | linked |

> Note: even most *coiffeurs* are thin — only **Atelier Haarwerk** is fully populated. It's the gold-standard
> reference for "what a complete salon page looks like." Barbershops are simply at zero.

---

## Section-by-section: what's missing on a barbershop page

| Section | Render gate | Barbershop today | Needs |
|---|---|---|---|
| `SalonHeader` / `SalonHero` | always | ✅ shows | — |
| `SalonServices` | always (`!walkinMode`) | 3 services | more + grouped categories (coiffeur has 12) |
| **`SalonTeam`** | `staff.length > 0` | ❌ **hidden** (0 staff) | **seed staff + avatars** — biggest gap |
| `SalonReviews` | always | empty state | a few seeded reviews (demo-only, see caveat) |
| **`SalonPortfolio`** | `gallery_urls.length` | ❌ **hidden** (0 photos) | seed gallery_urls |
| `SalonAbout` | always | ✅ has about_text | — (already populated) |
| `SalonLocation` | always | ✅ | — |
| **`SalonOpeningTimes`** | always | "Öffnungszeiten unbekannt" | seed opening_hours jsonb |
| `SalonAdditionalInfo` | always | thin | — (no amenities column; static/derived) |
| `SalonLoyalty` | always (static) | ✅ same for all | — |

---

## The walk-in ↔ staff-selection picture

What already exists (so we reuse, not reinvent):

1. **`RemoteQueueJoin`** (the *old* walk-in join) already had `preferredBarberId` state + a `<select>`
   dropdown over `staff[]` and sent `preferred_barber_id` to the API. ← this is the "individual staff
   selection in the walking page" the user remembers. Plain dropdown, not the nice avatar picker.
2. **`/walk-in-pay` page** already has a full barber-card slot in its Booking type:
   `barber_id / barber_name / barber_avatar / barber_role / barber_rating / barber_review_count`
   (the demo renders "Marco Bianchi"). It's *built to show* a chosen barber — the tokenless
   `?salon_id=&service_id=` flow just never passes one.
3. **`SalonTeam`** avatar treatment (88×88 rounded-full, ring, star badge, name + role) = the visual
   language a walk-in barber picker should mirror, so book + walk-in feel like one design system.

What's MISSING for staff selection to work end-to-end:

- **Staff data** — barbershops have 0 staff rows. Blocker #1. Nothing to pick.
- ~~**`walk_in_queue.preferred_staff_id`** — needs a migration.~~ **CORRECTION:** the real table is
  `barber_walkin_queue` and it **already has `preferred_barber_id`** (nullable uuid). `createWalkinTicket`
  already persists it. No migration was needed — the earlier "no column" finding queried the wrong table name.
- **Carry-through** — `SalonWalkInPanel` service row → add `&staff_id=` to the `/walk-in-pay` link →
  PI metadata → `createWalkinTicket` writes `preferred_staff_id`. ("Anyone / egal" = no preference =
  current behavior, so it's additive.)

---

## Plan — how to put it all together (recommended order)

### Phase 0 — Seed the barbershops  ← highest leverage, unblocks everything
Populate the 4 barbershops (at least Blade & Stone) to Atelier-Haarwerk richness:
- **Staff** (3–4 barbers) with `name` + `avatar_url` + `is_active` → lights up `SalonTeam` AND enables the picker.
- **gallery_urls** (6–11 shop/work photos) → lights up `SalonPortfolio`.
- **opening_hours** jsonb → fixes "Öffnungszeiten unbekannt".
- **More services** (→ ~8–10, grouped: Cuts / Beard / Combos / Extras) so the menu matches a real barbershop.
- *(optional, see caveat)* a few reviews.

> ⚠️ **Caveat — reviews are demo-fiction.** Seeding staff / gallery / hours / services is operational data
> a real owner would enter. Seeding *reviews* fabricates social proof. Fine for a local design demo;
> flag before shipping anywhere real. Recommend: seed staff+gallery+hours+services now, hold reviews
> unless you want them for the demo.

### Phase 1 — Staff selection in walk-in (reuse what exists)
- Add a compact **barber picker** to `SalonWalkInPanel` (horizontal avatar row, mirrors `SalonTeam`;
  first chip = "Egal / Anyone"). Same visual language as the booking side.
- Pass `&staff_id=` through the `/walk-in-pay` link; the pay page already renders the barber card.
- No migration — `barber_walkin_queue.preferred_barber_id` already exists. The chain: panel link `&staff_id`
  → `pay-intent` validates it's active staff of the salon + stamps PI metadata → `confirm` (+ webhook backstop)
  reads it → `createWalkinTicket` persists to `preferred_barber_id`.
- Dashboard later: per-barber queues (already noted in WALKIN_DASHBOARD_NEEDS.md §"Per-barber capacity").

### Phase 2 — Unify book & walk-in selection UX (closes earlier user feedback)
- Walk-in service cards already match `SalonServices` (done last session).
- Make the walk-in **staff picker** share the `SalonTeam` avatar component so "when you select stuff"
  it's identical between Termin and Walk-in. No second design system.

---

## Decisions needed
1. **Seed scope** — seed all 4 barbershops, or just Blade & Stone for the demo? (Rec: Blade & Stone first, verify, then the rest.)
2. **Reviews** — seed fake reviews for the demo, or leave empty? (Rec: leave empty / hold.)
3. **Picker placement** — barber picker *in the walk-in panel* (pick before paying) or *on the pay page*
   (pick on the pay screen, next to the barber card)? (Rec: in the panel — matches "choose service, then barber, then pay".)
4. **Staff avatars** — real photos (Unsplash-style demo) or initials-only? (Rec: demo photos to match Atelier.)
