# Phase 3 , Functional Bug Hunt (Solen.ch)

Generated 2026-07-07, Sonnet hunt+verify across flows. 60 confirmed bugs: 11 critical / 23 high / 22 medium / 4 low.
(The synth step returned a placeholder; this report is built directly from the adversarially-verified raw findings.)


## CRITICAL

**Reschedule matches the new slot with a range query (gte/lte) instead of an exact match, then writes the client's raw start/end times onto the booking instead of the claimed slot's real bounds**  
`broken-state` · `app/api/bookings/[id]/reschedule/route.ts:74` · confidence ?  
- Impact: The claimed availability_slots row can cover a shorter window than what gets written onto bookings.starts_at/ends_at, leaving the tail of the new appointment bookable by someone else, and unrelated ambiguous matches can spuriously 409 a valid reschedule.
- Fix: Resolve the new slot with an exact filter (`.eq('starts_at', new_starts_at)` and validate ends_at against that row), and persist newSlot.starts_at/newSlot.ends_at onto the booking instead of the client-supplied values, matching the create-booking route's pattern.

**Promo codes cannot be entered anywhere in the live booking wizard, so the fully-built discount pipeline never fires**  
`silent-no-op` · `components-legacy/booking/PayConfirmStep.tsx:237` · confidence ?  
- Impact: A customer with a valid promo code has no field anywhere in the real booking flow to enter it. formData.promoCode is initialized to '' in lib/booking-context.tsx and is never reassigned by any component in components-legacy/booking (verified via grep: zero updateFormData promoCode calls, zero promo-related UI in any wizard step). PayConfirmStep.tsx line 237 always sends promo_code: null to POST /api/bookings, so the customer is always charged full price silently.
- Fix: Add a promo-code input to the live wizard (e.g. in PayConfirmStep.tsx before payment, calling /api/promo/validate then updateFormData({ promoCode })), or remove the dead promo_code plumbing and log it in _design-system/REMOVED.md if promos are being sunset.

**Wochenplan bulk-create and drag/reschedule PATCH write naive local timestamps, shifting every slot by the DST offset (1-2h)**  
`date-timezone` · `app/api/slots/bulk/route.ts:29` · confidence ?  
- Impact: Every slot an owner creates via the Wochenplan bulk-plan tool or moves via the drag-reschedule modal is stored offset from the wall-clock time actually picked (e.g. a 09:00 slot displays/books as 11:00 CEST to customers), and the owner's own calendar shows it wrong on reload.
- Fix: Reuse the existing zurichWallClockToUtc DST-safe conversion (already in app/api/cron/generate-slots/route.ts) in both app/api/slots/bulk/route.ts and app/api/slots/[id]/route.ts instead of writing naive local strings.

**salon_closures / staff_time_off created after slots exist do not retroactively block those slots, and the booking route never checks either table**  
`broken-flow` · `app/api/bookings/route.ts:226` · confidence ?  
- Impact: A salon that closes for a date range, or approves staff time-off, after the nightly cron already generated 'available' slots for that range leaves those slots fully bookable. Customers can book and pay for an appointment on a day the salon is explicitly closed or the assigned staff is off.
- Fix: Add a booking-time guard checking the slot's date/staff against salon_closures and approved staff_time_off (mirroring the vacation_start/end 409), and have the closures/time-off POST handlers (or the nightly cron) flip any already-generated 'available' slots inside the new window to 'blocked'.

**Booking never linked to its walk-in ticket when the Stripe webhook wins the race against the client's /confirm call, exposing customers to a double payment-form / double-charge**  
`broken-flow` · `app/api/stripe/webhook/route.ts:409` · confidence ?  
- Impact: A customer who paid via a staff-sent SMS payment link (paid_via='walk_in' booking + HMAC token) can see the payment form again on reopening the link and risks authorizing a second manual-capture hold for the same visit, because bookings.walkin_queue_id and payment_status are never set when the webhook's createWalkinTicket call wins the race.
- Fix: Thread linkBookingId (from pi.metadata.booking_id, already stamped by app/api/walkin/pay-intent/route.ts:142) into the webhook's createWalkinTicket call. In lib/barber/walkin-ticket.ts, perform the bookings.update linking step in the 'existing' fast path (line 218-221) and the 'recovered' path (line 256-259) too, not just on fresh insert. Also fix app/api/bookings/walk-in-verify/route.ts:59 to check payment_status IN ('paid','deposit_held') OR walkin_queue_id IS NOT NULL.

**Barber loyalty stamp write targets phantom column stamps_collected (real column is stamps) - QR-scan stamping silently never persists**  
`silent-no-op` · `app/api/loyalty/stamp/route.ts:66` · confidence ?  
- Impact: A customer who gets scanned by barber staff sees the API respond 200 stamped:true, but the DB row's stamps column never changes. The card can never reach stamps_required and never flips to a redeemable state through this path.
- Fix: Rename stamps_collected to stamps throughout the route, fix the status value to one of active/redeemable/redeemed per the CHECK constraint, and check/log the {error} from the update before returning success.

**Redeem flow's auto-create replacement card insert also uses phantom stamps_collected and omits NOT NULL qr_token - new card creation silently fails after every redemption**  
`silent-no-op` · `app/api/loyalty/redeem/route.ts:69` · confidence ?  
- Impact: After a salon owner redeems a customer's completed card, the code tries to auto-create a fresh active card so the customer can keep earning. This insert always fails, leaving the customer with zero active barber_loyalty_cards rows for that salon/program until manually fixed.
- Fix: Generate a fresh qr_token via generateLoyaltyQRToken() (or make the column nullable/defaulted if a redesign is intended) and use the real `stamps` column name; check the returned {error} and surface/log a failure instead of silently continuing.

**/api/loyalty/award (simple stamp-card system) has zero callers anywhere in the repo - stamps are never awarded after booking completion**  
`broken-flow` · `app/api/loyalty/award/route.ts:9` · confidence ?  
- Impact: The route's own docstring claims it's called after booking completion via webhook or cron, but nothing invokes it. A customer who completes bookings at a salon with an active simple loyalty_cards program never accumulates loyalty_stamps rows, so progress toward the reward is permanently stuck at whatever it already was.
- Fix: Wire a real caller: add it to the booking-completion code path (app/api/bookings/[id]/route.ts, where status flips to completed) with an internal service-to-service call, or add a scheduled cron job that scans newly-completed bookings and calls this endpoint. Until wired, the feature is dead code that should be flagged as inactive rather than implying it's live.

