<!-- WORKSTREAMS-INDEX , do NOT overwrite this file with a single plan. Add/update a ROW; put plan detail in _plans/<NAME>.md. The workstreams-index-guard hook BLOCKS any write that drops this marker. -->
# WORKSTREAMS , every in-flight workstream (auto-injected, survives compaction)

> THE durable index of all in-flight work. On a topic-switch the previous workstream STAYS here as `PAUSED` , it is NOT deleted or overwritten. Each row points to its own detail file in `_plans/`. Keep the statuses current; never replace this index with one plan.

| # | workstream | status | detail | open / next |
|---|---|---|---|---|
| 1 | Homepage design pass | **ACTIVE** | [HOMEPAGE.md](HOMEPAGE.md) | item 7 Walk-in (not started); parked: ab-CHF i18n decision, fake-times no-fab fix |
| 2 | Bug-hunt (customer/onboarding/admin) | **PAUSED** (since 2026-06-29, for #1) | [BUG_HUNT.md](BUG_HUNT.md) | onboarding + admin not started; PDP/booking FIX-clear + FIX-careful queued; i18n batch; reviews dedup |
| 3 | System-Upgrade (hooks/meta) | **DONE** | [SYSTEM_UPGRADE_PLAN.md](SYSTEM_UPGRADE_PLAN.md) | deferred polish: armed-flag TTL/cleanup, silent-stop detector, mockup-gate web arm, memory merge, skill retarget, log archive |
| 4 | Search redesign (Airbnb-style) | **DONE** (owner asks) | [SEARCH_MORPH.md](SEARCH_MORPH.md) | all asks addressed 2026-07-01: map-view search, neutral filters (no blue/ring), map pin + count smoothing, "Schweizweit" -> default city (31f4de09a). Only future enhancement parked: geolocation city detection (needs per-city inventory check) |
| 5 | Map + Search refinement | **ACTIVE** | [MAP_SEARCH_REFINE.md](MAP_SEARCH_REFINE.md) | BATCH 22 (2026-07-03): A3 homepage card aspect-[3/2] match (real code), A4 spec-chip shrink (mockup), A2 category-flow Model B polish + non-black Search button (mockup). Prior: owner 2026-07-01 8-item batch all addressed. |
| 6 | Fable methodology skills (meta) | **DONE** (2026-07-03, 4 rounds) | [FABLE_SKILLS.md](FABLE_SKILLS.md) | 4 skills + rule 14 + trigger hook v2 + skill autopilot (safe skills auto-fire, risk table in detail file); all 10 setup recs applied; loop-reviewer PASS rounds 1-4 |
| 7 | Admin Cities toggle | **ACTIVE** | [SEARCH_MAP_OVERHAUL.md](SEARCH_MAP_OVERHAUL.md) | GET/PATCH /api/admin/cities (role=admin gated) + Städte admin page (dashboard/cities-admin) mounted in existing DashboardLayout ADMIN_NAV; toggles `cities.is_active`. KNOWN GAP flagged to owner: `is_active` only gates the B3 geocoder today, NOT the city selector (CityTopBar/DesktopCitySelector/MobileMenu/Header all use hardcoded `CITY_SLUGS=["basel","zuerich","bern"]` in lib/cities.ts) or `/[locale]/[city]` routing (same hardcoded `CitySlug` union + `isValidCitySlug`). Toggling e.g. Luzern/Genève/Lausanne/Neuchâtel on will NOT make them selectable or routable until `lib/cities.ts` is refactored to read the DB table dynamically , that refactor is out of scope for this task (would touch 6+ files) and needs an explicit owner go-ahead. |

## Why this file is an index (2026-06-29)
The old single-`ACTIVE.md` model **clobbered** the bug-hunt plan: it was overwritten by #3 and was never committed, so it was lost from git entirely. Fix: workstreams now live in separate files; this index is the never-lose map; `_plans/` is committed so nothing is working-tree-only again. The `workstreams-index-guard` hook blocks any write to this file that isn't an index (missing the marker above), so a single plan can't clobber it.

## Rule on topic-switch
When the owner switches topics: set the current workstream's status here (ACTIVE -> PAUSED), do NOT abandon or delete it, then start/resume the new one. Resume a paused workstream by re-reading its detail file.
