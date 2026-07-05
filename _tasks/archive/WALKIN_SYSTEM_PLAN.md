# Walk-in System — Build Plan (V2, 2026-06-02)

Owner direction this session. V2 supersedes V1's framing: **walk-in is a first-class,
standalone module** a shop can run ALONE (no marketplace, no online booking, optionally no
pay-in-app), and **pay-at-counter is the default** while pay-first is an opt-in. The V1
mechanics (adaptive ETA, pay→ticket, cancel/refund) are kept below — they still apply.

---

## 1. The vision (plain English)

Today a walk-in customer sits and waits blindly. We replace that with a **live-tracked queue**:
scan a **QR code** → **pick your service + options** → **join the line** → see your **live
position + a wait estimate that moves with the shop's real pace** → either **pay at the counter**
or **pay upfront in the app**. The shop runs the line from a simple counter board. It all sits on
**Solen's one backend** (one account, one payments core, one ledger), but a shop can switch on
**only** the walk-in piece and never touch the rest.

---

## 2. Shop modes + toggles (the flexibility you asked for)

Base = **store management** always on (profile, staff, hours, in-person payments, all logged).
Three independent switches on top:
- **Walk-in queue** (the QR line)
- **Online booking** (scheduled appointments)
- **Listed on Solen marketplace** (discoverable + bookable by marketplace users)

Modes that fall out:

| Mode | Walk-in | Online booking | Marketplace | Pay-in-app |
|------|:---:|:---:|:---:|:---:|
| **Walk-in only** (the hero) | on | off | off | optional |
| **Booking only** | off | on | on | on |
| **Both** | on | on | on | on |
| **Management only** | off | off | off | n/a |

**Hero case — "Walk-in only":** a barbershop turns on ONLY the QR walk-in, opts OUT of marketplace
+ online booking, and may opt OUT of pay-in-app (pure "join the line, pay at counter"). It still
manages its shop + staff. It never enters the booking system. Backend is unified under the hood;
the shop just doesn't surface the rest.

**Presentation:** owners pick an onboarding **preset** ("Walk-in shop" / "Appointment salon" /
"Both") that flips the right switches; advanced owners edit individual toggles in Settings later.
Don't show a non-technical owner a wall of switches.

---

## 3. The walk-in flow (V2)

