# Session Audit + Fix Plan — Mobile Dashboard Build (2026-06-03)

Adversarial multi-agent audit (9 auditor slices + per-finding verify pass; 30 agents).
**66 findings: 4 critical · 12 high · 24 medium · 26 low.** All 21 critical/high independently re-verified against the live code + DB.

> The dominant root cause is **schema drift** (migrations on disk, never applied to the live DB). Most criticals are PRE-EXISTING and the session's own UI work sat on top of them. A handful are session-introduced. This doc separates the two and proposes a phased plan whose keystone is the migration rebaseline — NOT more ad-hoc ALTERs.

---

## CRITICAL (4)

1. **ProfileTab save 400s entirely** — the form always sends `is_top_pick` + `facebook_url`; both are API-whitelisted but the columns don't exist live → PostgREST rejects the WHOLE update (PGRST204) → salon name / categories / description / hours / socials all silently fail to persist, while the UI shows "Gespeichert ✓". *(settings · pre-existing drift + silent-success masking)*
2. **`toISOString()` on local-midnight dates → off-by-one day** for slot create/bulk in any UTC+ tz (CH is UTC+1/+2). Slots land on the wrong day. *(calendar/slots · pre-existing)*
3. **Creating a service 500s** (`buffer_minutes` column missing) and the modal reports success. *(services · pre-existing drift)*
4. **DISPUTED — Settings GET /api/salons/{UUID} 404** (handler matches slug only). ⚠️ My live screenshots showed settings loading fully (Profil/Verifizierung/Zahlungen rendered), which contradicts a hard 404 — the route likely accepts id-or-slug. **Verify before acting; do not trust the agent over direct evidence.** *(settings · needs reconciliation)*

## HIGH (12)

- **Seed data was written onto a PUBLIC, marketplace-listed salon** ("Cuts & Culture") via raw SQL — it's live production data (fake bookings/queue visible to customers), no seed file to reproduce/revert. *(SESSION-INTRODUCED)*
- **PaymentsTab (Wave E headline) is a no-op** — the 4 saved keys are stripped by the API whitelist and the columns don't exist; the option-card UI I verified visually doesn't persist. *(settings · drift)*
- **VacationTab + SmsRemindersTab saves 400** (vacation_start/end, sms_reminder_* columns missing). *(settings · drift)*
- **Client-detail "Termine" tab shows EVERY client's bookings**, not the selected client's. *(clients · pre-existing)*
- **Peak-hours heatmap renders empty** — API returns an array, component expects a nested Record. *(analytics · I flagged this; confirmed)*
- **Services page still has 21 `s-coral` refs; modal selected-pills render solid BLACK** — incomplete reskin, breaks the approved ink/light-blue skin. *(SESSION — Wave A/B gap)*
- **Mobile horizontal overflow hides booking price + status pill off-screen** (+ the barber-ops queue card action buttons). *(SESSION — Wave A/D)*
- **Mobile agenda + detail show slot times in viewer-local tz** (09:00 → 11:00). *(SESSION — Wave C)*
- **Optimistic status flip applied even when the PATCH/cancel fails** (no res.ok check, no rollback, no error shown). *(bookings · pre-existing pattern, in session-touched file)*
- **SchedulingTab still grids (not option-cards) AND its save no-ops.** *(SESSION — Wave E unfinished + drift)*
- **Calendar Team-tab / BarberLeaderboard** issues (isBarbershop reads wrong profile key → leaderboard never renders). *(pre-existing)*
- **Linked-staff users get an empty dashboard** — every page keys off owner `salon_id`, ignores `staff_salon_id`. *(pre-existing)*

## MEDIUM (24) / LOW (26) — grouped

- **Schema drift (more):** `client_notes` table missing (Notizen tab 500s), `profiles.tos_*` missing (onboarding TOS submit breaks), `client_tags` POST/DELETE still 500 (only GET was degraded), commission_rate type divergence (live numeric vs migration integer), acquisition_source/sort_order migration-history mismatch.
- **Units (rappen vs CHF):** analytics Umsatz CSV ÷100 (exports zeros), ForecastWidget ÷100, the seed `paid_amount` rappen vs `price_paid` CHF inconsistency, upcharge cap gross-vs-net + floor-vs-round.
- **i18n:** `chat.clientTags.allergyPresets.*` missing in all 4 locales (= the Next "1 issue" overlay, 8× IntlError/load), `customTagPlaceholder` vs `customPlaceholder` mismatch, `formatCurrency` shows "45 CHF" not Swiss "CHF 45" (useLocale 'de' overrides de-CH).
- **TZ:** default agenda day + Monat "today" can land wrong after local midnight.
- **Silent failure:** every settings tab shows "Gespeichert ✓" without res.ok; empty catch on service-photo upload; client-tags GET degrades ALL errors to empty 200 (masks transient failures).
- **Perf:** 1.9MB @hello-pangea/dnd statically imported + wraps mobile (slow first paint); Monat fans out ~6 week fetches; realtime channel resubscribes on every nav.
- **Dead/dup:** AV_GRADS/avGrad/initials duplicated in 5 files; HOURS const dead + wrong comment; 2 permanently-dead analytics blocks (percentile_rank, last_minute_performance never returned).
- **dev-login (dev-only):** unvalidated `to` open redirect; `?email=` impersonates any existing user. Both prod-gated (NODE_ENV 404).
- **Design polish:** Cancellation/Vat tabs still s-coral; upcharge "sent" muted #B45309 vs vivid #EA580C; deposit-example copy formats % as "CHF 20.00".
- **chrome:** 3 divergent dashboard-detect regexes; CookieConsent comment claims GDPR-safety but PostHog capture was never consent-gated (pre-existing).

