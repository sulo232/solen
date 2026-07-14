# Backend health + security check , 2026-07-14 (REPORT ONLY, nothing fixed)

**Scope owner asked for:** a fresh, thorough backend health + security check "so I understand if there is or no." This is a re-VERIFICATION: the big 2026-07 campaign (141 findings + 16 sweep rings) was fixed and merged into local `main` by 2026-07-12, so the job here is to prove those fixes are really present, in current code AND on the live DB, and to catch anything new. Report-only: no code was changed, no migration run, no live write.

**Method:** 6 adversarial re-verification lenses (known-criticals, IDOR/service-role, S1 coverage, money-paths, cron/abuse, secrets) over the current code, each flagged problem re-checked by 2 independent skeptics defaulting to refute; plus live-DB probes I ran directly (`get_advisors` security+performance, `pg_policies`/`information_schema`/`pg_trigger`/`pg_proc`, `storage.buckets`, `list_edge_functions`). 46-agent research+audit workflow + hand-run live checks.

---

## VERDICT (plain English)

**The backend is in good shape. No new critical hole.** Every one of the campaign's ~22 CRITICAL findings is confirmed fixed , the code fixes are present, and the 9 that depended on live database state (RLS policies, triggers, columns, the group-booking RPC, the private backups bucket) are **verified live on the production DB**. The live security advisor shows only known, already-queued items (one SECURITY DEFINER view, leaked-password protection still off) and INFO-level deny-by-default notes.

What the pass DID surface is a tail of **MEDIUM/LOW hardening gaps** and **two "claimed-fixed but not actually fixed" discrepancies** worth your attention (details in Part C). None is an open money-loss or data-leak critical today. If you want any of them fixed, that is a separate, greenlit change , this report touches nothing.

Health at a glance:
- Campaign CRITICALs: **all verified fixed** (44 code-level fixes still present + 9 live-DB fixes confirmed on prod).
- New critical/high holes: **0 critical, 2 high** (both are known-class hardening gaps, not fresh breaches , Part C).
- Live security advisor: **1 ERROR** (a known definer view, already on your queue), rest WARN/INFO and expected.
- Doc-vs-reality discrepancies: **2** (a tracker over-claim + an enforcement hook not wired in this worktree).

---

## PART A , Campaign re-verification: the criticals are fixed

### A1. Live-DB confirmations (I ran these SELECTs on prod, read-only)
| Campaign critical | Live check | Result |
|---|---|---|
| Reviews: anyone could post fake reviews (missing WITH CHECK) | `reviews_insert_own` policy `with_check` | ✅ requires `auth.uid()=user_id AND EXISTS(booking for that salon)` |
| Review moderation wrote a phantom `moderation_status` column | `information_schema.columns` on `reviews` | ✅ `moderation_status` + `removal_reason` both present |
| Loyalty-tier farming: customer self-completes bookings | `trg_guard_booking_status_escalation` | ✅ trigger exists + enabled (`en=O`) |
| Self-promotion to admin via profile UPDATE | `trg_guard_profile_privilege_columns` | ✅ trigger exists + enabled (`en=O`) |
| Discovery "Post" dead + world-readable staging | `discovery_items` policies | ✅ public-read restricted to `status='published' AND is_active`; insert/update/delete/admin per-op policies all present |
| Group-booking RPC blocked by RLS + NOT NULL crash | `create_group_booking` + `group_bookings` policies | ✅ RPC is `SECURITY DEFINER`; `group_bookings_insert_own/update_own/organizer_read` all present |
| DB backups readable by clients | `storage.buckets` + `storage.objects` policies | ✅ `db-backups` bucket `public=false`; zero anon/authenticated SELECT policy targets it |
| Edge functions had no request-auth gate | `list_edge_functions` | ✅ all 6 deployed functions have `verify_jwt=true` (platform JWT gate); `smart-nudges` absent as expected |