**Customer:**
1. **Scan QR** → shop's walk-in page (no install; guests OK).
2. **Pick service + options** (shop defines its walk-in services/add-ons).
3. **Join** → in the mode the SHOP chose:
   - **Pay at counter (DEFAULT):** number issued immediately; pays in person after.
   - **Pay-first (shop opt-in):** pays in-app first; payment **reserves** the number (no pay → no number). Cuts no-shows. (This is V1's "pay gates the number" — already built.)
4. **Live tracking:** "you're #3, ~20 min"; notified near the front.

**Shop counter board (mostly exists — `LiveQueuePanel`):** see the line in order; mark
`called / in_chair / completed / no_show`; queue advances + ETAs recompute; one-tap **"pause new joins."**

**Marketplace tie-in (only if listed):** shop shows in Solen search with a conservative wait
**range** ("~10-20 min"). Off entirely for walk-in-only shops.

---

## 4. Unified backend (how it connects)

- **One account / login.** A walk-in-only shop and a full salon are the same account type; they
  differ only by switches.
- **One payments core.** Walk-in payments use the SAME Stripe Connect destination-charge path as
  bookings (salon = merchant of record, Solen commission) and land in the SAME ledger
  (`salon_payouts`). No second payments system.
- **Walk-in is its own module, decoupled from booking.** Shares account + payments; own
  routes/components/tables. A walk-in-only shop has NO availability slots, NO marketplace listing,
  NO online-booking surface — and no code may ASSUME those exist.

---

## 5. What already exists (build ON this, do not rebuild)

| Piece | Where | State |
|---|---|---|
| Queue table `barber_walkin_queue` | `073_barber_foundation.sql` | status, `position`, `estimated_wait_minutes`, `tracking_token`, timestamps, `assigned_barber_id`, `join_method`, `converted_to_booking` |
| Status poll | `GET /api/walkin/queue/status?token=` | public, 30s poll, returns position + status + ETA + counts |
| Availability ("Frei in ~X Min") | `GET /api/walkin/availability` | per-shop ETA for search cards |
| Pay-first hold | `POST /api/walkin/pay-intent` + `/confirm` + `createWalkinTicket` | manual-capture HOLD, idempotent, webhook-gated ticket — **pay-first is DONE** |
| Operator board | `LiveQueuePanel`, `queue-display`, `walkin-analytics` | real-time board |
| Pay screen + ticket UI | `app/[locale]/walk-in-pay/page.tsx` | built |
| Toggle columns | `salons.walk_in_available`, `salons.accepts_online_payment` | exist |
| Wait estimator | `lib/barber/wait-time-calculator.ts` | STATIC — the piece to make adaptive (§7) |

**Coupling to fix:** the module is `barber_`-prefixed + gated on `categories.includes("barbershop")`
— violates the universal-component rule (V3-D205). De-gate to "any shop with walk-in on."

---

## 6. Build order (lean, reuse-heavy, idempotent migrations)

1. **Toggle columns** — `salons.online_booking_enabled` + `listed_on_marketplace` (walk-in + pay exist), with a CHECK that "listed" requires booking-or-walk-in. One idempotent `ADD COLUMN IF NOT EXISTS`.
2. **De-barbershop-gate** the walk-in module → "any shop with walk-in on." Table rename deferred.
3. **Two pay modes** — `salons.walkin_mode` (`pay_at_counter` | `pay_first`). pay-first reuses the existing pay-intent; pay-at-counter = issue a ticket with NO hold.
4. **Choose-options step** — shop defines walk-in services/options; customer picks before joining.
5. **Enforce toggles at the seams** — gate book-button + marketplace query on the toggles; "walk-in only" + "management only" fall out for free.
6. **Adaptive ETA + advancement** (§7) — pace-EWMA + multi-chair model; recompute on every queue event; ticket polls live count.
7. **Onboarding presets UI** + advanced toggles in Settings.
8. **Marketplace live-wait** — conservative range on search cards (listed shops only).

---

## 7. Adaptive ETA engine (kept from V1 — the "minutes move with pace" ask)

- **Live pace:** per-salon (optional per-barber) **EWMA of actual service durations**. On each
  completion: `actual = completed_at − started_at`; `pace = α·actual + (1−α)·pace`, **α≈0.35**.
  Seed with the configured average until ~5 samples. Store on a `salon_pace` row.
- **Your ETA (multi-chair):** `B` = active chairs. Per occupied chair `remaining_i = max(0, pace −
  elapsed_i)`; assign the `peopleAhead` waiters to the soonest-free chair one-by-one (each +`pace`);
  your ETA = the free-time of the chair you land on. Cheap fallback:
  `ETA ≈ ceil(peopleAhead / B) × pace + minRemainingThisRound`.
- **Why it moves:** faster cut → completion fires → pace nudges down + queue advances + chair resets → ETA drops; overrun → `remaining_i` rides to 0 + late completion raises pace → ETA rises. A 30–60s tick drifts the number down smoothly between events.
- **Recompute on:** completion, cancel, no-show, call/start, new join, periodic tick → rewrite
  `position` + `estimated_wait_minutes` for all waiting rows → push (poll v1, Supabase Realtime v2).

---

## 8. Cancel + refund + daily reset + policy (kept from V1)

- **Cancel** (`/api/walkin/cancel`, token-auth): set cancelled → advance everyone behind → recompute → push. Refund: hold-not-captured → void (free); captured → refund per `salons.cancellation_*` policy.
- **Daily number reset:** `ticket_code = prefix + daily_seq` where `daily_seq` = count of the salon's entries TODAY + 1 (date-scoped query) → resets daily, no cron.
- **Policy:** reuse `salons.cancellation_*`; dashboard "Walk-in Stornierung" setting; ticket displays it; cancel API enforces it.
- **Notifications:** "Du bist als Nächstes dran" at `peopleAhead ≤ 1`; "Du bist dran" on called. PWA push or SMS.

---

## 9. Build-later folder (we need it, just not now)

- **Management roles (Owner / Manager / Front-desk):** manager runs line + staff, can't see
  payouts. DEFERRED per owner — permissions are hardwired to `salons.owner_id` across ~40 RLS
  policies, so real roles = a big risky refactor (recursive-RLS footgun) for a pre-launch
  non-problem. Build when a shop hires staff.
- **Per-staff scoping** (chair-renter sees only own book).
- **Precise ETA** (vs range) — once real per-shop throughput data exists.
- **Rename `barber_*` tables** → category-neutral (cosmetic, migration risk).

---

## 10. Watch-outs (carried into the build)

- **Schema drift:** ~99 migrations never applied; JOINing an absent table 500s silently. Every new
  change = standalone idempotent `ALTER TABLE <existing-table> ADD COLUMN IF NOT EXISTS`. Do NOT
  trigger a broad `db push`.
- **Live-wait accuracy:** a promise made in the storefront. Conservative range + "pause joins" kill-switch, or hold until real data.
- **No-show economics:** counter-default has no anti-no-show lever; pay-first does. Consider a 1-active-free-join cap per customer.

---

## 11. Council review — risks + gaps (4 lenses, codebase-verified, 2026-06-02)

### 11A. CRITICAL silent landmines (verified against the code — fix during build)
1. **Realtime is NOT enabled on `barber_walkin_queue`.** `LiveQueuePanel` subscribes to
   `postgres_changes` but no migration adds the table to the `supabase_realtime` publication →
   the "live board" silently never updates, and the planned customer live-tracking can't push.
   FIX: idempotent `ALTER PUBLICATION supabase_realtime ADD TABLE barber_walkin_queue` +
   `REPLICA IDENTITY FULL`. This is **step 0** — verify before trusting any "live" claim.
2. **Guest queue access has NO RLS.** The table has only owner + `customer_id` policies, no
   `tracking_token` policy. Guest reads work ONLY because routes use the service-role client +
   a hand-rolled `.eq("tracking_token").single()`. One forgotten filter = whole-queue leak;
   and Supabase Realtime (authorizes via RLS) returns ZERO rows to guests → the live-tracking
   upgrade can't work for the exact users it's for. FIX: a `tracking_token` RLS policy (or
   formally document service-role-only + centralize the token check in ONE helper).
3. **Pay-first without Stripe Connect silently misroutes money.** `pay-intent` 400s if
   `accepts_online_payment` is off, but if `stripe_account_id` is null it creates a charge with
   NO `transfer_data` + NO `application_fee` → funds land in SOLEN's account, salon gets nothing,
   no commission. FIX: gate `walkin_mode='pay_first'` on `stripe_account_id IS NOT NULL`.
4. **Queue `position` is racy.** Assigned read-max-then-insert with no lock and no
   `(salon_id, position)` unique constraint → two simultaneous scans get the same position.
   FIX: `UNIQUE (salon_id, position) WHERE status IN ('waiting','in_chair')` + atomic
   `INSERT ... SELECT coalesce(max(position),0)+1` (or a SECURITY DEFINER fn).
5. **Customer-facing cancel route does NOT exist.** §8 cites `/api/walkin/cancel` (token-auth)
   but only the operator path exists (owner-only RLS). FIX: build the token-auth customer cancel.

### 11B. THE business decision the plan defers (needs owner call)
**How does Solen earn on a walk-in-only + pay-at-counter shop?** Counter pay never touches Stripe
→ no commission collectable, not in `salon_payouts` → the "one ledger" + commission model breaks
for the DEFAULT mode. Options: (a) card-on-file even for counter (deposit/no-show lever too),
(b) a per-ticket platform fee billed to the shop monthly, (c) accept walk-in-only-counter is a
free/loss-leader tier to win shops, monetize when they turn on pay-first/booking. **Decide before building the counter-pay branch.**

**RESOLVED (owner, 2026-06-02): (a) primary + (c) fallback, on the EXISTING Stripe Connect rails.**
The shop's "connect bank" worry is already solved: `app/api/stripe/connect/create-account` +
`/connect/status` already exist. A shop makes a Solen account → one-time Stripe Express onboarding
(~5 min: business details + IBAN) → Stripe does KYC + pays them out to their IBAN automatically.
They do NOT need their own card-processor contract — Stripe processes Solen payments; their existing
terminal coexists for their own non-Solen customers. Walk-in payments through the app = destination
charges → routed to the shop's connected account, Solen auto-skims commission (application fee),
Stripe pays out. So: **(a)** pay-in-app (pay-first or save-card-charge-on-serve) → commission auto-
collected, no new billing infra. **Gate:** pay-in-app requires `stripe_account_id` present. **(c)**
free counter-only queue is the fallback for shops that won't connect Stripe (wins the shop, monetize
later). **NOT (b)** — per-shop monthly billing is only needed when money bypasses Stripe, which (a)
avoids.