---

## FIX PLAN (phased, by leverage)

### P0 — Schema-drift rebaseline (KEYSTONE; resolves ~10 crit/high/med at once)
Per existing `_tasks/MIGRATION_REBASELINE_PLAN.md` + `SCHEMA_DRIFT_AUDIT.md` — do the PROPER fix, not more ALTERs:
1. `supabase db pull` a baseline capturing current live schema.
2. `migration repair` to reconcile `schema_migrations` history (the 068/083/055/megabuild block + my session ALTERs are files-vs-history mismatched).
3. Apply the genuinely-missing columns/tables: `is_top_pick`, `facebook_url`, `vacation_start/end`, `sms_reminder_24h/1h`, `buffer_minutes` (+ processing/finishing), payment-mode columns, `client_notes`, `client_tags`, `salon_analytics`, `profiles.tos_*`.
4. **Fold in / reverse my session ad-hoc patches** (sort_order naming, acquisition_source, commission_rate) so file↔history↔DB agree.
5. Verify: re-run the save/create paths that 400/500 today.
→ Fixes criticals 1 + 3, the Payments/Vacation/Sms no-op saves, client_notes/client_tags/tos, commission/acquisition/sort_order drift.

### P1 — Honest errors (no silent data loss)
- Every settings tab `handleSave`: check `res.ok` → `toast.error` on failure; only show "Gespeichert ✓" on real success.
- Booking status mutations + cancel: check `res.ok`, roll back optimistic state on failure, surface error.
- Replace empty catches (service-photo upload, DELETE handlers) with `console.error("[X] ...", err)` + toast per project rule.
- client-tags GET: only degrade on the table-missing error, not ALL errors.

### P2 — Seed-data isolation (undo the public-salon contamination)
- Remove/neutralize the seeded bookings/slots/queue from "Cuts & Culture" (public, listed).
- Re-seed into a `[TEST]`-prefixed, `listed_on_marketplace=false` salon via a committed, reproducible seed (route or migration). Fix `paid_amount`/`payment_status` consistency so the refund path isn't exercised against phantom PaymentIntents.

### P3 — Finish the session's design gaps
- CancellationTab + SchedulingTab → option-cards (+ fix SchedulingTab save once P0 lands the columns).
- Services: purge 21 `s-coral` refs; modal selected-pills → ink/light-blue (not solid black).
- Mobile horizontal overflow: constrain booking row + queue card width so price/status/actions stay on-screen.
- Heatmap: accept the array shape `[{day,hour,count}]`.
- Clients-detail "Termine": filter to the selected client.
- OffPeak heatmap: mobile stacked-day view.

### P4 — Units · TZ · i18n correctness
- Audit each money column's unit (CHF vs rappen); fix CSV exports (÷100), ForecastWidget, upcharge cap (net-of-refunds, Math.round).
- Fix `toISOString` local-midnight → use a tz-safe date key (slots + agenda "today").
- Add `allergyPresets.*` + fix `customTagPlaceholder` in all 4 locales (kills the dev "1 issue" overlay); set formatCurrency locale to de-CH.

### P5 — Hardening / polish (low)
- dev-login: same-origin `to` guard + seed-email allowlist.
- Extract one `isDashboardPath()` helper (kill the 3 regex copies).
- Dedup AV_GRADS/avGrad/initials into a shared util; delete dead HOURS const; remove dead analytics blocks.
- Lazy-load @hello-pangea/dnd (skip on mobile); fix realtime resubscribe deps.
- Correct the CookieConsent comment (and, separately, actually consent-gate PostHog — pre-existing).

---