### A2. Code-level confirmations
44 of the campaign fixes were re-read in current code and are still present and correct, across: the 8 service-role IDOR sites (client notes/tags, barber-leaderboard, walkin-analytics, spa/treatment-outcomes, /api/staff, /api/salons/verify), the money criticals (customer-cancel refund, booking double-booking CAS + the `bookings_one_active_per_slot` DB backstop, webhook slot-free guard, pre-charge ledger salon_id, vouchers/create auth, connect charges_enabled gating), the getUser()-not-getSession() migration (0 authz `getSession()` calls in app/lib), and secrets hygiene (no hardcoded keys, service-role never in client, OTPs not logged).

---

## PART B , Live advisor baseline (prod, 2026-07-14)

**Security advisor:** 1 ERROR + WARN/INFO, all known or expected:
- **ERROR** `security_definer_view` on `availability_slots_public` , KNOWN (already on the owner queue: "2 definer views"). Confirm it only exposes non-sensitive slot columns.
- **WARN** `public_bucket_allows_listing` (5 buckets: discovery-images, gift-card-assets, review-photos, service-photos, staff-portfolio-images) , a client can LIST files, not just fetch by URL. Low risk (public-read anyway); `gift-card-assets` notable since gift cards are killed.
- **WARN** SECURITY DEFINER functions callable by anon/authenticated , mostly trigger functions (harmless to call directly) + intentional RPCs (create_group_booking guest path, search_*). Confirm none is a state-mutating write RPC open to anon.
- **WARN** `auth_leaked_password_protection` OFF , one-click owner toggle in Supabase Auth settings. KNOWN queue item.
- **WARN** `function_search_path_mutable` (2), `extension_in_public` (cube/earthdistance/btree_gist, standard for geo) , cosmetic hardening.
- **INFO** `rls_enabled_no_policy` (18 tables incl. cron_runs, waitlist, search_events) , RLS-on + no-policy = deny-all to anon/authenticated (secure by default). VERIFY only that the app never reads these via the SESSION (non-service-role) client, which would silently return 0 rows (the RLS-client trap).

**Performance advisor:** 162 lints, all INFO/WARN, **none ERROR** , 110 unused_index (the FK/new-path indexes memory says NOT to drop at current scale), 43 multiple_permissive_policies (micro-opt), 5 unindexed_foreign_keys (e.g. credit_redemptions.booking_id), 4 auth_rls_initplan (newer campaign-era policies not yet wrapped). Consistent with "premature at 28 salons"; no action needed now.

---

## PART C , NEW findings this pass (report-only, nothing fixed)

Adversarially verified (2 skeptics each, default-refute). Grouped by severity. **None is a new critical.**

### HIGH (2) , real hardening gaps, both known-class
1. **No-show cron has no re-assert guard** , `app/api/cron/no-show/route.ts:45`. The `UPDATE bookings SET status='no_show'` is keyed only on `.eq("id", ...)`, no `.eq("status","confirmed")` re-assert and no row-count check, so a booking cancelled between the cron's SELECT and UPDATE gets force-flipped to `no_show`. This is the exact HIGH from `PAYMENTS_BACKEND_AUDIT.md`, still unchanged. (It is time-based, low-frequency, but real.)
2. **Retail stock-decrement-fails-at-settle has no alert or auto-refund** , `app/api/stripe/webhook/purchase-handler.ts:140`. When `decrement_retail_stock` returns no row (stock gone), the handler only `console.error`s , no `alertAdmin`, no automatic `issuePurchaseRefund`, unlike every other money path. Customer is charged for stock that no longer exists and nothing self-heals.

