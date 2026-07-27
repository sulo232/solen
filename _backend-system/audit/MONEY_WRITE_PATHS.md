# Money write-path inventory (data-money-09)

**Written 2026-07-27.** Every function that performs more than one write across a balance-shaped
table (`user_credits`, `vouchers`, `promo_codes` usage counters, member-discount caps, `referrals`,
`gift_cards`, `salon_payouts`, `tips`) from application code, checked against the RPC-atomicity law
(`_backend-system/LAW.md` section 2: "Any multi-write operation that must succeed or fail together
... one Postgres function via `.rpc()`, never multiple sequential client-side `.from()` calls").

MATCH = the multi-write already goes through one RPC (atomic). GAP = it does not.

| Table(s) | Function / call sites | Mechanism | Verdict |
|---|---|---|---|
| `user_credits` (debit) | `redeem_user_credits` RPC, called from `app/api/stripe/booking-pay-intent/route.ts:603` | Single RPC, `FOR UPDATE` loop, atomic | MATCH |
| `user_credits` (restore) | `restore_user_credits` RPC, called from `app/api/stripe/booking-pay-intent/route.ts:681`, `app/api/stripe/webhook/route.ts:517`, `lib/bookings/issue-refund.ts:252`, `lib/purchases/issue-purchase-refund.ts:478` | Single RPC | MATCH |
| `vouchers` / `credit_redemptions` (redeem) | `redeem_voucher` RPC, `app/api/stripe/booking-pay-intent/route.ts:638` | Single RPC | MATCH |
| `vouchers` (restore) | `restore_voucher` RPC, `app/api/stripe/booking-pay-intent/route.ts:688`, `app/api/stripe/webhook/route.ts:523`, `lib/bookings/issue-refund.ts:272`, `lib/purchases/issue-purchase-refund.ts:500` | Single RPC | MATCH |
| `promo_codes` usage counter | `reserve_promo_use` / `release_promo_use` RPCs, `app/api/stripe/booking-pay-intent/route.ts:281,495,549`, `app/api/stripe/webhook/route.ts:506`, `app/api/cron/abandon-sweep/route.ts:156` | Single RPC per call | MATCH |
| member-discount caps | `reserve_member_discount` / `release_member_discount` RPCs, `app/api/stripe/booking-pay-intent/route.ts:403,502,532` | Single RPC per call | MATCH |
| `referrals` + `user_credits` (complete + double-credit) | `complete_referral_and_credit` RPC (added data-money-09, `supabase/migrations/20260727121500_referral_complete_atomic.sql`), `lib/referral/complete-referral.ts` | Single RPC, folds CAS + two inserts into one transaction | MATCH (was GAP before this pass: two sequential `.from()` calls, no reconciliation cron; see `_backend-system/audit/transactions-concurrency.md` Gap 2) |
| `tips` (status/amount updates) | `app/api/tips/route.ts`, `app/api/walkin/tip/route.ts`, `app/api/stripe/webhook/route.ts:85,475,575` | Single-row `.update().eq()` per call, no paired second write in the same request | MATCH (not a multi-write shape; single-row CAS is the correct pattern here, not an RPC) |
| `salon_payouts` | `app/api/stripe/webhook/route.ts:842` | Single-row `.update()` per call | MATCH (same reasoning as `tips`) |
| `gift_cards` | none found writing more than one row per request (`grep -rn '\.from("gift_cards")' app/api lib` returns only single-row reads/updates as of this pass) | n/a | MATCH (no multi-write path exists to audit) |

**Scope note:** this inventory was built by grepping every `.rpc(` call plus every `.from("<balance-
table>")` write across `app/api` and `lib` (2026-07-27), not by reading all 354 API routes in full.
It is a real improvement over the previous state (a single topic-scoped audit that found five RPCs
plus one gap by chance), but it is still a point-in-time snapshot, not a live-enforced list.

**Maintenance rule:** any new function that writes to a balance-shaped table gets a row added to
this table in the same change. A grep-based gate (matching two sequential `.from("user_credits"|
"vouchers"|"gift_cards"|"tips"|"salon_payouts"|"referrals")` writes in one function body, not wrapped
in a `.rpc(` call) is the natural next step once this list needs to scale past manual review; not
built this pass, per `_backend-system/audit/transactions-concurrency.md` Gap 2's own enforcement
note.
