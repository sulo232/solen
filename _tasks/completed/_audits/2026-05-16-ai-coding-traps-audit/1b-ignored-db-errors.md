# Topic 1B — Ignored DB / API Errors Audit
Date: 2026-05-16
Scope: Supabase / Stripe / Resend / OpenAI / zod error paths that are dropped

## Summary
- Total findings: 71 (CRITICAL: 18 | HIGH: 22 | MEDIUM: 22 | LOW: 9)
- Files scanned: ~646 (.ts / .tsx across app/, lib/, hooks/, src/, components/, middleware.ts)
- Notable: no OpenAI usage in scope; one Resend SDK call (well-guarded). Most damage is **fire-and-forget Supabase mutations** + **bare Stripe SDK calls without try/catch**, especially right around financial actions and onboarding.

## Findings by severity

### CRITICAL (financial, auth, payment-state inconsistency)

#### C1. `app/api/stripe/connect/create-account/route.ts:51`
```ts
await admin.from("salons").update({ stripe_account_id: accountId }).eq("id", salon.id);
```
Why critical: Stripe Connect Express account just created (line 40-48). If this DB update silently fails, the salon has an orphaned Stripe Connect account that solen.ch has no record of. Next request will create *another* Stripe account.
Fix: destructure `error`, abort + delete the orphaned Stripe account on DB failure.

#### C2. `app/api/stripe/payment-methods/route.ts:72`
```ts
await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
```
Why critical: Stripe customer just created (line 66). Silent fail → orphaned Stripe customer + duplicate creation on next call. Same orphaning pattern as C1.
Fix: same — error check + cleanup-on-fail.

#### C3. `app/api/stripe/create-customer/route.ts:32`
```ts
const customer = await stripe.customers.create({ ... });
return NextResponse.json({ customer_id: customer.id });
```
Why critical: Creates Stripe customer but never persists `stripe_customer_id` to `profiles`. Every call to this endpoint creates a NEW Stripe customer for the same user → unbounded duplication. Also no try/catch on the Stripe call.
Fix: lookup-or-create pattern; persist to `profiles` after creation in a transaction.

#### C4. `app/api/stripe/confirm-price/route.ts:62-71`
```ts
await stripe.paymentIntents.capture(booking.payment_intent_id, { amount_to_capture: ... });
await admin.from("bookings").update({ final_price, payment_status: "charged", ... }).eq("id", validated.booking_id);
```
Why critical: Stripe capture runs without try/catch — if Stripe throws but DB update somehow still runs, OR if capture succeeds but DB update silently fails, the customer is charged on Stripe while solen.ch sees `deposit_held`. Cron `release-deposits` may then attempt to release a deposit that's already captured.
Fix: try/catch around the capture; on failure return 502. After capture, verify the DB update with `.select().single()` and rollback Stripe (refund) if persistence fails.

#### C5. `app/api/stripe/confirm-price/route.ts:88-91`
Same pattern as C4 for the price-increase path. DB update without error check.

#### C6. `app/api/stripe/approve-increase/route.ts:52-54`
```ts
await stripe.paymentIntents.capture(booking.payment_intent_id, { amount_to_capture: toRappen(depositAmount) });
```
No try/catch on Stripe capture.

#### C7. `app/api/stripe/approve-increase/route.ts:59-66`
```ts
await stripe.paymentIntents.create({ amount: toRappen(difference), ... confirm: false });
```
No try/catch on creating a SECOND PaymentIntent for the price-difference. If creation fails, the first capture already ran, leaving the customer partially charged.

#### C8. `app/api/stripe/approve-increase/route.ts:69-73`
```ts
await admin.from("bookings").update({ payment_status: "charged", price_increase_approved: true, ... }).eq("id", validated.booking_id);
```
DB update no error check after two Stripe operations. Most dangerous spot — already-charged booking could show `deposit_held` if this fails.

#### C9. `app/api/admin/booking-disputes/[id]/action/route.ts:130-140`
```ts
await admin.from("bookings").update({ refunded_amount: newTotal, payment_status: ... }).eq(...);
await admin.from("booking_disputes").update({ status: "resolved", ... }).eq(...);
```
Stripe refund completed successfully (lines 120-127, properly wrapped). But the two subsequent DB writes have no error checks. Refund is on Stripe, dispute may still show "open" on solen.ch.