**Salon-owner review-reply feature is completely broken: schema requires a field the frontend never sends**  
`broken-flow` · `lib/validations.ts:1054` · confidence ?  
- Impact: A salon owner opens the dashboard, types a reply to a customer review, hits submit, and nothing is ever saved. The reply box closes and the UI looks successful, but no reply is ever persisted. Non-functional for every salon on the platform.
- Fix: Make reply_text optional in reviewRespondSchema with a refine requiring at least one of reply_text or salon_response, and make the dashboard page check response.ok before closing the reply box.

**Guest GDPR erasure wipes PII on every booking sharing that email, including active/future confirmed ones, with no status guard**  
`broken-flow` · `app/api/profile/request-deletion/route.ts:138` · confidence ?  
- Impact: Anyone who proves ownership of ONE old/completed guest booking via reference_code + email can trigger anonymizeGuestPII, which strips guest_name/guest_email/guest_phone on every booking matching that email via a bare `.ilike('guest_email', ...)` with no status or date filter, including a paid, upcoming, confirmed appointment under a different reference_code. Verified in lib/gdpr/anonymize-guest.ts lines 68-91: the update to bookings runs on all bookingIds found by email match alone, no `.eq('status', ...)` or date guard anywhere in the function or its caller.
- Fix: In anonymizeGuestPII (or before calling it), scope the update to exclude bookings with status in ('confirmed','pending') whose appointment date is in the future, or restrict erasure to only the specific reference_code's booking rather than every booking under that email unless all are completed/cancelled.

**auto-complete cron always no-ops: filters on a salons column that does not exist in the live DB**  
`silent-no-op` · `app/api/cron/auto-complete/route.ts:35` · confidence ?  
- Impact: Confirmed bookings never auto-transition to status='completed' 48h after ends_at, for any salon. Downstream review-prompt and nail-infill-reminders both hard-require status='completed', so those never fire either unless staff manually complete the booking.
- Fix: Apply an idempotent migration adding auto_complete_enabled to the live salons table, and change the cron to check/log the discarded error so a future column-drift regression fails loudly instead of silently reporting completed:0.


## HIGH

