# Solen Status — loyalty structure (LOCKED direction 2026-06-14)

Owner direction 2026-06-14: kill the gift card, kill the confusing stamp-vs-points mix, build ONE Solen-wide loyalty system **modeled on Japan's GO taxi app**, validated by the LLM council (Claude Opus + Grok, 6 expert personas; Gemini endpoint was down). This file is the build spec.

> Supersedes the "points card" framing. The earlier `solen-rewards-ui` / `solen-rewards-ui-v2` mockups had the right *layout* but the wrong *mechanic* (points). The mechanic is now **rank/status, not points.** See [[loyalty-solen-wide]] memory.

---

## 1. Core mechanic: frequency RANK, not points

**Solen Status is a usage-frequency rank system. There is no points currency, no points shop, no discounts-for-points.** This is the GO model: GO's reward is *priority dispatch* (you get matched first when demand spikes), which costs the platform ~zero because it only **reorders a queue the platform already controls**.

**Why this is the right call for a marketplace (council-unanimous):** a points-redeemable-for-money system has a fatal cross-salon funding problem , who pays when points earned at Salon A are redeemed for a discount/free service at Salon B? Solen can't subsidize it (margin collapse), salons won't fund each other (they churn). A rank system whose rewards are **priority + status** has **zero cross-salon liability** because Solen has two scarcity surfaces it already allocates: the **booking calendar** (prime-time slots, popular stylists) and the **walk-in queue**. Reordering those by tier costs no new CHF.

## 2. Tiers, earn metric, window