#### C10. `app/api/stripe/webhook/route.ts:36-39`
```ts
const existing = await admin.from("processed_webhook_events").select(...).single();
if (existing.data) return ...;
await admin.from("processed_webhook_events").insert({ event_id: event.id });
```
Webhook idempotency record. If this insert silently fails, replays of the same event are NOT detected → double-processing of `payment_intent.succeeded`, double-payouts, double-bookings.
Fix: destructure `error`, return 500 to force Stripe retry — better double-replay (handled by idempotency check next time) than missing event.

#### C11. `app/api/stripe/webhook/route.ts:52-54, 69-78`
```ts
await admin.from("bookings").update({ payment_status: "deposit_held" }).eq("payment_intent_id", pi.id);
// ... 
await admin.from("salon_payouts").insert({ booking_id, salon_id, ..., status: "recorded" });
```
Payment succeeded on Stripe, but DB updates for booking-status + payout-record have no error check. Silent fail = customer charged but booking still appears unpaid + no payout record for salon.

#### C12. `app/api/stripe/webhook/route.ts:139-145`
```ts
await admin.from("bookings").update({ status: "cancelled", payment_status: "none" }).eq(...);
await admin.from("availability_slots").update({ status: "available" }).eq("id", pi.metadata?.slot_id ?? "");
```
Payment_failed handler. Silent DB-update failure means: Stripe says failed, but solen.ch still shows "confirmed" → slot stays blocked + customer thinks they have a booking.

#### C13. `app/api/stripe/webhook/route.ts:196-201`
```ts
await admin.from("bookings").update({ payment_status: "card_saved", stripe_setup_intent_id: si.id, ... }).eq("id", bookingId);
```
SetupIntent succeeded — booking should be card-saved. Silent fail: card actually saved on Stripe but solen.ch never knows; when the appointment day comes, the system can't charge.

#### C14. `app/api/stripe/webhook/route.ts:241-245`
```ts
await admin.from("salon_payouts").update({ gross_amount: newGross, commission_amount: newComm, net_amount: newNet }).eq("id", payout.id);
```
Charge refunded — payout record needs to be reduced. Silent fail = salon receives the full pre-refund commission.

#### C15. `app/api/slots/[id]/route.ts:19`
```ts
await supabase.from("bookings").update({ status: "cancelled", cancellation_reason: "Slot removed by salon", cancelled_at: ... }).eq("id", slot.booking_id);
```
Slot deleted by salon → booking marked cancelled, but no error check. If DB update fails, the slot is gone but the booking shows as confirmed → customer arrives, no slot.

#### C16. `app/api/slots/[id]/route.ts:75`
```ts
await supabase.from("bookings").update({ starts_at: startsAt, ends_at: endsAt, staff_member_id: ... }).eq("id", slot.booking_id);
```
Slot rescheduled. If silent fail, the slot is at new time but booking still at old time → user shows up at the wrong time.

#### C17. `app/api/auth/logout/route.ts:12`
```ts
await supabase.auth.signOut();
```
No error destructure. If signOut fails (rare but possible), user thinks they're logged out and gets redirected, but Supabase session cookie still valid. LOW probability but auth-related so flagged CRITICAL by category.
Fix: `const { error } = await ...; if (error) console.error(...);` — even logging is enough since redirect still helps the UX side.

#### C18. `app/api/cron/late-cancel/route.ts:73-76`
```ts
await admin.from("bookings").update({ late_fee_charged: true, late_fee_amount: feeAmount }).eq("id", booking.id);
```
Stripe capture for late-fee already ran on line 66-68. If this DB update fails silently, `late_fee_charged` stays `false` and the NEXT cron run double-charges the customer.

### HIGH (data inconsistency, broken business logic)

#### H1. `app/api/auth/signup/route.ts` (entire flow)
Not flagged in code, but worth noting: `supabase.auth.signUp` errors ARE handled (line 61-63). No bug here — included as "checked the auth path" anchor.