**Recurring rule's next_booking_date is stamped with the date of the booking just created, never advanced to the next cadence occurrence**  
`broken-state` · `app/api/bookings/recurring/route.ts:44` · confidence ?  
- Impact: Every newly created recurring booking causes the daily edge-function cron to immediately re-process that same date: either it fires a spurious 'Serienbuchung nicht möglich' email for a date the customer already has a confirmed booking on, or, if another matching slot for that staff/service happens to be open that same day, it creates a duplicate booking.
- Fix: After creating the first booking, advance next_booking_date by one cadence period (reuse the edge function's advanceDate logic) from firstSlot.starts_at before inserting the rule, so it always points at the next UNBOOKED occurrence.

**Monthly recurring cadence uses Date.setMonth(), which silently rolls day-29/30/31 anchors into the wrong month**  
`date-timezone` · `supabase/functions/recurring-booking-processor/index.ts:22` · confidence ?  
- Impact: A customer with a monthly recurring booking anchored on the 29th-31st sees their appointment date permanently drift forward month over month, with February effectively skipped and no notice that the cadence changed.
- Fix: Clamp the target day to the last valid day of the destination month instead of calling setMonth() directly on a day that may not exist there.

**Customer-initiated cancel via PATCH /api/bookings/[id] frees the slot through the customer's session-bound client, which the owner-only RLS policy silently rejects (0-row no-op)**  
`silent-no-op` · `app/api/bookings/[id]/route.ts:196` · confidence ?  
- Impact: When a customer cancels a booking through this legacy PATCH branch, the booking is correctly marked cancelled and refunded, but the slot stays 'booked' forever, permanently removing that inventory slot from the salon with no error surfaced anywhere.
- Fix: Use createAdminSupabaseClient() for the slot release at line 196-198 and log the result, matching every sibling cancel/reschedule/recurring path.

**Canonical cancel route computes the customer's cancellation fee from the salon's current live policy columns, not the policy_snapshot frozen at booking time**  
`money-math` · `app/api/bookings/[id]/cancel/route.ts:154` · confidence ?  
- Impact: If a salon tightens its cancellation policy after a customer already booked under the old terms, the customer cancelling later is charged the NEW policy's fee, not the one they actually saw and accepted (policy_accepted_at / policy_snapshot) at booking time.
- Fix: Read cancellation_fee_type/value/free_cancel_hours from booking.policy_snapshot (falling back to the live salon row only when the snapshot is missing, with a warning log), matching the no-show cron's pattern.

**Phantom column profiles.full_name makes payment-methods POST always mint a new Stripe Customer, orphaning saved cards**  
`silent-no-op` · `app/api/stripe/payment-methods/route.ts:63` · confidence ?  
- Impact: A returning user with an existing saved card gets a brand-new Stripe Customer minted (and profiles.stripe_customer_id overwritten) on every 'Add card' click, orphaning the old customer/card and silently redirecting all future customer-id lookups (booking-pay-intent, save-card) to the new, cardless customer.
- Fix: Use display_name instead of full_name, and check/log the query error before treating profile as authoritative.

**pre-charge cron drops promo codes and member discounts, overcharging the full undiscounted price 5 days before deferred-pay bookings**  
`money-math` · `app/api/cron/pre-charge/route.ts:52` · confidence ?  
- Impact: A customer who books >7 days out with save-card/deposit at a prepay salon (app/api/stripe/save-card/route.ts feeds this exact card_saved -> pre-charge flow), applies a valid promo code, is charged the full undiscounted price 5 days before the appointment instead of the discounted price the immediate-pay path would have honored.
- Fix: Select promo_code (and any member-tier fields) in the cron's booking query, re-run the same promo/member-discount resolution used in booking-pay-intent, and subtract it from amountRappen before charging.

**pre-charge cron's off-session charge metadata omits salon_id, so it never gets a salon_payouts ledger row and is invisible to earnings/revenue/invoices**  
`silent-no-op` · `app/api/stripe/webhook/route.ts:187` · confidence ?  
- Impact: Every pre-charge cron capture (real Stripe Connect money movement with an application fee) is permanently missing from the salon's earnings dashboard, admin revenue reports, and generated invoices, all three of which read exclusively from salon_payouts.
- Fix: Add salon_id to the metadata passed to chargeOffSession in pre-charge/route.ts (booking.salon_id is already selected at line 23), or extend the fallback salon_id-from-booking resolution (already present for upcharge/fee) to also cover type === 'pre_charge'.

**open_now / instant_bookable / deals / walk_in filter pills never reach the URL or the API**  
`silent-no-op` · `app/[locale]/behandlungen/[...slug]/page.tsx:105` · confidence ?  
- Impact: User taps 'Geoffnet jetzt', 'Sofort buchbar', 'Deals', or 'Walk-in' on a treatment/category page. The pill visually activates and a chip appears, but the results list never actually changes.
- Fix: Add branches in handleFilterChange for 'open_now','instant_bookable','deals','walk_in' that set URL params, read them in fetchResults, forward to /api/search/treatments, and implement matching server-side filters (opening_hours, walk_in_enabled, discount_percent, instant-booking flag).

**availability (date) / online_payment / off_peak filters are written to the URL but fetchResults never reads or sends them**  
`silent-no-op` · `app/[locale]/behandlungen/[...slug]/page.tsx:59` · confidence ?  
- Impact: User picks 'Today'/'Tomorrow' under Availability, or toggles Online Payment / Off-peak. The URL updates and the chip shows active, but the GET to /api/search/treatments is unaffected - unavailable-today, non-online-payment, and peak-time salons still show up.
- Fix: Read date/online_payment/off_peak from searchParams inside fetchResults, forward them to the API, and add matching params + filtering logic (availability slots, accepts_online_payment column, peak-hours definition) to the route.

**Rating filter (min_rating) is sent to the API but the route never reads or applies it**  
`silent-no-op` · `app/api/search/treatments/route.ts:11` · confidence ?  
- Impact: User selects the '4.5+' rating filter; the chip shows active and min_rating=4.5 is sent, but no rating threshold is ever applied - salons with a 3.0 or 2.0 rating keep appearing in a list the user believes is restricted to 4.5+.
- Fix: Read min_rating from searchParams and add salonQuery = salonQuery.gte('average_rating', parseFloat(min_rating)) when present.

**Sort dropdown values (rating/price/newest/distance) don't match the API's expected sort strings - selecting any option produces the same default ordering**  
`silent-no-op` · `app/api/search/treatments/route.ts:83` · confidence ?  
- Impact: The sort dropdown offers 'Sort by rating/price/newest/nearest' as 4 distinct choices, but picking price/newest/distance produces identical ordering to the untouched default (rating desc) - the price sort never actually reorders by price.
- Fix: Map subId -> API sort vocabulary ('price_asc','rating_desc') before it hits the URL, and implement real 'newest' (created_at) and 'distance' (needs lat/lng, unsupported today) cases server-side or remove them from the picker until built.

**Personalized salon recommendations query selects nonexistent columns, silently disabling personalization for every logged-in user**  
`silent-no-op` · `app/api/salons/recommendations/route.ts:56` · confidence ?  
- Impact: Every logged-in user with saved quartier/service preferences gets the generic "popular" salon list instead of a personalized one on the homepage NearbySection widget (confirmed wired in components-legacy/home/NearbySection.tsx). Personalization here has never worked.
- Fix: Select the real columns (favorite_quartier_ids, favorite_service_slugs), check/log the query error instead of discarding it, and apply a filter for favorite_service_slugs (currently would still be unused even after the column-name fix, since only favorite_quartiers is applied to the query at line 69-71).

**Barber P&L weekly chart labels 8 distinct weeks with a non-ISO 'KW' formula that collides across month boundaries, silently overwriting whole weeks of revenue**  
`date-timezone` · `app/api/dashboard/barber/pl-comparison/route.ts:74` · confidence ?  
- Impact: The 'scheduled vs walk-in revenue' weekly bar chart on the live barber-ops dashboard (mounted at app/[locale]/dashboard/barber-ops/page.tsx, rendered via components-legacy/dashboard/barber/PLComparison.tsx which fetches this exact endpoint) silently drops multiple weeks of revenue. Confirmed live: PLComparison.tsx line 128 renders `weekly` directly into the BarChart with no de-dup guard, so whatever the API returns is what the owner sees.
- Fix: Key weeklyMap by an unambiguous monotonic identifier (ISO year-week or the raw weekStart date string) instead of the repeating 'KWn' label; derive the display label separately at render time.

**Staff time-off/break entries never invalidate already-generated availability_slots, so approved leave does not retroactively block existing bookable slots**  
`broken-flow` · `app/api/staff/time-off/route.ts:70` · confidence ?  
- Impact: Confirmed at the code level: generate-slots cron only skips off-dates at generation time (app/api/cron/generate-slots/route.ts), POST /api/staff/time-off and POST /api/staff/breaks only INSERT the new row with no touch to availability_slots, POST /api/bookings only checks availability_slots.status='available' (app/api/bookings/route.ts line 154-174) with no re-check against staff_time_off/staff_breaks, and purge-slots cron only deletes past unbooked slots. However, a repo-wide grep found ZERO frontend references to staff_time_off/staff_breaks or any 'time off' UI anywhere in app/ or components-legacy/ (only the API route files and generated DB types reference these tables). There is currently no button or page in the product that lets an owner or staff member create a time-off/break entry, so this exact repro path is not reachable through any UI in this codebase today; it would require a direct API call (e.g. from a mobile app not in this repo, which I could not inspect).
- Fix: On time-off/break create, run the same skip logic against currently-existing future availability_slots for that staff member/date range and flip 'available' rows to 'blocked', or have the booking route re-validate against staff_time_off/staff_breaks at booking time as a safety net.

**last-minute deals endpoint ignores salons.last_minute_window_hours, discounting every future slot regardless of distance**  
`money-math` · `app/api/slots/last-minute/route.ts:24` · confidence ?  
- Impact: A salon configures its last-minute discount to apply only within a short window (e.g. 6 hours before the slot, via dashboard Settings), but the customer-facing 'Last Minute' feed discounts every future available slot at that salon regardless of how far away it is, undercutting the salon's intended margin control.
- Fix: Select last_minute_window_hours alongside the other salon fields and filter (or post-filter) so only slots with starts_at within their own salon's window get returned/discounted.

**Registered-user account deletion never checks the deleting user's own pending bookings or active disputes before wiping identity from them**  
`broken-flow` · `app/api/profile/request-deletion/route.ts:64` · confidence ?  
- Impact: Both request-deletion/route.ts (lines 61-87) and delete/route.ts (lines 18-38) only guard against the user owning a SALON with active bookings; neither checks the user's own customer-side bookings (status confirmed/pending) or open booking_disputes (reporter_id/reported_id/requested_by_user_id = user.id, non-terminal status). The BEFORE DELETE trigger in supabase/migrations/20260602083300_financial_retention_on_delete.sql (lines 210-240) unconditionally nulls user_id and redacts guest_name/guest_email/guest_phone on ALL of that user's bookings, and unconditionally nulls reporter_id/reported_id/requested_by_user_id/resolved_by plus wipes customer_response/description on ALL their disputes, with zero status check. The cron (process-deletions/route.ts) also re-checks nothing at the 30-day mark.
- Fix: Add a guard mirroring the existing salon-owner check in both routes: block deletion (or require explicit confirm) if bookings.user_id = user.id AND status IN ('confirmed','pending') exists, or if booking_disputes exists with reporter_id/reported_id/requested_by_user_id = user.id AND status NOT IN terminal states. Re-check the same condition in the cron immediately before calling deleteUser.

**welcome-series marketing emails ignore the deals_enabled opt-in default because the preferences table is never written to**  
`edge-case` · `app/api/cron/welcome-series/route.ts:43` · confidence ?  
- Impact: Every new customer receives all 3 promotional welcome emails regardless of marketing consent, because the opt-out check can never trigger (no row ever exists to trigger it), and semantics are inverted relative to the sibling opt-in route.
- Fix: Flip to opt-in semantics matching off-peak (`if (!prefs || prefs.deals_enabled !== true) continue;`) if welcome emails should respect consent, or remove the dead check and document welcome emails as transactional/consent-exempt. Either way, ship the missing settings UI/route so users can actually write to notification_preferences.

**Go-live gate checks only that a Stripe Connect account ID exists, not that onboarding actually finished**  
`silent-no-op` · `app/api/salon/go-live/route.ts:28` · confidence ?  
- Impact: A salon can go live (is_active=true, bookable/visible in search) while charges_enabled/payouts_enabled are still false on the Stripe account, so online-payment bookings at that salon get rejected.
- Fix: In go-live/route.ts (GET line 28-31, POST line 57-59) and setup-progress/route.ts:74, check salons.accepts_online_payment (or call stripe.accounts.retrieve and require charges_enabled && payouts_enabled) instead of the raw stripe_account_id truthiness.

**Staff earnings and salon/staff analytics count refunded and disputed bookings as full revenue**  
`money-math` · `app/api/earnings/staff/route.ts:40` · confidence ?  
- Impact: Owner-facing revenue and staff-commission figures are overstated by any refunded amount; a staff member's commission can be computed on money that was refunded to the customer.
- Fix: In all four endpoints, exclude bookings with payment_status='refunded' and subtract refunded_amount for 'partially_refunded' rows before summing revenue/commission.

**Deleting a staff placeholder does not invalidate its still-pending invite, letting a removed hire self-reinstate as staff**  
`broken-state` · `app/api/staff/accept-invite/route.ts:76` · confidence ?  
- Impact: An owner who removes a staff placeholder after sending its invite cannot actually revoke that access; the invited person can still accept the old invite up to 7 days later and get created as a brand-new active staff_members row.
- Fix: Add cascade invalidation: when a staff_members row with a pending matching invite is deleted, mark that staff_invites row 'revoked' (requires adding a linking column, e.g. staff_member_id, since none exists today). Add a DELETE/cancel action on /api/staff/invite, and have accept-invite reject revoked invites.

**Confirmation page shows German service name to fr/it customers**  
`i18n` · `app/[locale]/confirmation/page.tsx:108` · confidence ?  
- Impact: A French or Italian customer who just paid lands on their own confirmation page and sees the service name in German (e.g. 'Herrenhaarschnitt'), right after the highest-trust moment in the flow.
- Fix: Add name_fr/name_it columns and populate, or fall back to name_en instead of name_de for fr/it as a stop-gap. Same pattern repeats in SalonResultCard.tsx (confirmed at lines 220 and via services?.[`name_${locale}`] pattern), and lib/bookings/notify-refund.ts / notify-upcharge.ts (confirmed, see i18n-3).

**Salon-owner onboarding wizard renders raw translation keys for fr/it**  
`i18n` · `messages/fr.json:758` · confidence ?  
- Impact: A French or Italian salon owner going through the mandatory setup wizard sees literal strings like 'onboarding.setup.saveAndContinue' on the Continue button of every step, plus break/category/team-field labels, on their very first flow on the platform.
- Fix: Add the 13 missing onboarding.* keys to messages/fr.json and messages/it.json. Add a CI key-diff check across all locale files.

**In-app refund/upcharge/no-show-fee notifications are hardcoded German regardless of customer locale**  
`i18n` · `lib/bookings/notify-refund.ts:91` · confidence ?  
- Impact: A French, Italian, or English customer who gets a refund, an approved upcharge, or a no-show fee sees a German-language notification row ('Rückerstattung verarbeitet' / 'Aufpreis berechnet' / 'Nichterscheinen-Gebühr berechnet') even though the paired email to the same person correctly resolves to their own locale.
- Fix: Build a Record<EmailLocale,string> for each notification's title/body, indexed by the already-resolved locale variable at each of the three call sites, matching the pattern used for the email templates.


## MEDIUM

**Legacy PATCH cancel branch charges a fixed platform-wide 24h/50% late-cancel fee instead of the salon's actual configured cancellation policy**  
`money-math` · `app/api/bookings/[id]/route.ts:21` · confidence ?  
- Impact: A customer cancelling through this endpoint gets a refund/fee computed off hardcoded platform constants rather than the salon's own cancellation_fee_type/value/free_cancel_hours, so any salon whose real policy differs from the 24h/50% default has its customers refunded or charged the wrong amount.
- Fix: Retire this legacy branch in favour of the canonical /cancel route, or call calculateCancellationFee(salon.cancellation_fee_type, salon.cancellation_fee_value, salon.free_cancel_hours, ...) instead of the hardcoded constants.

**create_group_booking RPC never verifies a member's slot_id actually belongs to the salon the group booking is attributed to**  
`broken-state` · `supabase/migrations/071_megabuild_booking_crm_payments.sql:138` · confidence ?  
- Impact: A group booking can be inserted with bookings.salon_id = p_salon_id while its slot_id belongs to a different salon's staff calendar; that other salon's slot silently flips to 'booked' with no visible booking under their own salon_id, producing an invisible, unmanageable hold on their calendar.
- Fix: Add `AND salon_id = p_salon_id` to the slot lookup/lock in create_group_booking (or explicitly raise when slot.salon_id != p_salon_id) before inserting the booking row, and fix the route's dead salon-existence check to actually branch on the result.

**payment_intent.succeeded webhook can downgrade a pre-charged booking from payment_status='paid' back to 'deposit_held' with no ordering guard, causing a later cron to attempt a re-capture that Stripe will reject**  
`broken-state` · `app/api/stripe/webhook/route.ts:179` · confidence ?  
- Impact: A booking captured via pre-charge can end up permanently stuck at payment_status='deposit_held' despite the money already being fully captured, and release-payments cron (queries payment_status='deposit_held', then calls paymentIntents.capture()) will repeatedly fail against an already-captured PI for that booking.
- Fix: Add the same advance-only guard used elsewhere in this file (e.g. `.in('payment_status', ['pending','none','card_saved'])`) to the else-branch update at lines 179-183.

**Orphaned /checkout page applies promo/voucher discounts only to the displayed total, never to the actual Stripe charge**  
`money-math` · `app/[locale]/checkout/page.tsx:349` · confidence ?  
- Impact: If reached (via a hand-built booking_intent URL; confirmed orphaned, grep for booking_intent/'/checkout?' across app/components-legacy/lib returns zero constructors outside the page itself), applying a promo or voucher code recomputes and displays a discounted 'Jetzt zu zahlen' total (line 349, shown at 471/485/512), but the PaymentIntent's clientSecret was created once at mount (lines 159-184) from the pre-discount chargeAmount and is never recreated or updated. CheckoutForm's stripe.confirmPayment (line 69) confirms that original, undiscounted PaymentIntent. The customer sees and believes a lower charge but is billed the full pre-discount amount.
- Fix: Either delete the orphaned page and its dead create-payment-intent caller (the real flow uses /api/stripe/booking-pay-intent), or recreate/update the PaymentIntent amount whenever promoResult/voucherResult change before allowing payment.

**toggle_discovery_like / toggle_discovery_save use non-atomic check-then-act, causing like_count/save_count to under-decrement on a rapid double-tap**  
`concurrency` · `supabase/migrations/067_discovery.sql:193` · confidence ?  
- Impact: A rapid double-tap/double-click on the like or save heart (LikeButton.tsx has no in-flight guard or disabled state on the button, confirmed at components-legacy/discovery/LikeButton.tsx lines 66-78 and the fetch in app/api/discovery/like/route.ts) can silently over-decrement the public like_count/save_count shown on cards.
- Fix: Make the toggle atomic: INSERT ... ON CONFLICT DO NOTHING RETURNING *, or SELECT ... FOR UPDATE to serialize, and only adjust the counter when the DELETE/INSERT actually affected a row (check row count, don't assume the branch always succeeds). Add a client-side in-flight guard (disable the button while a request is pending) in LikeButton.tsx.

**Discovery feed offset pagination can duplicate/skip cards when new content is published mid-scroll, because sort_order is a dead always-0 column**  
`edge-case` · `supabase/migrations/20260625_discovery_feed_tags_any.sql:57` · confidence ?  
- Impact: A user scrolling the Inspo feed shortly after an admin publishes new content (bulk-import or TikTok import) can see the same card twice across a page boundary, or briefly miss one.
- Fix: Switch to cursor-based (keyset) pagination on (created_at, id) instead of OFFSET/LIMIT so page boundaries anchor to content already seen. If per-item editorial ranking is still wanted, sort_order needs to actually be populated by a curation flow; today it is inert for every row.

**Staff self-service schedule/breaks/time-off endpoints run under the RLS-enforced session client, but the only live RLS policy on staff_schedules/staff_breaks/staff_time_off grants access to the salon owner only**  
`broken-flow` · `app/api/staff/my-schedule/route.ts:29` · confidence ?  
- Impact: Confirmed live against the fresh DB RLS snapshot (_inventory/_rls-policies.json, generated 2026-07-07): staff_schedules, staff_breaks, and staff_time_off each have exactly one policy (cmd=ALL, USING salon_id IN (SELECT salons.id FROM salons WHERE owner_id = auth.uid())) -- no self-staff policy exists. app/api/staff/my-schedule/route.ts, app/api/staff/breaks/route.ts, and app/api/staff/time-off/route.ts all query these tables with the session-scoped (non-admin) client, so a real non-owner staff account would get empty reads and RLS-rejected writes. However, tracing the actual UI: DashboardLayout.tsx's STAFF_NAV links 'myBreaks' to /dashboard/my-breaks, which has no page.tsx anywhere in app/ (confirmed via find) -- the link 404s before any API call happens. GET /api/staff/my-schedule is only invoked from components-legacy/onboarding/steps/ScheduleStep.tsx, which runs during the SALON OWNER's onboarding (owner_id === auth.uid(), so the owner-only RLS policy actually passes for that caller). No live code path in this repo has a genuine non-owner staff session hitting these self-service endpoints today.
- Fix: Add a staff-self-access RLS policy scoped to staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid()) for these three tables, or switch these already-application-gated routes to the admin client. Separately (out of scope for this finding but discovered while verifying it): /dashboard/my-breaks has no page, so the staff self-service nav entry is currently a dead link regardless of the RLS issue.

**resequence_walkin_queue() unique-constraint violation whenever an in_chair customer coexists with a waiting-list departure, leaving queue positions permanently uncompacted**  
`silent-no-op` · `supabase/migrations/20260531_walkin_resequence_fn.sql:8` · confidence ?  
- Impact: Every time a walk-in leaves the line (completed/no_show/cancelled) while someone else is in_chair, the RPC throws 23505 and the error is silently swallowed (still 200 response). Waiting-list position values never compact, and public queue endpoints show stale/gapped ordering instead of a clean depth.
- Fix: Rank over both statuses together (WHERE status IN ('waiting','in_chair')), keeping in_chair rows at their lowest positions, or only renumber waiting rows starting after the max in_chair position, so reassigned values never collide with an untouched in_chair row.

**No expiry/no-show timeout for abandoned 'waiting' queue entries lets queue length and wait estimates drift upward forever if a customer leaves without cancelling**  
`edge-case` · `lib/barber/walkin-availability.ts:41` · confidence ?  
- Impact: A customer who joins the queue then simply walks away (no self-cancel, no staff action) is counted as 'waiting' indefinitely. Every consumer of live queue depth (availability cards, nearby band, queue-stats, tracker aheadCount) keeps counting the ghost entry, inflating 'X ahead of you' / wait estimates for real customers behind them until staff manually notice and mark the row no_show.
- Fix: Add a cron (mirroring existing app/api/cron/* pattern) that auto-marks barber_walkin_queue rows 'no_show' when status='waiting' and joined_at exceeds a grace period, then calls resequence_walkin_queue for the affected salon so counts self-heal.

**barber_loyalty_history inserts use phantom columns action/performed_by (and omit other NOT NULL columns) - the audit trail for every stamp and redeem is permanently empty**  
`silent-no-op` · `app/api/loyalty/stamp/route.ts:83` · confidence ?  
- Impact: Any customer-facing or owner-facing history/audit view backed by barber_loyalty_history is permanently empty despite real stamp/redeem activity, with no error surfaced anywhere.
- Fix: Rewrite both inserts to match the real schema (card_id, salon_id, customer_id, stamps_collected, reward_type, reward_value, completed_at/redeemed_at as applicable) or migrate the table to add action/performed_by if that's the intended audit shape; check insert errors.

**Loyalty QR token is a static, non-expiring HMAC with no nonce, cooldown, or single-use marker - the same QR can be rescanned repeatedly to award multiple stamps for one visit**  
`edge-case` · `lib/barber/loyalty-qr.ts:18` · confidence ?  
- Impact: Once the stamps_collected/stamps column bug (loy-1) is fixed and stamp writes actually persist, this design lets one physical visit be turned into multiple stamps: an accidental staff double-tap, a saved/screenshotted QR rescanned later the same day, or a colluding rescan all award additional stamps with no server-side dedup.
- Fix: Embed a short-lived timestamp/nonce into the signed QR payload (e.g. 2-5 minute TTL, regenerated each time the customer opens the QR screen) and/or add a server-side cooldown in the stamp route (reject a stamp if the same card was stamped within the last N hours), so one physical visit can only ever award one stamp.

**Weighted 3-dimension review score can produce a half-star rating that violates the reviews.rating integer column**  
`edge-case` · `app/api/reviews/route.ts:33` · confidence ?  
- Impact: A request that submits all three sub-dimension scores in a combination whose weighted average lands on X.5 fails the insert into reviews.rating with a raw 500 instead of a clean error. Dormant today because no frontend page sends these three fields, but reachable via a direct API call and will break real submissions the moment a 3-dimension rating UI ships.
- Fix: Alter reviews.rating to numeric(2,1) to actually support half-star granularity, or round the weighted score to a whole integer before insert if half-stars should not persist.

**Auto-moderation flags every rating-only review as too short, unlike the walk-in flow which correctly skips this check**  
`edge-case` · `lib/automod.ts:42` · confidence ?  
- Impact: A customer who submits a valid comment-less star rating gets is_flagged true with reason Sehr kurzer Kommentar. The review still shows publicly but pollutes the admin flagged-review queue with most ordinary rating-only reviews, burying real problems.
- Fix: In app/api/reviews/route.ts, only invoke checkReview when comment is present and non-empty, matching the walk-in flow's guard.

**Review-posted and review-replied transactional emails are hardcoded German only, unlike the fully-localized review-prompt cron**  
`i18n` · `app/api/notify/review-posted/route.ts:36` · confidence ?  
- Impact: A non-German-speaking salon owner or customer receives German-only transactional emails on every review or reply event regardless of their profile locale, inconsistent with the platform's de/en/fr/it i18n elsewhere.
- Fix: Fetch locale alongside email in both notify routes and branch subject and HTML through the same de/en/fr/it pattern used in the review-prompt cron.

**Signup route hardcodes the post-confirmation redirect locale to /de regardless of signup locale**  
`i18n` · `app/api/auth/signup/route.ts:50` · confidence ?  
- Impact: A non-German visitor who signs up via email gets a confirmation email (supabase/templates/confirmation.html, verified: link-only template, no OTP code shown, 'Klick uf de Button' with only {{ .ConfirmationURL }}) whose link always routes to /de or /de/onboarding/salon after exchangeCodeForSession, regardless of the locale they signed up from. The sibling login route (login/route.ts:30-33) already derives locale from the Referer header for its own reset-password redirect, confirming this is a real, fixable inconsistency rather than an intentional design.
- Fix: Derive locale in signup/route.ts the same way login/route.ts does (match Referer header against /(de|en|fr|it)/) and interpolate into redirectPath instead of hardcoding /de.

**TOS acceptance is never enforced before booking creation; accept-tos also accepts any client-supplied version string without validation**  
`broken-flow` · `app/api/bookings/route.ts:1` · confidence ?  
- Impact: grep across app/api/bookings/route.ts confirms zero references to tos_accepted_version/tos_accepted_at/CURRENT_TOS_VERSION; a profile with tos_accepted_version=NULL can create a booking with no gate. Separately, app/api/profile/accept-tos/route.ts (lines 19-31) writes whatever tos_version string the client sends with no comparison to CURRENT_TOS_VERSION, unlike the sibling app/api/tos/accept/route.ts:30 which does validate. The TOS acceptance tracked in profiles is consumed only by the admin notify-of-outdated-TOS cron (app/api/admin/tos/notify/route.ts), never as an actual gate anywhere in the booking flow.
- Fix: Add a check in the booking-creation route requiring profiles.tos_accepted_version === CURRENT_TOS_VERSION before allowing booking creation. Make profile/accept-tos/route.ts validate tos_version against CURRENT_TOS_VERSION like its sibling route, or consolidate the two duplicate TOS-accept endpoints into one.

**rebooking_enabled opt-out is unreachable dead code in rebooking-nudge and nail-infill-reminders (no write path exists)**  
`silent-no-op` · `app/api/cron/rebooking-nudge/route.ts:63` · confidence ?  
- Impact: Customers can never actually turn off rebooking-nudge or nail-infill reminder emails, even though the code checks for an opt-out and the schema supports it, because the preferences table is permanently empty.
- Fix: Ship the missing notification-preferences settings UI + PATCH/POST route. Until then this is default-on-with-no-opt-out functioning as an incomplete feature, not a crash, but should be tracked as such.

**birthday-messages cron sends a hardcoded German-only email to every user regardless of their locale**  
`i18n` · `app/api/cron/birthday-messages/route.ts:48` · confidence ?  
- Impact: French, Italian, and English-speaking customers with a birthday today receive a German-language birthday email, unlike every other notification cron in the codebase which selects profile.locale and branches templates.
- Fix: Add locale to the profiles select, default to 'de', and route through de/en/fr/it template variants matching the pattern used by welcome-series.ts and salon-onboarding.ts.

**Benchmarks percentile includes the salon's own row in the comparison population, self-inflating the reported ranking**  
`edge-case` · `app/api/analytics/benchmarks/route.ts:30` · confidence ?  
- Impact: Owners see a benchmark percentile that is mathematically biased in their own favor versus a benchmark that correctly excludes the salon itself.
- Fix: Add .neq('id', salonId) to the allSalons query and skip salonId inside the bookingCounts loop, so belowRating/belowBooking/belowReviews and their denominators are computed strictly over other salons.

**CSV service import assigns sort_order values that collide with an existing manually-reordered service list**  
`edge-case` · `app/api/services/import/route.ts:82` · confidence ?  
- Impact: After a CSV import, an owner who had previously drag-reordered services sees imported services interleave into the middle of the existing order instead of appending at the end, because duplicate sort_order values get tie-broken by recency.
- Fix: Before building servicesToInsert, query MAX(sort_order) for the salon and offset every imported row by that value (sort_order: maxExisting + i) so imports always append after the existing list.

**Search-result service duration always shows German unit abbreviations (Min./Std.) regardless of viewer locale**  
`i18n` · `app/[locale]/_components/search/SalonResultCard.tsx:143` · confidence ?  
- Impact: Every French, Italian, and English user browsing search results sees service durations with German abbreviations (e.g. '45 Min.', '1 Std. 30 Min.') on a high-frequency surface (every salon card, every search feed) while the rest of the card is correctly localized.
- Fix: Add a locale parameter to formatDuration and branch unit strings the same way the adjacent Record<string,string> labels already do in this file.

**Next-available-slot weekday abbreviation hardcoded German beyond today/tomorrow**  
`i18n` · `lib/format.ts:143` · confidence ?  
- Impact: A French or Italian user sees a German weekday abbreviation ('Mi.', 'Do.', 'Fr.') in the 'next available slot' label on search cards whenever the next opening is more than a day out, despite today/tomorrow correctly localizing to 'auj.'/'demain' or 'oggi'/'domani' right above it in the same function.
- Fix: Add per-locale weekday-abbreviation Records (fr: mer./jeu./ven..., it: mer/gio/ven...) indexed the same way NEXT_SLOT_TODAY/NEXT_SLOT_TOMORROW already are.


## LOW

**Stale comment in /api/promo/validate falsely claims booking-pay-intent ignores promos**  
`swallowed-error` · `app/api/promo/validate/route.ts:76` · confidence ?  
- Impact: No direct user impact; misleads maintainers. The comment at line 76 says 'booking-pay-intent ignores promos' and this validate endpoint is 'the only value-granting surface today,' but app/api/stripe/booking-pay-intent/route.ts lines 212-249 fully re-validates (active/date window/max-uses/min-amount/salon/min_tier) and applies the same promo server-side, duplicating the min_tier gate. A maintainer trusting the stale comment could miss that the two gates must stay in sync.
- Fix: Update the comment in app/api/promo/validate/route.ts to state that booking-pay-intent now re-validates and applies the promo server-side, and that this endpoint is display-only.

**price_asc sort paginates by rating before re-sorting by price client-side - but this branch is currently dead code, unreachable by any caller in this repo**  
`edge-case` · `app/api/search/treatments/route.ts:94` · confidence ?  
- Impact: IF something ever sends the literal sort=price_asc (a direct API call, or once sf-4 is fixed by mapping the UI's 'price' subId to 'price_asc'), the true cheapest salon in a category with more than `limit` salons could be excluded from page 1 because salonQuery orders by average_rating desc and applies .range() BEFORE the client-side price sort at lines 116-118 only reorders the already-paginated batch.
- Fix: When sf-4 is fixed to send 'price_asc', also fix this: fetch all matching salon ids without a DB-side .range(), compute min_price for the full set, sort, then slice the requested page in JS - or materialize min_price as a column sortable at the DB level before pagination.

**A double-submit race on review creation surfaces a raw Postgres unique-violation error instead of the friendly already-reviewed response**  
`edge-case` · `app/api/reviews/route.ts:79` · confidence ?  
- Impact: Two near-simultaneous review submissions for the same booking can both pass the pre-insert existence check, so the losing insert hits the unique constraint on booking_id and returns a raw 500 with the Postgres message instead of the friendly 409 already-reviewed response the sequential path returns. No data corruption occurs, only a worse error surface in a narrow race window.
- Fix: Special-case Postgres error code 23505 on the reviews insert the same way app/api/reviews/reply/route.ts already does, returning the 409 already-reviewed response instead of a generic 500.

**sms-reminders has no atomic claim step, so an overlapping/retried run can double-send the same SMS**  
`edge-case` · `app/api/cron/sms-reminders/route.ts:69` · confidence ?  
- Impact: If two invocations of this cron overlap (GitHub Actions retry, manual workflow_dispatch during a scheduled run, or a slow SMS API call), both could send the same reminder SMS to a customer before either marks the booking as sent.
- Fix: Add a WHERE guard re-asserting the pre-send state on the UPDATE (e.g. `.eq('sms_sent_24h', false)`), matching the CAS pattern already used in abandon-sweep, so a second concurrent run matches 0 rows instead of re-sending.

---

## SESSION FIX LOG , 2026-07-07 (Opus orchestrator + Sonnet coder/reviewer waves)

### FIXED + COMMITTED (each live-verified where a column/behavior claim was involved)
- **GDPR guest erasure wiped active-booking PII** , anonymize-guest now excludes pending/pending_approval/confirmed (Art 17(1)(a)). `lib/gdpr/anonymize-guest.ts`.
- **5 phantom-column / RLS-client no-ops** (commit 57944b1d8): loyalty/stamp (`stamps_collected`->`stamps`, status enum), loyalty/redeem (same), stripe/payment-methods (`full_name`->`display_name`), salons/recommendations (queried `user_preferences`, real cols), bookings/[id] PATCH cancel (admin client for slot free).
- **search/treatments min_rating + sort no-op** (f1319f60b) , read+apply min_rating (`.gte average_rating`); sort values now match the real client vocab (rating/price/newest/distance). Live-verified 8->4 with min_rating=4.5. NOTE: also resolves the "price_asc dead code" edge-case above (the branch now uses 'price').
- **earnings/staff counted refunded as full revenue** (f1319f60b) , exclude `refunded`, subtract `refunded_amount`/100 for `partially_refunded`.
- **confirmation showed German service name to fr/it** (f1319f60b) , de->name_de, all others->name_en (services has only name_de/name_en).
- **slot times stored as naive wall-clock -> displayed 2h off** (c41e41a1c) , bulk + single-POST + off-peak matcher + [id] PATCH now store/read true-UTC via zurichWallClockToUtc, matching the cron + the toLocaleTimeString read path. PATCH discriminates DnD (real instant) vs modal (naive) to avoid double-conversion.
- **auto-complete cron was a permanent no-op** (e2ed35fd0) , `salons.auto_complete_enabled` declared in migration 068 (DEFAULT true) but missing live (drift) -> .eq() errored, cron completed nothing every run. Column restored live (default true, 28 salons backfilled); error checks added. 10 stale confirmed bookings will clear next run.
- **refund in-app notification hardcoded German** (5471dbdb7) , REFUND_COPY locale map (de/en/fr/it). NotificationsClient renders n.title/n.body verbatim, so the locale was known but ignored.

### QUEUED , needs CARE (money) or a DECISION (not rushed at session tail)
- ~~**[MONEY] pre-charge cron charges GROSS, ignoring promo + tier discount.**~~ **FIXED 2026-07-07 (commit dd94ad60d).** Extracted the promo re-validation into `lib/promo/resolve-promo-discount.ts` (used by both booking-pay-intent and pre-charge); pre-charge now charges gross - promo, applies the member/tier waiver (reduces BOTH charge and fee, salon payout unchanged, mirroring booking-pay-intent step 6b), stores the actual charged amount, and increments promo current_uses exactly once (CAS-guarded, since the off-session PI's type:pre_charge bypasses the webhook increment). CORRECTION to an earlier note: the member/tier waiver reduces the CUSTOMER charge too (not only the commission), verified in lib/loyalty/perks.customerChargeRappen.
- ~~**[MONEY, latent, PRE-EXISTING] pre-charge PI reverted to `deposit_held` by the webhook.**~~ **FIXED 2026-07-07.** The webhook's `else` branch (`app/api/stripe/webhook/route.ts`) forced `payment_status:"deposit_held"` on ANY booking-linked PI whose type != "booking", including pre-charge's `type:pre_charge` PI, reverting the `paid` state pre-charge set synchronously (near-deterministic, webhook lands after the sync update). Guarded the else with `pi.metadata?.type !== "pre_charge"`.
- **[MONEY] earnings still counts `disputed` bookings as full revenue.** Out of scope of the refund fix; needs the dispute-engine's payment_status semantics.
- ~~**[FRONTEND] behandlungen filter pills never reach the API.**~~ **MOSTLY FIXED 2026-07-07 (commits 3fdac63dd + d29a4d22f).** quartier, online_payment, min_rating (rating->min_rating rename), and date now read+applied server-side (date via shared lib/search/resolve-availability.ts, the same salons_with_slot_in_hours RPC /api/salons uses; resolve-ids-first then .in before .range) AND forwarded from the frontend fetch; Today/Tomorrow pill now emits a real Zurich ISO date. Reviewer-verified live discrimination. REMAINDERS:
    - ~~**[DECISION] off_peak filter**~~ **DONE 2026-07-07 (commit f76ba9ba0).** Owner chose "active right now" semantics. New lib/search/resolve-offpeak.ts (Zurich-zoned; the per-salon reader was UTC-skewed), wired into /api/search/treatments + frontend. Predicate proven live via a temp seed. off_peak_slots is empty live so it returns empty until a salon configures a window.
    - **[followup] custom_date pill** is a no-op , there is no date-picker feeding a value. Needs a small date-picker wired to the availability pill's custom_date sub. (Today/Tomorrow works.)
    - ~~**[cleanup] TreatmentsClient.tsx is dead code**~~ **DONE 2026-07-07 (commit 154000f20)** , removed (0 importers), REMOVED.md logged.
- ~~**[DECISION] loyalty/award route has zero callers (dead).**~~ **PARTLY DONE 2026-07-07.** Not a dup , it feeds System A (loyalty_cards/loyalty_stamps), a DIFFERENT loyalty system from loyalty/stamp (barber_loyalty_*). Owner delegated the choice -> consolidate onto B. Removed the dead award route + schema (commit 154000f20). The live-data migration A->B + display repoint is scoped in [LOYALTY_CONSOLIDATION.md](LOYALTY_CONSOLIDATION.md) (careful, not rushed , lossy reward mapping + 4 read sites).
- ~~**[DECISION] welcome-series opt-in semantics.**~~ **DONE 2026-07-07 (commits fc2cec361 + 3592e5291).** Day 0 = transactional (always send); day 3/7 = promotional, OPT-IN (send only if notification_preferences.deals_enabled === true). Council caught that an opt-OUT check was dead code (the table has 0 rows + 0 writers), so flipped to opt-in. **OPEN [followup]: day 3/7 will NOT send to anyone until a consent-capture UI (settings toggle + PATCH route) writes deals_enabled=true. That UI is missing , build it to actually turn promo welcome emails on.**
- **[BLOCKED ON MISSING UI , a recurring pattern] three "enforce a gate that has no UI to satisfy it" bugs.** Can't just ship the server gate , it would break users:
    1. **bookings TOS enforcement** (`app/api/bookings/route.ts`): reverted 2026-07-08. Requiring `profiles.tos_accepted_version === CURRENT_TOS_VERSION` before booking would 403 EVERY logged-in booking , the column is NULL for all existing users (no default/backfill) and the only accept-TOS components (TosPrompt.tsx, TOSUpdateBanner.tsx) are DEAD CODE, mounted nowhere. Needs a checkout-mounted TOS-accept step wired to `/api/tos/accept` FIRST, then the guard can ship.
    2. **welcome-series day 3/7** , needs the marketing-consent toggle UI (deals_enabled has no writer). Off until it exists.
    3. **rebooking-nudge opt-out** , same missing consent UI (deals_enabled).
  Owner decision: build the missing settings UIs (marketing-consent toggle + a TOS-accept step), THEN these three gates go live. Until then they are correctly inert, not shipped-broken.
- **[ORPHANED PAGE #2 , owner decision] `/checkout` looks dead like behandlungen was.** `app/[locale]/checkout/page.tsx` exists but NOTHING in the real flow links to it (grep: only its own `return_url` + two `/dev` mockups reference it; not in sitemap). The real booking payment goes through `salon/[slug]/booking` (booking-pay-intent + PayConfirmStep). The P3 report flagged it as "orphaned /checkout applies promo/voucher discount only to the displayed total". So it's a candidate KILL (not fix), same as behandlungen , but verify thoroughly (render it, confirm no Stripe redirect reaches it) + get an owner yes before deleting a payment page.
- **[LOW, pre-existing] ilike wildcard injection** in `app/api/search/treatments/route.ts` (and /api/salons): user `city`/`treatment`/`quartier` are interpolated into `.ilike("...", %${x}%)` without escaping `%`/`_`, so a user can widen/narrow their own search with wildcards. Not SQL injection (supabase-js parameterizes the value), low impact, PRE-EXISTING (not introduced this session). Fix = escape `%`/`_` in the interpolated fragments.
- **[CONSISTENCY] notify-upcharge / notify-no-show-fee / notify-purchase-refund** share the same hardcoded-German in-app title/body notify-refund had , same mechanical fix, queued.
- **[EDGE] reviews double-submit 23505 -> raw 500** (`app/api/reviews/route.ts:79`): map unique-violation to the friendly 409, like reviews/reply already does.
- **[EDGE] sms-reminders no atomic claim** (`app/api/cron/sms-reminders/route.ts:69`): add a CAS `.eq('sms_sent_24h', false)` guard like abandon-sweep.
- **[DOC] stale comment** in `app/api/promo/validate/route.ts:76` (says booking-pay-intent ignores promos; it re-validates+applies). Update to display-only.