- **3 tiers: Base / Gold / Platinum.** (Not 4-5 , extra tiers dilute the signal.)
- **Earn metric = count of COMPLETED VISITS, not CHF spent.** Spend-gating punishes the cheap gateway services (CHF 25 dry, kids' cut) that grow the marketplace; Solen earns commission per booking, so optimise for booking count.
- **Rolling 12-month window, recomputed on the 1st of each month.** This is the DECAY mechanism: status drops if you stop booking, but gently (owner 2026-06-14: "if you don't book it gets lower, but not as fast as GO , people don't cut hair that often"). GO's ~3-month window is far too harsh for beauty (cadence is every 4-8 weeks); we ask "did you visit a few times this YEAR." Recomputed monthly, valid through end of month-after-next.
- **Soft-drop:** on a miss, drop ONE tier (Platinum→Gold), never cliff to Base. (Second gentleness lever, paired with the 12-month window.)
- **Initial thresholds (PLACEHOLDER , must calibrate, see §8):** Gold = 3 completed visits / 12mo, Platinum = 6 / 12mo.

## 3. "Completed visit" definition (anti-gaming, per Ops/Finance lens)

A booking counts toward status ONLY if ALL hold:
1. Marked **completed** by the salon (dashboard completion timestamp), AND
2. **No refund / dispute** issued within 72h of completion, AND
3. Gross booking value **≥ CHF 25** (floor; stops farming cheap bookings to climb tiers).

Without this, the tier population fills with fraud (no-show farming, splitting one service into two bookings) within months.

## 4. Rewards per tier (status/priority only in v1)

Rewards are access / priority / status, OR salon-funded opt-in deals. NO discount socialized across independent salons (the gift-card/points funding trap). Deals are the strongest lever for this audience (owner: "more coupons"); walk-in priority is the direct analog of GO's priority dispatch. Council-refined (Grok + synthesis) + owner-locked 2026-06-14.

**Gold (recognition + deals):**
- **Members-only deals** , salons attach a promo code flagged `min_tier` (new column on `promo_codes`); surfaces in a Member-deals feed. Salon-funded, opt-in, zero platform liability. Cap: `max_uses` + salon toggle. *Owner's priority lever , build first.*
- **Waitlist priority** , freed/cancelled slots offer to members first (existing `booking_waitlist` + tier order, 15-30 min head start). ~0 cost. Cap: 1 active waitlist entry per member.
- **In-salon VIP recognition** , the booking payload carries the tier, so the salon sees Gold/Platinum on arrival and treats the member as a regular. ~0 cost.

**Platinum (all Gold, plus):**
- **Prime-time slot early access** , book ~30% of prime slots before others (salon flags slots `member_early`; hard 30% ceiling). Salon opt-in, ~0 cost.
- **Walk-in queue priority** (owner-requested 2026-06-14) , at walk-in-enabled salons (barbershops), members hold a priority position in the live queue. This is the GO priority-dispatch analog. Applies ONLY where the walk-in queue runs (so it's Platinum, not headline). ~0 cost; tier-ordered, not unlimited line-jumping.
- **Late-cancel grace (1/month) + auto-refill** , the member's late-cancel fee is waived AND the freed chair is immediately offered to the member waitlist first (pairs with Waitlist priority). The salon doesn't eat an empty chair , it's a timing shift, not a subsidy. THIS is the structure that makes the owner's "the math works." Solen does NOT reimburse. Cap: 1/month, enforced on `bookings`.
- **Free reschedule** , move an appointment without the `late_cancel_fee_percent` penalty; salon keeps the revenue, just shifts it. Cap: 2 reschedules per booking lifetime (`reschedule_status`).
- **Deeper / exclusive deals** , Platinum-only member promos + member pricing on select `service_addons`. Coupons go further at the top.

**How you climb:** completed visits over the rolling 12 months (3 = Gold, 6 = Platinum), gentle decay + soft-drop (§2).

**CUT (council + owner):** public profile/review badge (vanity , the salon already sees the tier; keep only the tier emblem inside the member's own Solen Plus screen as identity). Birthday treat (once a year, no pull, funding). Priority support (doesn't fit beauty). Early-access-to-Angebote demoted (no timed-offer mechanism , weak; coupons beat it).

**REJECTED (owner):** Solen booking-fee waiver; points shop; cross-salon-funded discounts.

**Optional / v1.1:** boosted referral reward (Solen-funded, capped ~3/quarter; `referrals` + tier multiplier); deposit exemption after 3+ completed visits at the same salon (no-show risk isolated per salon).

## 5. Salon opt-in (don't force it)

- Salons choose **which** Angebote/offers are member-early-access and which prime-time slots are early-access (cap at ~30% of prime inventory), and may post member-only promo codes (their existing promo system, salon-funded by choice).
- Participation is rewarded with a **soft search-ranking lift**, so non-participation has a gentle cost but is never forced. Forcing priority would screw a salon's existing non-Platinum regulars out of their standing slot → they turn it off → the perk becomes illusory.

## 6. Migration from per-salon stamp cards

- **Freeze** new stamp issuance Solen-wide on launch day.
- Existing stamp balances stay **redeemable at the issuing salon for 12 months** (the dashboard scanner keeps working, flagged "legacy program" with a sunset date).
- Customers with an **active stamp card OR ≥1 stamp redemption in the last 12 months** get a **90-day Gold seed** at launch (feel rewarded, not robbed).
- **Tell salons first:** their scanner keeps working 12mo, opt-in has no cash cost, here's the data showing participation correlates with bookings. Otherwise they hear "Solen is killing the stamp card I built with my customers" and revolt.

## 7. CRM surface (NON-NEGOTIABLE)

A status program with no visible progress is invisible and dies (beauty is low-frequency; a first-timer has nothing to chase for weeks). Required:
- **Visible progress** ("2 visits to Platinum") on every booking confirmation and on the profile.
- **Tier-up celebration**: SuccessMark + haptic + push + email. Treat tier-up as a product event, not a DB state change.
- **Expiry nudge**: "your Gold status expires in 30 days, book to keep it" push.
- **Tier-down disclosure (added ethics-psychology-08, closes the asymmetry above):** the moment a soft-drop actually happens (Platinum→Gold, Gold→Base), treat it as the same tier of product event as tier-up, not a silent badge change the user discovers by noticing. Send a push + in-app moment naming: the new tier, the specific perks now locked (reuse the /rewards unlocked-vs-locked row treatment), and the concrete path back ("3 visits to Platinum again"). This is PSYCHOLOGY.md law 1's peak-end logic (endings carry disproportionate memory weight) applied honestly to a negative ending, not only the positive one the celebration already covers.

## 8. Threshold calibration (do before launch)

Do NOT ship "3 visits = Gold" from intuition. Pull the **actual last-6-months completed-visit-count distribution** from `bookings`, plot it, and set **Gold ≈ top 20%** of active customers, **Platinum ≈ top 5%**. If there isn't enough real booking volume yet, ship the placeholder thresholds (§2) and recalibrate post-launch. Status dies if the middle tier becomes the floor.

## 9. Data model implications

- Retire/migrate the per-salon stamp tables (`loyalty_cards`, `loyalty_stamps`, `barber_loyalty_*`) per §6 (keep readable for the 12-month legacy redeem window).
- New: a per-customer status record (current tier, qualifying visit count in window, window expiry, seed flag) recomputed monthly from `bookings`. A monthly cron recompute fits the existing GitHub Actions cron setup.
- Reuse the existing 8 `/api/loyalty/*` routes where possible; the scanner/award/stamp endpoints become legacy-only.

## 10. Frontend

The `/rewards` screen (mockup `public/_mockups/loyalty-card/solen-rewards-status.html`): same layout the owner approved, content reworked to status, NOT points.
- **Hero status card:** wordmark + tier chip, the Bronze/Base → Gold → Platinum ladder as the centerpiece, "X of Y visits, N to Platinum", window-expiry line.
- **Your perks:** unlocked-at-current-tier (active) vs locked (at Platinum) rows.
- **How it works:** one-line explainer (completed visits in last 6 months → tier) + a Book CTA.
- Pure DS: white card, ink figures, one blue accent, semantic icon chips. No points anywhere.

## 11. Open decisions

1. Confirm tier names (Base/Gold/Platinum vs Silver/Gold/Platinum).
2. Calibrate thresholds from real data (§8).
3. v1.1 commission-waiver perk: model the P&L, decide go/no-go.
4. Exact prime-slot early-access mechanic on the booking calendar (how salons flag slots).

## 12. Implementation plan (LOCKED 2026-06-14, building Phase 1)

> This section is the build contract. It survives context compaction: anyone resuming reads §12 and continues. Brand name = **Solen Plus**. Tiers = Base / Gold / Platinum. Climb = completed-visit count over rolling **12 months** (gentle decay), recompute monthly, soft-drop one tier. Thresholds Gold=3 / Platinum=6 are PLACEHOLDER (calibrate from real booking distribution; change `lib/loyalty/status.ts` `LOYALTY.thresholds` AND the SQL `recompute_loyalty_status()` together).

### 12.0 LOCKED FINAL PERK SET (owner + council 2026-06-14)

| Tier | Perk | Funding | Maps to |
|---|---|---|---|
| Gold | Members-only deals | salon-funded opt-in (`promo_codes` + `min_tier`) | promo_codes |
| Gold | Member discount % (small) | **Solen commission-waiver** (option c) | new tier_perks + bookings cols |
| Gold | Free reschedule (generous) | salon policy waiver | bookings.reschedule_* |
| Gold | Free cancel (capped; cap grows by tier) | salon policy waiver + member cancel ledger | salons.cancellation_hours / late_cancel_fee_percent |
| Platinum (+) | Bigger discount % + more uses | Solen commission-waiver | tier_perks |
| Platinum (+) | Prime-time slot early access (opt-in ~30%) | salon-flagged slots | calendar slot query |
| Platinum (+) | Walk-in queue priority (GO analog, walk-in salons only) | queue ordering | queue position calc |
| Platinum (+) | Tier-up gift (one-time salon-funded free add-on) | salon-funded opt-in | service_addons + ledger |

**CUT (do not rebuild):** birthday treat, priority support, public profile badge, early-access-to-Angebote, in-salon recognition icon. **REJECTED:** Solen fee-waiver-as-a-perk, points shop. **DEFERRED v1.1:** guest pass, recurring slot hold, boosted referral, deposit exemption, bonus-progress 2x campaigns (council N2 liked, parked).

### 12.1 Funding decision = (c) Solen waives part of its own Connect commission

The member discount % is funded by **Solen reducing its own Stripe Connect `application_fee_amount`**, NOT by the salon and NEVER socialized across salons. Identity: `salon_payout = customer_charge − application_fee`. Reduce BOTH `customer_charge` and `application_fee` by the same `discount` → `salon_payout` is unchanged. Money flow (all Rappen):

- `commission = round(amount × commissionRate)` (Solen's normal fee).
- `rawDiscount = round(amount × tier_perks.discount_pct)`.
- `effectiveDiscount = min(rawDiscount, round(amount × salons.member_commission_waiver_rate), commission)` , clamped so Solen's fee never goes negative and the per-salon waiver cap (default 0.02 = 2%) is never exceeded.
- **Customer is charged `amount − effectiveDiscount`** (they pay LESS , that IS the member discount).
- `application_fee_amount = commission − effectiveDiscount` (Solen's margin absorbs the whole discount).
- **Salon payout = `(amount − effectiveDiscount) − (commission − effectiveDiscount) = amount − commission` = UNCHANGED.** The salon cannot tell a member discount happened; only Solen's take moves.
- Deposit mode: only the Stripe-borne portion (the deposit charged now) can be discounted , Solen can't waive commission on cash paid in person. So the % applies to `amount` (what's charged now); in prepay mode `amount` = full price, so it's % off full.
- `bookings.applied_tier` + `bookings.tier_discount_amount` record what was applied (reconciliation + use-counting).

Why (c): consistent member experience across all salons (a real brand promise), zero salon cash outlay, exposure bounded to Solen's own margin, no cross-salon liability. (a) salon-opt-in = inconsistent; (b) Solen-funded uncapped = unbounded cost.

**⚠️ CALIBRATION (the one decision before launch):** `effective = min(tier %, waiver cap %, commission)`. With the PLACEHOLDER defaults (gold 5% / platinum 10%, cap 2%) the **cap binds for BOTH tiers → both get only 2% and tier differentiation vanishes**. For the tiers to actually differ, set `salons.member_commission_waiver_rate` ≥ the largest tier `discount_pct` (cap becomes a misconfig safety-net), or make the cap per-tier. The /rewards UI (Phase 4) must display the EFFECTIVE post-cap %, never the raw `tier_perks.discount_pct`, or it over-promises. Worked example (CHF 60, commission 15%, cap 2%, platinum 10%): rawDiscount 600 Rp, cap 120 Rp, effective 120 Rp → customer pays 5880, appFee 780, salon payout 5100 = 6000−900 (unchanged). Customer sees 2% off, not 10%.

### 12.2 Tier source of truth = `current_user_tier()` ON-READ, not the monthly snapshot

The monthly `loyalty_status` snapshot is **display + notifications only** (the /rewards page, tier-up/expiry pushes). **Every perk that gates money or access reads the live tier via `current_user_tier(uid)`** (SECURITY DEFINER, recomputes from `bookings` in the rolling window at call time). Reason: a user who hits Gold mid-month is NOT in last month's snapshot. On-read is the truth; the snapshot can lag. Client NEVER sends its own tier; the server always derives it. (This mirrors `lib/loyalty/status.ts` which already computes on-read for the UI.)

### 12.3 Additive schema (Phase 1, applied via `apply_migration` only, NEVER `db push`)

All idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`), no drops:

1. `promo_codes.min_tier text` (null = everyone; 'gold' | 'platinum' = members-only deal gate).
2. `tier_perks` table: `(tier text, discount_pct numeric, max_discount_uses_per_window int, cancel_grace_per_month int, ...)` , the per-tier knob values (so % and use-counts are data, not code). Seed Base(0,0,0) / Gold / Platinum rows.
3. `bookings.applied_tier text` + `bookings.tier_discount_amount numeric` , audit of what tier+discount was applied at booking time (so payouts/reporting reconcile, and discount-use counting is queryable). **`tier_discount_amount` is RAPPEN** (matches the Stripe `application_fee` reduction exactly), NOT CHF , written at intent-create, only counts as a "use" once `payment_status='paid'`.
4. `salons.member_commission_waiver_rate numeric default 0.02` , the per-salon cap on how much commission Solen will waive to fund the member discount.
5. `current_user_tier(uid uuid) returns text` SECURITY DEFINER , the on-read tier function (same window/threshold logic as the lib + recompute fn).

### 12.4 Enforcement points (server-side; client cannot fake tier)

| Perk | Enforced where | Gate |
|---|---|---|
| Members-only deal | promo-code validate (booking-create / checkout) | `promo_codes.min_tier` ≤ `current_user_tier()` else reject |
| Member discount % | PaymentIntent build (booking-create) | server reads `current_user_tier()` → `tier_perks.discount_pct`, clamps to `member_commission_waiver_rate`, reduces `application_fee_amount`, writes `bookings.applied_tier`+`tier_discount_amount` |
| Discount use cap | PaymentIntent build | count `bookings` where `applied_tier=tier` in window < `tier_perks.max_discount_uses_per_window` |
| Free reschedule | reschedule API | tier ≥ Gold → waive reschedule fee |
| Free cancel (capped) | cancel API | count member cancels this month < `tier_perks.cancel_grace_per_month` → waive `late_cancel_fee_percent` |
| Prime-time early access | calendar slot query | salon-flagged prime slots visible to `current_user_tier()=platinum` N hours before public |
| Walk-in priority | queue position calc (walk-in salons) | platinum members sort ahead within the unpaid-arrival band (GO dispatch analog) |
| Tier-up gift | one-shot at tier crossing | recompute detects Base/Gold→Platinum crossing, grants one salon-opt-in free add-on token, single-use |

### 12.5 Build order (council Phase 1 → fast-follow)

1. **Phase 1 (now):** schema (§12.3) + `current_user_tier()` + tier helper lib (`getCurrentTier` / `computeMemberDiscount`) + **members-only deal gate** (promo `min_tier`) + **member discount** (commission-waiver in PaymentIntent). This is the owner's stated priority ("deals/discount first").
2. **Phase 2:** free cancel (capped, cap grows by tier) + free reschedule.
3. **Phase 3:** prime-time early access + walk-in priority.
4. **Phase 4:** tier-up gift. Then update `/rewards` UI + i18n (de/en/fr/it) to the FINAL perk set (currently shows the old Angebote/member/birthday set).

### 12.6 Abuse gates (server-side)

1. **Self-dealing visit inflation** (book → complete → refund to farm visit count): the "completed visit" definition already filters `refunded_amount<=0` + `grossCHF>=25` + `status='completed'`. `current_user_tier()` and `recompute_loyalty_status()` MUST both apply this same filter. Discount-use counting reads `bookings.applied_tier` so a refunded booking's discount doesn't "free up" a use without also dropping the visit.
2. **Discount stacking / cap evasion** (member discount + a members-only promo on the same booking to exceed the waiver cap): the PaymentIntent builder computes the TOTAL Solen-funded reduction (member % + any Solen-funded promo) and clamps the SUM to `member_commission_waiver_rate`; salon-funded promos are independent and don't count against the cap. (Today promo discounts aren't applied to the booking charge at all, so only the member % is in play; revisit when promo→charge lands.)
3. **Cross-user tier read** (direct PostgREST `rpc('current_user_tier',{uid})`): `current_user_tier` has a self-only guard , an authenticated caller may only resolve their own `auth.uid()`; `service_role` (server/admin client + recompute) may resolve any uid.
4. **Use-cap TOCTOU** (KNOWN, bounded, deferred): the per-window member-discount use cap is a non-atomic check-then-write, and the counter only sees `payment_status='paid'` rows, so truly-concurrent intent-creates can each pass the cap. Bounded by `paymentLimiter` (3/h) to ~1 extra discount, each hard-capped at the 2% waiver , negligible. NOT counting in-flight `pending` rows is deliberate: it would make a declined-then-retry legit member lose the discount for ~30min (until the abandon-sweeper cancels the stale row). Robust fix (deferred hardening): move count+write into one `SECURITY DEFINER` fn under `pg_advisory_xact_lock(user_id)`.

### 12.7 Build status checklist (update as you go)

- [x] §12.3 migration applied LIVE + mirrored to `supabase/migrations/20260614010000_solen_plus_phase1_perks.sql` (promo_codes.min_tier, tier_perks, bookings.applied_tier+tier_discount_amount, salons.member_commission_waiver_rate, current_user_tier()). Verified: current_user_tier() == snapshot for all 8 real users.
- [x] `lib/loyalty/perks.ts` (getCurrentTier on-read, tierAtLeast, getTierPerks, computeMemberDiscount pure w/ cap clamp, countDiscountUsesInWindow paid+null-safe, resolveMemberDiscount).
- [x] members-only deal gate wired into `app/api/promo/validate/route.ts` (min_tier ≤ current_user_tier) + `min_tier` added to createPromoSchema.
- [x] member discount wired into `app/api/stripe/booking-pay-intent/route.ts` (application_fee reduction, charge reduction, applied_tier+tier_discount_amount audit cols, Connect-only + logged-in-only). tsc clean.
- [x] Adversarial review (4-dim, per-finding verify): 8 issues confirmed → 5 fixed in code (payout-ledger commission from real application_fee in webhook booking branch; idempotency key reverted to pre-discount amount + audit/response derived from returned PI; phase-2 migration window 6→12; deposit sub-50-Rappen floor in computeMemberDiscount; current_user_tier self-only guard live+file), 1 deferred-bounded (use-cap TOCTOU, §12.6#4). Round-2 verify: ALL GREEN (0 broken, 0 regressions). tsc exit 0.
- [ ] FAST-FOLLOW: dashboard PromoManager UI to SET min_tier (frontend, mockup-first + owner approval).
- [ ] CALIBRATE: member_commission_waiver_rate vs tier discount_pct (see §12.1 ⚠️) before any real member discount ships.
- [ ] Phase 2: free cancel + reschedule
- [ ] Phase 3: prime-time + walk-in priority
- [ ] Phase 4: tier-up gift + /rewards UI/i18n refresh to final set
- [ ] Tier-down disclosure (§7, ethics-psychology-08): push + in-app moment at the actual soft-drop, same tier as the tier-up celebration; build alongside the /rewards refresh above, not separately

## Council + sources
Claude Opus personas (Marketplace PM / Growth-CRM / Ops-Finance) + Grok personas (Marketplace Purist / Hybrid Realist / Growth Lead). Convergence: status-spine, visit-count metric, rolling window, priority-only rewards, calibrate thresholds, CRM is non-negotiable. GO model: [go.goinc.jp](https://go.goinc.jp/en), [rank + rolling window](https://chabunomori.jp/taxi-go/), [GO × ANA miles](https://www.ana.co.jp/en/jp/shoppingandlife/travel-service/tameru_go_mo-t/).