#### H2. `app/api/staff/accept-invite/route.ts:40, 74-77, 98-101, 104-107`
Four chained DB updates with no error checks:
- Mark invite expired (40)
- Link existing staff to user (74-77)
- Set profile's staff_salon_id (98-101)
- Mark invite accepted (104-107)

If line 98 fails, the staff_member row exists but `profiles.staff_salon_id` is unset → middleware can't route them to the dashboard.

#### H3. `lib/strikes.ts:41-46, 75-80, 82-87`
```ts
await admin.from("account_warnings").insert({ salon_id: ..., severity: "strike", ... });
```
Three policy-enforcement inserts (3-cancellation strike, 3-no-show warning, 5-no-show suspension). Silent fail = policy not applied. Customers/salons who hit thresholds aren't actually penalized.

#### H4. `lib/strikes.ts:51-56`
```ts
await admin.from("audit_log").insert({ actor_id: ..., action: "salon_cancelled_booking", target_type: "booking", target_id: booking.salon_id });
```
Inside try/catch with `/* fire-and-forget */`. But the count on line 32 *uses* this audit log to detect repeat behavior. If logging fails silently, salons can cancel unlimited times without ever hitting the 3-strike threshold (because the log it queries is missing entries).

#### H5. `app/api/admin/salons/[id]/freeze/route.ts:53-57`
```ts
await admin.from("bookings").update({ status: "cancelled", cancellation_reason: "admin_salon_suspension", cancelled_at: ... }).eq("id", b.id);
```
Inside batch loop for cancellation. No error check. If one fails, others continue but the customer isn't notified and the slot remains "booked".

#### H6. `app/api/admin/salons/[id]/freeze/route.ts:74`
```ts
await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", b.slot_id);
```
Slot-freeing during salon suspension. Silent fail = ghost-booked slots after suspension.

#### H7. `app/api/admin/salons/[id]/freeze/route.ts:78-83`
```ts
await admin.from("account_actions").insert({ salon_id, action_type: 'suspension', reason, admin_id });
```
Admin's suspension action — silent fail means no audit trail. Investigators can't see who suspended this salon.

#### H8. `app/api/admin/salons/[id]/warn/route.ts:49-54`
Same pattern: `account_actions.insert` for the warning event no error check.

#### H9. `app/api/bookings/[id]/quick-action/route.ts:66`
```ts
await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
return NextResponse.json({ result: "confirmed", booking_id: bookingId });
```
Returns success without verifying the update. User sees "confirmed", DB may still be pending.

#### H10. `app/api/bookings/[id]/quick-action/route.ts:71, 73`
Cancel + free-slot — no error checks. Same race.

#### H11. `app/api/salons/route.ts:355`
```ts
await admin.from("services").insert(serviceRows);
```
During salon onboarding, services are inserted with no error check. Silent fail = salon exists but has no services → empty salon page.

#### H12. `app/api/salons/route.ts:368`
```ts
await admin.from("staff_members").insert(staffRows);
```
Same pattern for staff during onboarding.

#### H13. `app/api/salons/route.ts:416`
```ts
await admin.from("availability_slots").insert(slots.slice(i, i + 100));
```
Availability slot generation in batches of 100. If ONE batch silently fails, the salon has gaps in availability that look unbookable to customers.

#### H14. `app/api/salons/route.ts:435`
```ts
await admin.from("profiles").update(updateData).eq("id", user.id);
```
Onboarding completion + role upgrade to `salon_owner`. Silent fail = user finishes onboarding but middleware still treats them as customer (loop forever to onboarding).

#### H15. `app/api/referral/complete/route.ts:78-85`
```ts
await admin.from("user_credits").insert({ user_id: referral.referrer_id, amount: rewardAmount, source: "referral", ... });
```
Referrer credit insert no error check. Silent fail = referrer's reward never credited despite the referral being marked completed.

#### H16. `app/api/referral/complete/route.ts:88-95`
Same for referee credit.

#### H17. `app/api/referral/complete/route.ts:101-105`
Generating new pending referral code — silent fail = referrer can't refer again.

#### H18. `app/api/conversations/[id]/price-offer/route.ts:126-136`
```ts
const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(offer.amount_chf * 100), ... });
```
No try/catch. Stripe failure surfaces as raw 500.