### 11C. Important gaps to fold into the build
- **No tip path.** Barbershops live on tips; pay-first locks the customer in-app with no tip line. Add a tip step (post-service prompt, or capture-then-top-up).
- **No manual "+ Add walk-in" for non-smartphone customers** (older clients, tourists, dead battery — the #1 real case). Without it the digital + physical queues diverge in one rush and the owner reverts to pen-and-paper. Add a staff-side add button on `LiveQueuePanel`.
- **Capture timing + amount undefined.** Define capture = on `in_chair` (auth-fail → counter fallback + flag); handle upsell-at-chair via incremental auth or counter-delta (can't capture > authorized).
- **Daily reset uses server-UTC, not salon timezone** → a Zürich shop resets ~01:00 local. Add `salons.timezone`; reset on `(now() AT TIME ZONE salons.timezone)::date`.
- **ETA trust:** seed pace is a guess shown as fact; one wrong ETA kills trust permanently. Show a RANGE until ≥5 real samples; add a "running behind" one-tap that widens ETAs; auto-stale guard that freezes ETAs if no board action in N min.
- **0 active chairs/staff** still issues "~0 min" numbers → guard (pause joins / "no one working").
- **Toggle walk-in OFF while a queue is live** orphans waiting tickets → drain/grandfather logic.
- **Walk-in-only shop later turns ON booking** has no availability slots → seed default hours.
- **`new TextEncoder` / commission-on-refund:** captured-hold refunds must pass `refund_application_fee` per policy or Solen/​salon silently eats the fee + Stripe fee.

### 11D. Sequencing fixes
- **Step 0:** enable Realtime on the queue table (11A.1) before anything claims "live."
- **Merge** de-gating + toggle-enforcement (build steps 2+5) — same gate edit; the barbershop
  gate lives in 4+ routes PLUS a global `checkFeatureEnabled("barber_features")` switch, and
  `walk_in_available` currently gates joins NOWHERE. Bigger than "polish."
- **Adaptive ETA** needs a real chair-count source (`barber_chairs`) wired as `B` before the EWMA, else it smooths a number computed from `?? 1`.

### 11E. Net read
Direction is sound and ~70% scaffolded, but "already exists" (§5) hid two dead foundations
(Realtime off, customer-cancel absent) and one money-misroute (pay-first sans Connect). None are
hard fixes, but they're silent — they fail without erroring. Fix 11A as part of the build, decide
11B before the counter-pay branch, fold 11C in as you go.

---

## 12. Phase-by-phase implementation (Backend · Frontend · Wiring · real files)

Legend: **[E]** = already exists (reuse/extend), **[N]** = new. Each phase is independently
shippable + verifiable. Migrations are standalone idempotent `ADD COLUMN/CONSTRAINT IF NOT EXISTS`
on tables that already exist (schema-drift rule).

### Phase 0 — Foundations + landmine fixes (no UI; do FIRST)
- **BE migration [N]** (one idempotent file):
  - `ALTER PUBLICATION supabase_realtime ADD TABLE barber_walkin_queue;` + `REPLICA IDENTITY FULL` (fixes the dead live-board, 11A.1).
  - `CREATE UNIQUE INDEX ... ON barber_walkin_queue (salon_id, position) WHERE status IN ('waiting','in_chair')` (fixes racy position, 11A.4).
  - `ALTER TABLE salons ADD COLUMN IF NOT EXISTS online_booking_enabled bool DEFAULT true, listed_on_marketplace bool DEFAULT true, walkin_mode text DEFAULT 'pay_at_counter', walkin_paused bool DEFAULT false, timezone text DEFAULT 'Europe/Zurich';` + CHECK (`NOT marketplace OR booking OR walkin`) added `NOT VALID` then `VALIDATE`.
  - `CREATE TABLE IF NOT EXISTS salon_pace (salon_id uuid PK, pace_minutes numeric, sample_count int, updated_at timestamptz)` + owner/public-read RLS (for Phase 5).
- **BE [N]** `lib/walkin/authz.ts` — one helper that validates `tracking_token` for guest reads/writes; route every guest queue endpoint through it (fixes 11A.2). Add a `tracking_token` RLS policy for Realtime.
- **BE [E]** `app/api/walkin/queue/route.ts` — make position assignment atomic (`INSERT ... SELECT coalesce(max(position),0)+1`).
- **Verify:** apply migration via MCP; confirm Realtime publication includes the table; unit-check the unique constraint.
- **Deliverable:** solid foundation, live-board actually pushes, guest authz centralized.

### Phase 1 — Account + payouts (mostly [E])
- **BE [E]** `app/api/stripe/connect/create-account` + `connect/status` already onboard the IBAN. **[N]** add a `stripe_account_id IS NOT NULL` gate to `app/api/walkin/pay-intent/route.ts` (blocks pay-first until connected — fixes 11A.3 money-misroute).
- **FE [E/N]** dashboard: surface "Connect payouts (Stripe)" for a walk-in-only shop (not buried behind the booking-onboarding). Reuse the existing Connect button/flow.
- **Wiring:** dashboard → `create-account` → Stripe redirect → return → `connect/status` badge.
- **Deliverable:** any shop (incl. walk-in-only) can sign up + connect its bank; pay-first gated on it.

### Phase 2 — Toggles, modes, de-gating
- **BE [E]** remove `categories.includes("barbershop")` from `app/api/walkin/queue/route.ts` (GET+POST), `queue/remote-join`, `pay-intent`, `availability`; rework/relax the global `checkFeatureEnabled("barber_features")`; gate joins on `salons.walk_in_available`. Gate book-button + marketplace query on `online_booking_enabled` / `listed_on_marketplace`.
- **FE [N]** onboarding **presets** ("Walk-in shop" / "Appointment salon" / "Both") + a "Walk-in" tab in `app/[locale]/dashboard/settings/page.tsx` with the toggles + `walkin_mode` choice + `walkin_paused`.
- **Wiring:** Settings tab → PATCH `/api/salons/[slug]` (add the new columns to its allow-list).
- **Deliverable:** any category can run walk-in-only; modes + presets work; "management only" falls out.

### Phase 3 — Walk-in core: QR → options → join → live ticket (counter-pay default)
- **BE [E/N]** `app/api/walkin/queue/route.ts`: pay-at-counter branch = issue ticket with NO hold; 0-active-chairs guard (pause/“no one working”); daily ticket reset on `(now() AT TIME ZONE salons.timezone)::date`. **[N]** shop-defined walk-in services/options (reuse `services` or a `walkin_services` list). **[N]** `app/api/walkin/cancel/route.ts` (token-auth customer cancel — the absent route, 11A.5) → advance + recompute + push.
- **FE [E]** `app/[locale]/walk-in-join/page.tsx` + `components-legacy/barber/RemoteQueueJoin.tsx` — extend with the options picker + counter-pay path. `app/[locale]/queue/[token]/page.tsx` — wire live position/ETA + a working **Stornieren** button. `components-legacy/dashboard/barber/LiveQueuePanel.tsx` — add staff **"+ Add walk-in"** (non-smartphone customers, 11C).
- **Wiring:** walk-in-join → `queue` POST; queue/[token] → `queue/status` poll + Realtime sub; cancel → `walkin/cancel`; board → `queue/[id]` actions.
- **Deliverable:** counter-pay walk-in works end-to-end (join → live ticket → served / cancel), any category.

### Phase 4 — Pay-first + tips + capture (monetized)
- **BE [E/N]** pay-first reuses `pay-intent` (now Connect-gated). Capture the hold on `in_chair` (auth-fail → counter fallback + flag). **[N]** tip step (post-service prompt or capture-then-top-up). **[N]** refund-on-cancel passes `refund_application_fee` per policy. Upsell-at-chair via incremental auth or counter-delta.
- **FE [E]** `components-legacy/barber/WalkInPaymentForm.tsx` + `app/[locale]/walk-in-pay/page.tsx` — pay step in the join flow; tip prompt; pay-first ticket states.
- **Wiring:** join → `pay-intent` (hold) → `confirm` → ticket; board `in_chair` → capture; tip → top-up charge.
- **Deliverable:** pay-first walk-in works; commission + tips collected; clean refunds.

### Phase 5 — Adaptive ETA + live tracking
- **BE [E/N]** `lib/barber/wait-time-calculator.ts` → make adaptive (EWMA pace from `salon_pace`, α≈0.35); wire `barber_chairs` as `B`; recompute on every queue event + a 30–60s tick → rewrite all waiting rows → push.
- **FE [E]** `queue/[token]` shows a conservative ETA **range**; `LiveQueuePanel` gets a "running behind" one-tap + an auto-stale guard (freeze ETA if no board action in N min).
- **Deliverable:** ETA moves with the shop's real pace; honest under rush.

### Phase 6 — Marketplace tie-in (listed shops only)
- **BE [E]** expose the conservative wait range from `availability` / `queue-stats` to search.
- **FE [E]** search/discover card "Frei in ~X Min" + join entry (`SalonWalkInPanel` + search cards), shown only for `listed_on_marketplace` shops.
- **Deliverable:** marketplace users discover + join walk-in lines.

### Build-later (deferred, documented)
Roles (Owner/Manager/Front-desk), per-staff scoping, precise ETA (vs range), rename `barber_*` → category-neutral tables.
