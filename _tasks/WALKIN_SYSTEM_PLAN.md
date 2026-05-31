# Walk-in System — Build Plan

The connected barbershop walk-in: search a shop → join the queue remotely + pay on your
phone → pay gates a ticket number → walk out, watch a live count → show the QR on arrival,
skip the wait. Cancellable per the salon's policy.

---

## 0. What already exists (build ON this — do not rebuild)

| Piece | Where | State |
|---|---|---|
| Queue table `barber_walkin_queue` | `073_barber_foundation.sql` | status (waiting/in_chair/completed/no_show/cancelled), `position`, `estimated_wait_minutes`, `tracking_token`, joined/called/started/completed timestamps, `assigned_barber_id`, `join_method`, `converted_to_booking` |
| Wait estimator | `lib/barber/wait-time-calculator.ts` | **STATIC**: `rounds × (avgServiceMinutes + buffer)` — this is the piece to make adaptive |
| Status poll | `GET /api/walkin/queue/status?token=` | public, polls every 30s, returns position + status + ETA + counts ✅ |
| Availability | `GET /api/walkin/availability` | "Frei in ~X Min" per barbershop for search cards (barber-only) ✅ |
| Pay intent | `POST /api/walkin/pay-intent` | Stripe walk-in PaymentIntent, manual-capture hold ✅ |
| Operator board | `LiveQueuePanel`, `queue-display`, `walkin-analytics` | real-time queue board ✅ |
| Cancellation policy cols | `salons.cancellation_policy / _fee_percent / _fee_type / _fee_value / _window_hours` | exist (general booking) — reuse for walk-in |
| Pay screen + ticket UI | `app/[locale]/walk-in-pay/page.tsx` | this session ✅ |

---

## 1. Access (walk-in flow only — no profile entry for now)

- **Entry:** Discover/Search → barbershop cards show **"Frei in ~12 Min"** (via `/availability`) → tap shop → join sheet (service + optional barber) → **Bezahlen** → ticket.
- **Re-entry:** the ticket is reachable by its `tracking_token` URL (saved / SMS / Wallet). The ticket = the after-pay state (or a dedicated `/queue/[token]`).
- Profile / "active bookings" entry: **deferred** per your call. Walk-in flow is the only door.

---

## 2. End-to-end flow

1. Search → barbershop card "Frei in ~12 Min".
2. Shop → join sheet (service + optional barber) → **Bezahlen** (pay gates the number).
3. Pay → on success: queue entry created with `position` + ticket code (A47) + `payment_intent_id`.
4. **Ticket** (built): number, live count, QR, cancel-inside-card.
5. Live: position + ETA update (poll 30s → later realtime) as the queue moves.
6. Arrival: show QR → barber scans → `in_chair` → served (auto-capture the hold).
7. Cancel anytime before called → refund per policy → queue advances for everyone behind.

---

## 3. THE adaptive ETA engine (the "minutes go up/down with pace" ask)

**Goal:** ETA drops when the shop moves faster than expected, rises when slower.