#### H19. `app/api/conversations/[id]/price-offer/route.ts:138-144`
```ts
await supabase.from("price_offers").update({ status: "accepted", stripe_payment_intent_id: paymentIntent.id }).eq("id", offer_id);
```
PaymentIntent created on Stripe, but DB update no error check. Silent fail = customer pays but offer still shows "pending".

#### H20. `app/api/conversations/[id]/price-offer/route.ts:74-79`
```ts
await supabase.from("messages").insert({ conversation_id, sender_id: user.id, content: ..., message_type: "price_offer" });
```
Price offer chat message — silent fail = offer exists but no chat record → confusing UX.

#### H21. `app/api/gift-cards/purchase/route.ts:65-78`
```ts
await supabase.from("gift_cards").insert({ ... stripe_payment_intent_id: paymentIntent.id, is_active: false });
```
After Stripe PaymentIntent created. Silent fail = Stripe charge happens (after frontend confirms) but no gift card record exists → orphaned charge.

#### H22. `app/api/tips/route.ts:61-67`
```ts
await supabase.from("tips").insert({ booking_id, staff_member_id, ... stripe_payment_intent_id: paymentIntent.id });
```
Same pattern: Stripe intent created, tip record silent-fail.

### MEDIUM (data quality, UX surprise, recoverable)

#### M1. `app/api/auth/logout/route.ts:12` — already listed under C17 but downgrade-equivalent if Solen wants to keep redirect-first behavior.

#### M2. `app/api/stripe/payment-methods/route.ts:42-44`
```ts
} catch {
  return NextResponse.json({ methods: [], has_customer: true });
}
```
Stripe API failure → user sees zero saved cards. UX: they assume their card is gone and may re-enter it. MEDIUM because user CAN recover by re-listing.

#### M3. `app/api/stripe/save-card/route.ts:61`
```ts
const setupIntent = await stripe.setupIntents.create(setupIntentParams);
```
No try/catch. Failure → 500 with stack trace.

#### M4. `app/api/stripe/create-payment-intent/route.ts:78`
Same — bare Stripe call.

#### M5. `app/api/salon/retail/purchase/route.ts:59`
Same — bare Stripe call.

#### M6. `app/api/stripe/connect/status/route.ts:46-48`
```ts
} catch {
  return NextResponse.json({ status: "not_connected" });
}
```
Stripe API failure → user sees "not_connected" → may retry onboarding. They may try to disconnect and reconnect, racing with the existing account. LOW-MEDIUM.

#### M7. `app/api/dashboard/batch/route.ts:58-66` and `:78-83`
```ts
const { data } = await admin.from("bookings").select("price_paid").eq(...);
const total = (data ?? []).reduce(...);
```
Data destructured without error. If DB fails, `total` silently becomes 0 (revenue widget reads as zero). Wrapped in outer try/catch so UI shows `{ error: "failed" }` per-key, but only when an exception is thrown — Supabase typically returns `{ data: null, error: ... }` without throwing.
Fix: destructure `error` and propagate explicitly.

#### M8. `app/api/admin/test-salon/seed/route.ts:70, 92, 115, 132`
Four insert calls returning `count: data?.length ?? 0` in response without checking error. Admin-only seed endpoint so LOW user-impact, but the response lies about what was created.

#### M9. `app/api/dashboard/fade-blueprints/route.ts:57-64`
```ts
const { data } = await admin.from("fade_blueprints")...maybeSingle();
return NextResponse.json({ data });
```
Read query, error silently becomes `null`. UX: blueprint history appears empty even when query failed.

#### M10. `app/api/dashboard/waxing/zone-revenue/route.ts:36`
```ts
const { data } = await admin.from("services").select("id, name_de").in("id", serviceIds);
```
Service-name enrichment. Silent fail = zone names appear as raw service-ids in the dashboard.

#### M11. `app/api/salons/search/route.ts:51-57`
```ts
const { data } = await supabase.from("salons").select("*").eq("is_active", true).in("id", ...);
extraSalons = data ?? [];
```
Service/staff cross-search secondary fetch. Silent fail = search results missing salons that matched on staff/service name (the primary search-by-salon-name already returned successfully so this is enrichment).

