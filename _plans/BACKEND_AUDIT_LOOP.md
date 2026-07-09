# Backend audit loop — tracker / resume state (2026-07-09)

Owner asked: "go find bugs and gaps in the booking flow backend … after ur done continue w other flows backend and don't stop, ur in a loop." Autonomous loop, one backend flow per round: adversarial finders → 3-skeptic verification → confirmed findings written to a per-flow `_plans/*_BACKEND_AUDIT.md`.

## Flows audited (done)
| Flow | Findings | Doc |
|---|---|---|
| Booking core (create/pay/cancel/reschedule/slots/walk-in) | 35 | [BOOKING_BACKEND_AUDIT.md](BOOKING_BACKEND_AUDIT.md) |
| Booking sub-flows (recurring/group/waitlist/guest/express-rebook/admin-disputes) | 32 (in same doc) | [BOOKING_BACKEND_AUDIT.md](BOOKING_BACKEND_AUDIT.md) |
| Payments & payouts (ledger/retail/vouchers/connect/crons) | 17 | [PAYMENTS_BACKEND_AUDIT.md](PAYMENTS_BACKEND_AUDIT.md) |
| Auth / accounts / RLS | 5 confirmed **(INCOMPLETE — see doc)** | [AUTH_BACKEND_AUDIT.md](AUTH_BACKEND_AUDIT.md) |

Headline CRITICALs so far: customer cancel = total money loss; non-atomic slot flip double-booking; webhook frees a paid slot on out-of-order events; group booking 100% non-functional; express-rebook bypasses payment; guest walk-in-verify always 404s; pre-charge cron skips the payout ledger; retail/tips/gift-card route money to un-onboarded Connect accounts; abandon-sweep never voids the Stripe PI; `/api/vouchers/create` has zero auth. Plus 2 confirmed IDORs (client notes/tags readable by any logged-in user).

## BLOCKERS (as of 2026-07-09, mid-loop)
1. **Session/rate limit hit** — resets **10:50am Europe/Zurich**. Subagent audits error out until then. The auth workflow was cut short (2 finders never ran).
2. **Context near window ceiling** — a `/compact` is loss-safe (all findings persisted to the docs above; this file is the resume map).

## RESUME PLAN (after 10:50am reset + a /compact)
1. **Finish auth** — re-run the two failed finders as a fresh workflow: `auth-routes` (login/signup/OAuth/session/dev-login prod-gate/enumeration/rate-limit) + `authz-rls-escalation` (role escalation, is_suspended/ban bypass, service-role WRITE ownership). Append to AUTH_BACKEND_AUDIT.md.
2. **Systematic sweep**: grep every `createAdminSupabaseClient()` route for a missing ownership check (the notes/tags IDOR is a "GET forgot the check" class → likely more).
3. **Continue the loop** to remaining flows, one per round:
   - search / discovery / Inspo feed (`/api/salons`, `/api/discovery/*`, filters, computed filters, silent no-ops)
   - reviews / ratings (spam gating, dedup, rating recompute trigger, authz)
   - dashboard / salon-management / CRM (staff, services, availability-manage, clients, earnings, invoices, permissions)
   - loyalty / credits / referrals (already touched referrals; user_credits ledger integrity, Solen Status rank)
   - onboarding / salon registration (drafts, go-live gate, category taxonomy)
   - notifications / email / push / remaining crons

Pattern per round: verified Workflow (5 finders × 3-skeptic), extract `result.confirmed` from the task output file via a Bash/python one-liner (the file is `{summary,...,result:{confirmed,refuted}}`), write to a per-flow audit doc, keep orchestrator context lean.