### 3a. The live "pace" (this is the heart of it)
- Keep a per-salon (optionally per-barber) **EWMA of actual service durations**.
- On every completion: `actual = completed_at − started_at`; then
  `pace = α·actual + (1−α)·pace` with **α ≈ 0.35** (recent cuts dominate → the number reacts to today's real speed).
- Seed `pace` with the salon's configured average (or the service `duration_minutes`) until ~5 samples exist.
- Store on a `salon_pace` row (or `barber_pace` keyed by `staff_member_id`): `pace_minutes`, `samples`, `updated_at`.

### 3b. The ETA for your position (multi-chair aware)
- `B` = active barbers (chairs working now).
- For each occupied chair `i`: `remaining_i = max(0, pace − (now − started_at_i))`.
- Simulate: take the chairs' `remaining_i` (free chairs = 0), assign the `peopleAhead`
  waiting customers one-by-one to the soonest-free chair (each adds `pace`); **your ETA =
  the free-time of the chair you'd land on** (the `peopleAhead+1`-th assignment).
- Cheap fallback (upgrades the existing formula): replace the static `avgServiceMinutes`
  with the live `pace` → `ETA ≈ ceil(peopleAhead / B) × pace + minRemainingThisRound`.

### 3c. Why it moves up and down (the behaviour you described)
- **Faster:** a cut finishes early → completion fires → `pace` EWMA nudges down **and** the
  queue advances (`peopleAhead − 1`) **and** the next chair's elapsed resets → recompute → **ETA drops**.
- **Slower:** the in-chair cut overruns → `remaining_i = pace − elapsed` rides to 0 and the
  periodic tick keeps it there; when it finally completes late, `pace` EWMA rises → **ETA rises**.
- **Smooth countdown:** a 30–60s tick recomputes `remaining_i` so the number drifts down
  between events instead of jumping only when someone finishes.

### 3d. Recompute triggers (server)
`completion`, `cancel`, `no_show`, `call/start`, `new join`, and a `periodic tick`. Each
recompute rewrites `position` + `estimated_wait_minutes` for ALL waiting rows of that salon,
then pushes to clients.

### 3e. Delivery to the ticket
- **v1:** client polls `/api/walkin/queue/status?token=` every 30s (already exists) → updates the live count.
- **v2:** Supabase Realtime subscription on the salon's queue rows → instant, no poll lag.

---

## 4. Pay gates the number (fuse pay + queue)
- Today join + pay are separate routes. Fuse: join sheet → `pay-intent` (manual-capture hold)
  → on success **create** the queue entry with `position` + `ticket_code` + `payment_intent_id`.
  No payment → no number.
- **Hold vs charge:** keep the existing **manual-capture hold** (authorize now, capture when
  served). Clean: cancel-before-served = void the hold = no charge, no refund needed.

---

## 5. Cancel + refund + advancement
- `POST /api/walkin/cancel` (token-auth): set `cancelled` → renumber/advance everyone behind →
  recompute ETAs → push. Refund:
  - **Hold not captured:** void the PaymentIntent → free cancel.
  - **Captured:** refund per `salons.cancellation_*` policy (full / partial fee / none in-window).
- Wire the ticket's filled **Stornieren** button → confirm → this endpoint → cancelled state.

## 6. Daily number reset
- `ticket_code = prefix + daily_seq` (e.g. "A" + 47). `daily_seq` = count of the salon's
  entries **today** + 1 (date-scoped query) → resets every day with **no cron needed**.
  (Optional: nightly GitHub-Actions cron to hard-reset a counter.)

## 7. Salon-set cancellation policy
- Reuse/extend `salons.cancellation_*`. Dashboard setting: "Walk-in Stornierung" →
  *free-until-called* / *fee % inside window* / *non-refundable*. The ticket displays it
  (currently hardcoded "Kostenlose Stornierung bis zum Aufruf"); the cancel API enforces it.

## 8. Notifications
- "Du bist als Nächstes dran" when `peopleAhead` ≤ 1; "Du bist dran" on `called`. PWA push if
  installed, else SMS (existing infra).

## 9. Operator / store side (mostly exists)
- `LiveQueuePanel`: barber marks `called / in_chair / completed / no_show`. Each action →
  recompute + advancement; `completed` also feeds a `pace` sample. Add: customer ETA/"on the
  way" if we capture location consent.

## 10. Edge cases
- Salon closes / no active barber → pause ETA ("Salon geschlossen") + offer refund.
- Payment fails → no number. No-show after grace → policy fee/forfeit. Variable service
  durations → per-service pace (v2).

---

## 11. Build order (maps to tasks #7,#8,#12,#14–17)

- **P1 — Pay → number** (#7, #13): Stripe Elements on the pay page; on success create the
  queue entry (position + ticket_code + payment_intent_id). Ticket shows the real number.
- **P2 — Adaptive ETA + advancement** (#12, #14): pace-EWMA + in-progress model in the
  estimator; recompute on every queue event; ticket polls status → live count; advance on
  cancel/complete.
- **P3 — Daily reset** (#15): date-scoped `ticket_code` sequence.
- **P4 — Cancel + refund + policy** (#16, #17): cancel endpoint (advance + refund per policy);
  salon policy dashboard setting; ticket displays it.
- **P5 — Realtime + notifications:** Supabase Realtime for instant count; "you're next" push/SMS.
- **P6 — Verify e2e** (#8): search → pay → ticket → served / cancel, all four locales.