#### M12. `app/[locale]/discover/[id]/page.tsx:14-21`
```ts
const { data } = await supabase.from("discovery_items").select("*").eq("id", id)...single();
return data as DiscoveryItem | null;
```
If query fails, returns `null` → triggers `notFound()` on caller. User sees 404 when the real issue is a DB error.

#### M13. `app/[locale]/discover/[id]/page.tsx:114`
```ts
supabase.rpc("increment_discovery_view", { p_item_id: id }).then(() => {});
```
Fire-and-forget view count. LOW-MEDIUM: analytics may be undercounted.

#### M14. `app/[locale]/profile/gift-cards/page.tsx:33-39`
```ts
const { data } = await supabase.from("gift_cards").select("*").or(...);
if (!cancelled && data) setCards(data as any);
```
Wrapped in try/catch but error never seen. Silent fail = user thinks they have no gift cards. MEDIUM.

#### M15. `app/[locale]/profile/favorites/page.tsx:48-52, 59-63`
Two queries (favorites list + full salon fetch). Silent fails would show empty page.

#### M16. `app/[locale]/profile/packages/page.tsx:33-37`
Same pattern.

#### M17. `app/[locale]/profile/intake-forms/page.tsx:42-46`
Same pattern.

#### M18. `app/api/cron/no-show/route.ts:30-33, 53`
```ts
await admin.from("bookings").update({ status: "no_show", cancelled_at: ... }).eq("id", booking.id);
// ...
await admin.from("profiles").update({ no_show_count: newCount }).eq("id", booking.user_id);
```
Cron silent fails could mis-count no-shows. Per-booking try/catch around the Stripe portion exists but not the DB writes.

#### M19. `app/api/cron/pending-timeout/route.ts:28-35, 38-41`
DB updates (cancellation + slot release) no error checks. Cron processes whole batch so one failure doesn't break others, but the user thinks their booking is cancelled when it's still pending.

#### M20. `app/api/conversations/[id]/messages/route.ts:93-96`
```ts
await supabase.from("conversations").update({ last_message_at: ..., last_message_preview: content.slice(0, 100) }).eq("id", id);
```
Conversation preview silent fail = inbox list doesn't update.

#### M21. `app/api/conversations/[id]/messages/route.ts:99`
```ts
await supabase.rpc("increment_unread", { conv_id: id, is_customer_sender: isCustomer });
```
Unread badge silent fail = recipient never sees the message counter.

#### M22. `app/api/analytics/platform/route.ts:21-30`
```ts
return NextResponse.json({ categories: { coiffeur: c1.count || 42, ... } });
```
On count failure, falls through to hardcoded values (42, 18, 24, 11, 8, 15). Stale numbers shown as live analytics with no warning logged.

### LOW (admin-only, audit trails, fire-and-forget by design)

#### L1. `lib/audit.ts:14-26` — entire function is `try { audit insert } catch {}`. Documented as intentional. The trap: admins lose visibility into failures.

#### L2. `app/api/discover/nails/route.ts:105-106, 110-111`
```ts
await admin.from(table).delete().eq("id", existing.id);
await admin.rpc("increment_field", { ... amount: -1 });
```
Like/save toggle. Silent fail = UI shows wrong state. LOW because user can retap.

#### L3. `app/api/salon-draft/route.ts:92`
Delete-draft on user request. Silent fail = retry works.

#### L4. `app/api/dashboard/coiffeur/formula-photo/route.ts:85-92`
Documented "ignore insert errors" because table may not exist yet.

#### L5. `app/api/referral/route.ts:25`
```ts
await supabase.from("profiles").update({ referral_code: referralCode }).eq("id", session.user.id);
```
Silent fail = next call generates new code. LOW because user can refresh.

#### L6. `app/api/dashboard/waxing/rebook-alerts/route.ts:85-92` — wrapped in try/catch with `/* ignore */`. Logging table; silent fail risk = repeat-spam customer.

#### L7. `app/api/conversations/[id]/messages/route.ts:99` (also M21)

#### L8. `middleware.ts:179-182`
```ts
await supabase.from("profiles").update({ role: "salon_owner" }).eq("id", user.id);
```
Auto-fix stale role. Silent fail = retried next request.