### MEDIUM (7)
3. **Pre-charged booking's payment_status gets downgraded `paid` → `deposit_held` by the webhook** , `app/api/stripe/webhook/route.ts:211`. The pre-charge cron captures fully and sets `payment_status='paid'`, but the async `payment_intent.succeeded` webhook re-enters the main `if (bookingId)` block and, because `type!=="booking"`, falls into an else-branch that overwrites it back to `deposit_held`. Real state-corruption on pre-charged bookings. (2 findings, same root cause.)
4. **`account.updated` webhook only ever turns `accepts_online_payment` ON, never OFF; `payouts_enabled` is never checked** , `webhook/route.ts:761`. A salon later restricted by Stripe keeps receiving payment routing. Known audit item, still present.
5. **`POST /api/salon/go-live` self-activates marketplace listing with no admin-approval precondition** , `app/api/salon/go-live/route.ts:53-77`. An owner can flip `is_active=true` themselves; the admin approve/reject endpoints are effectively dead-letter. Known onboarding HIGH , **may be intentional self-serve**; confirm intent or gate it.
6. **Almost all `app/api/admin/**` routes have no rate limiting** (48 of 49). They DO correctly re-check role from the DB (S6), so it is throttling-only, but includes the privilege-capable `PATCH /api/admin/users`.
7. **DISCREPANCY , `nail/ai-history` PATCH still has zero ownership check**, though `BACKEND_FIX_TRACKER.md` (Batch 6, "nail IDOR") claims it was fixed , `app/api/dashboard/nail/ai-history/route.ts:38`. The route currently always 404s (it queries a phantom `nail_ai_staging` table), so there is no live IDOR today, but the claimed fix is illusory: if that table is ever created the IDOR returns. (rule 18: the tracker over-claims here.)
8. **DISCREPANCY , the `no-getsession-authz-gate.py` hook is NOT wired into this worktree's `.claude/settings.json`**, though `SECURITY_RULES.md:13` calls it "live" , the script exists and is correct, but the worktree's `PreToolUse` arrays don't reference it, so a new `getSession()` authz call would NOT be blocked here. (Verify main's settings too; if also missing, wire it. No authz `getSession()` exists today, so this is a regression-prevention gap, not a live hole.)