## SELF-CRITIQUE (where I cut corners)
- **Ad-hoc `ALTER ADD COLUMN`** to unblock features (sort_order, acquisition_source, commission_rate) instead of the rebaseline — the literal "easy way that's unstable" (diverges from migration history; a `db reset` could drop or recreate them wrong). → P0 reverses this.
- **Seeded a PUBLIC salon** rather than an isolated test fixture — fast, but it's live data on a listed salon with no revert. → P2.
- **Verified UI by render, not by SAVE** — PaymentsTab/Vacation/Sms "looked right" but their saves are no-ops; I screenshotted appearance and didn't exercise persistence. → caught here; P1 makes failures visible going forward.
- **Two Wave-E panels left half-done** at the disconnect (Cancellation/Scheduling) — flagged, not hidden. → P3.
- **The DISPUTED "settings 404"** — the council (Principal Eng) PROVED it real: route is slug-only, `/api/salons/{uuid}` 404s → `salon=null` → `handleSave` short-circuits on `if(!salon)return`. My skepticism correctly stopped me applying the wrong fix (columns wouldn't have helped), but the bug is real and **coupled to critical #1**.

---

## COUNCIL REVIEW (2026-06-03) — 5/5 endorse-with-changes

All five lenses endorsed the spine (rebaseline-not-ALTERs keystone, honest self-critique) and each found load-bearing corrections, verified against the live DB:

- **Principal Eng:** #1 and #4 are ONE coupled bug — fix the `/api/salons` route (id-or-slug) FIRST; columns alone won't fix ProfileTab save. HOIST the honest-error (`res.ok`+toast) check before any rebaseline verification (else you verify with instruments that lie "Gespeichert ✓"). The rebaseline command list is stale.
- **DB & Migrations:** BLOCKER — Docker isn't running (`db pull` needs it) → add a Step 0 or use the MCP/pg_dump fallback. BLOCKER — the hardcoded 42-version repair list is stale (live = 72, +30 newer applied) → regenerate LIVE via `migration list --linked`, never paste the cached list. NO `db reset` (14 bookings / 23 listed salons are NOT disposable). Back up first.
- **Security:** gate `issueRefund` on `payment_status` (the seed rows are PI-null so already safe; the real risk is the inverse, reachable via create-then-charge). The seed-removal SQL targets the WRONG salon (point it at `5784b1ab`, FK-ordered). PostHog fires before consent → DACH launch-blocker, not P5. Assert payment columns survive the rebaseline.
- **Product/Launch:** the plan is ordered by ENGINEERING LEVERAGE, not LAUNCH IMPACT — it gates a 5-min ProfileTab fix behind the multi-hour rebaseline. Re-order around the owner-usability spine (create service → set hours → take booking → get paid) with one end-to-end acceptance gate, and a per-phase SAVE-PATH verification protocol.
- **Design-System:** don't blanket-replace `s-coral`→`s-ink` (that re-creates black pills) — selected multi-select pills = LIGHT-BLUE, primary CTA = INK (per CONTROL_ELEVATION + LOCKFILE). MEASURE the overflow before fixing — the bookings row already uses `flex-1 min-w-0 truncate`+`shrink-0` (likely fine); the real culprit is barber-ops queue cards (+ ClientTags width). P3 should be a parity close-out vs the mockup, not just delta-fixing.

## REVISED PLAN v2 (post-council — re-ordered by launch impact)

**P0 — Make the owner dashboard actually save (minutes–1h, NO rebaseline):**
1. Fix `/api/salons/[slug]` GET+PATCH to accept id-or-slug (or point settings at `/api/salons/mine`) — the real fix for ProfileTab (#1+#4).
2. Remove the phantom keys (`is_top_pick`, `facebook_url`) from the form payload/whitelist so saves stop 400ing pre-rebaseline.
3. Hoist honest errors: every save/mutation checks `res.ok` → real toast; kill fake "Gespeichert ✓".
→ Owners can configure their salon again. Verifies trustworthy.

**P1 — Money + data integrity:** gate `issueRefund` on payment_status; seed-removal scoped to `5784b1ab` (FK-ordered) + re-seed a `[TEST]` unlisted salon; consent-gate PostHog (launch-blocker).

**P2 — Schema rebaseline (proper keystone, DERISKED, no longer blocking P0):** Step 0 start Docker (or MCP/pg_dump fallback) + back up; regenerate the divergence list LIVE; db pull baseline → repair (all pre-baseline reverted, baseline applied) → apply genuinely-missing cols/tables → fold in session ALTERs; assert payment columns survive; refresh the stale rebaseline doc.

**P3 — Mobile parity close-out:** Cancellation/Scheduling option-cards; services skin (selected pills LIGHT-BLUE, CTA INK — not black); overflow (MEASURE first, fix barber-ops queue card); heatmap array; clients-detail filter; offpeak mobile; full parity sweep vs mockup.

**P4 — Units · TZ · i18n:** rappen/CHF (CSV ÷100), toISOString off-by-one, allergy + customTagPlaceholder i18n keys, formatCurrency de-CH.

**P5 — Polish:** dev-login hardening, dedup AV_GRADS, lazy-load dnd, regex consolidation, dead code, CookieConsent comment.

**Cross-cutting:** per-phase SAVE-PATH check (not render) + one end-to-end owner-flow acceptance gate, run after each phase.