#### L9. `app/api/cron/rebooking-nudge/route.ts:25-30, 35-40, 58-62, 70-74`
Multiple data-only destructures; cron tolerates failures.

## Patterns observed

1. **Stripe SDK calls without try/catch is endemic.** Of ~28 direct `stripe.*` calls, ~12 are bare `await` with no try/catch. The pattern is consistent: top-level checks succeed (auth, validation, salon-lookup), then a bare Stripe call, then a bare DB update, then `NextResponse.json({ ok: true })`. When Stripe throws, the route surfaces a 500 with stack trace; when the DB update fails after Stripe succeeds, the two systems diverge silently.

2. **Sister-call orphaning.** Every place that creates a Stripe resource (account, customer, payment-intent, setup-intent) and then writes the ID to Supabase suffers from the same race: Stripe write happens irreversibly, then the DB write can silently fail. Files: `stripe/connect/create-account` (C1), `stripe/payment-methods` (C2), `stripe/create-customer` (C3), `stripe/confirm-price` (C4-5), `stripe/approve-increase` (C6-8), `conversations/.../price-offer` (H18-19), `gift-cards/purchase` (H21), `tips` (H22), `packages/purchase`.

3. **Webhook fire-and-forget.** `app/api/stripe/webhook/route.ts` has ~12 DB writes inside webhook handlers, none with error checks. Because Stripe retries non-2xx webhooks, the correct pattern is: throw on DB-update failure to force retry. Instead the route swallows everything and returns 200. Idempotency works *only if* the `processed_webhook_events` insert succeeds — and that insert itself is unchecked (C10).

4. **Cron fire-and-forget.** `cron/no-show`, `cron/late-cancel`, `cron/pending-timeout` mix bulletproof outer try/catch with unchecked DB writes inside the loop. `cron/late-cancel` has the worst case (C18): silent fail = double-charge on next run.

5. **Onboarding-chain orphaning.** `salons POST` creates salon, then unchecked `services.insert`, `staff_members.insert`, `availability_slots.insert`, and `profiles.update` (H11-14). Any one silent failure leaves the user in a half-onboarded state with no error signal.

6. **Profile pages: read-with-empty-fallback.** `profile/gift-cards`, `profile/packages`, `profile/favorites`, `profile/intake-forms` all do `const { data } = await supabase...; if (data) setCards(data);` — error path is silently empty, presenting "no data" indistinguishable from "DB error".

7. **No `const { data, error } = ...` cases where `error` is destructured but never referenced.** Scripted check on all 86 such destructures confirmed every one of them references `error` within the next ~100 lines. The leak is almost entirely on the **data-only destructure** and **bare-await** paths, not on partially-handled destructures.

8. **`safeParse` is well-handled.** All 17 `safeParse` call sites either branch on `result.success` or use `validateBody()` which returns a typed `{ data, error }` discriminated union that callers properly handle.

9. **Resend SDK usage is small (1 direct call in `lib/booking-email.ts`) and well-guarded.** The platform mostly uses `lib/email.ts` which throws on Resend non-2xx. Callers are inconsistent — many wrap in try/catch (`bookings/route.ts`, `slots/[id]`, `cron/pending-timeout`, all `messages` notification blocks), but `app/api/admin/notify-new-salon`, `app/api/directory/[id]/claim`, and `app/api/notify/review-replied` (which DOES wrap) are inconsistent enough to be a smell. **No OpenAI usage in scope.**

10. **`await fetch("https://api.resend.com/...")` without `.ok` check.** Two cron-style files (`cron/review-prompt`, `notifications/off-peak`) call Resend's HTTP API directly with `fetch` but never inspect `res.ok`. Fetch resolves on 4xx/5xx — these routes mark emails as "sent" even when Resend rejected them.

11. **Empty `catch {}` patterns (21 total) are mostly intentional dashboard-page failure tolerance.** The damaging ones are: `app/[locale]/dashboard/services/page.tsx:177` (photo upload error swallowed, user sees nothing), and `app/api/cron/pending-timeout/route.ts:59` (email failure inside the cron is silent — counts as `cancelled++` though customer never got the cancellation email).