### LOW (4)
9. **~57 authenticated write routes lack rate limiting** (waitlist, conversations, accept-invite, profile/delete, intake, discovery collections). All require a valid session + zod-validate; missing layer is throttling only.
10. **`staff/[id]/availability` GET has no auth** , `app/api/staff/[id]/availability/route.ts:14`. Exposes only non-sensitive scheduling (day/start/end/active) for pre-login booking browsing, like public opening_hours. Likely intentional; worth a deliberate sign-off.
11. **`quick-action` cancel lacks the status CAS guard** the canonical `/cancel` route has , `quick-action/route.ts:79`. Does NOT cause over-refund (issue-refund's own CAS prevents double money-movement); consistency nit.
12. **`sms-reminders` cron has a non-atomic send-once pattern** , `app/api/cron/sms-reminders/route.ts:82`. Reads `sms_sent_*=false`, sends, then unconditionally UPDATEs the flag; two concurrent runs could double-send an SMS. Same class as the (now-neutered) booking-reminder Edge Function race.

---

## PART D , What this pass did NOT cover (recommended next audit, concrete)

The re-verification targeted the 141-campaign scope. The completeness critic named these genuinely-out-of-scope areas. They are candidates for a follow-up audit, each with an exact check (NOT vague):

**Undocumented/under-audited money-adjacent systems (highest value):**
- **Value-store redemption atomicity** , do `redeem_voucher` / `redeem_user_credits` claim-before-spend under concurrency? Exact check: two concurrent redemptions of the same balance cannot over-spend or go negative. **Correction (found while documenting section 12):** these RPCs are NOT dormant , credit redeem/restore was wired end to end on 2026-07-11 (commit `57f9f11ff`) into `app/api/stripe/booking-pay-intent/route.ts` with `FOR UPDATE` + a `UNIQUE(credit_id, booking_id)` idempotency constraint, so credits ARE spent today. `_plans/OPS_RUNBOOK.md:49` ("wired to NOTHING") is STALE and should be corrected. The gift-VOUCHER spend path (`voucher_code`) is built + flag-on but still has no frontend entry point (`lib/validations.ts:161-166`), so only that half is effectively dormant. The RPCs already have `FOR UPDATE` + idempotency, so this is a low-suspicion verify, not a known gap.
- **Deposit-capture crons** , can `release-payments` double-`capture()` a PaymentIntent (especially after the Part-C #3 downgrade), and does `release-deposits` void the held deposit BEFORE freeing the slot? Same re-assert/void-before-free class as the no-show + abandon-sweep bugs.
- **Tips PaymentIntent path** (`/api/tips`) , the reuse-existing-open-tip UPDATE (same clientSecret) must not create duplicate charges; Connect routing correct if `accepts_online_payment`/`stripe_account_id` changes between create and confirm.

**New risk classes the 6 code lenses structurally cannot see:**
- **AI/LLM abuse** , prompt injection (user text → Gemini → surfaced as a salon "reply"), content-safety, API cost-bombing. None of the lenses model an LLM trust boundary.
- **Privacy / PII egress + erasure completeness** , what PII leaves to PostHog (EU), Gemini, Mapbox, Stripe metadata, and whether the deletion cascade reaches those processors (not just local tables).
- **Business-logic value-stacking** , can promo + voucher + credits + loyalty + off-peak compose to a zero/negative charge or over-redeem stored value? Discount composition is scattered (only `lib/pricing/bundle.ts` exists), no single owner.
- **Live infra/config posture + supply chain** , `npm audit` CVEs, and live platform state beyond code (bucket privacy checked here; PITR is OFF per OPS_RUNBOOK; Netlify env presence for UPSTASH_*/CRON_SECRET unverifiable from sandbox , if UPSTASH is missing, prod rate limits are OFF).

**Also documented (not audited) as their own systems in `_docs/BACKEND.md`:** the value-store economy, GDPR/erasure, Trust & Safety/moderation, and AI+analytics egress (sections 12-15, added because the doc's first 11 didn't cover them).

---

## Prioritized fix list (IF you later want fixes , none applied here)
1. **P1 (money correctness):** Part-C #3 pre-charge `paid`→`deposit_held` webhook downgrade; Part-C #2 retail no-refund/no-alert.
2. **P2 (races):** Part-C #1 no-show re-assert guard; #11 quick-action CAS; #12 sms-reminders send-once guard.
3. **P2 (enforcement/discrepancy):** Part-C #8 wire the getSession gate (verify main first); #7 fix or delete the illusory nail/ai-history fix.
4. **P3 (policy decisions, yours):** Part-C #5 go-live admin gate (intended or not?); #4 payouts_enabled / turn-off path; #10 staff-availability public-by-design sign-off.
5. **P3 (hardening):** rate limits on admin + the 57 auth'd write routes; the known advisor queue (definer view, leaked-password toggle, public-bucket listing).
6. **Separate audit:** Part D , the value-store/deposit/tips money paths + the AI/privacy/value-stacking risk classes.

---

## FIX PASS applied 2026-07-14 (owner: "fix em") , see commit
Fixed + tsc-clean + reviewed: F1 pre-charge webhook downgrade, F2 account.updated OFF path, F3 retail stock-fail alert+auto-refund (+break), F4 no-show re-assert guard, F5 sms-reminders claim-before-send, F6 quick-action cancel CAS + result-gate, F7 nail/ai-history ownership guard, F8 wired the getSession gate, F9 corrected OPS_RUNBOOK:49. Owner-approved behavior changes: P1 go-live now requires admin approval (`approved_at`), P2 staff-availability now requires auth (and the resurrected zombie barber page that consumed it was re-deleted, REMOVED.md).

### ⚠️ REQUIRED DEPLOY COMPANION for the go-live gate (P1)
The live DB shows **20 of 20 active salons have `approved_at IS NULL`** (they self-activated before this gate existed; only 2 salons have `approved_at` set). If the P1 gate deploys without a backfill, all 20 existing live salons are **locked out of re-activating**. Before/with deploying this branch, grandfather them (idempotent, additive, owner-gated prod write , NOT auto-run):
```sql
UPDATE public.salons
SET approved_at = COALESCE(approved_at, now())
WHERE is_active = true AND approved_at IS NULL;
```
This records the already-live salons as approved so only genuinely-new/deactivated salons hit the admin gate. Run it (or have me run it on your go-ahead) at deploy, not before (the branch is not live yet).
