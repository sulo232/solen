# Deep Audit Report , Backend + Claude Estate

**2026-07-11**

This is the full result of the 25-bucket exhaustive audit ordered this session: every backend route, the database, and the whole Claude Code enforcement estate (hooks, skills, rules, memory, plans). After removing duplicates and adding this session's own manual perf scan, this report holds **177 real findings**: **1 critical**, **35 high**, **62 medium**, **76 low/hygiene**, plus **24 already-tracked** items you already know about and **13 places nobody has checked yet**. The single most important thing: a live money bug where the Stripe webhook (`app/api/stripe/webhook/route.ts:211`) silently downgrades a pre-charged booking's status from `paid` back to `deposit_held`, and the refund code (`lib/bookings/issue-refund.ts:121`) then refuses to refund anything that isn't `paid`, so genuinely captured money can only be returned by hand in the Stripe dashboard.

## How to read this

**Severity**: critical = losing money or leaking data right now. high = a real bug or a security gap. medium = something that's wrong or slow but not urgent. low = cleanup, dead code, small drift. **Effort**: S = under half a day, M = half a day to a day, L = bigger than that.

Every finding below was independently re-checked by a second, skeptical AI pass that re-read the actual code before agreeing it was real (this is what "verdict CONFIRMED" means under the hood). A finding tagged **[known]** was already written down in an earlier audit, so it's not new, just resurfaced here so nothing falls through the cracks. A finding tagged **[unverified]** could not be fully re-checked with read-only tools, but is included because it's high-severity enough to be worth your attention regardless.

---

## CRITICAL (fix now)

### 1. A pre-paid booking's money gets silently marked "not refundable" even though it was genuinely charged

**Where**: `app/api/stripe/webhook/route.ts:211` (the generic `payment_intent.succeeded` handler), caused by an interaction with `app/api/cron/pre-charge/route.ts:88-96`

**What**: For "pay 5 days before your appointment" bookings, a nightly cron job charges the customer's card and correctly marks the booking `paid`. Stripe then sends its own confirmation webhook for that same charge a moment later. But the webhook code only recognizes a charge as "this is a real booking payment" when a specific metadata tag says `type: booking`. The pre-charge cron's charges are tagged `type: pre_charge` instead, so the webhook falls into a fallback branch that resets the booking's payment status from `paid` back to `deposit_held`, even though Stripe genuinely captured the money.

**Why**: Every one of these bookings becomes stuck: the refund code explicitly refuses to refund anything that isn't in the `paid` state, so if the customer cancels or the salon needs to issue a refund, the system says "not a captured payment" even though Stripe is holding real, captured money. The salon and customer are both stuck relying on someone manually fixing it in the Stripe dashboard.

**Fix**: In the webhook, skip the status-downgrade for any payment tagged `pre_charge` (or any of the other off-session charge types), since the cron already set the correct status itself. A one-line check.

**Effort**: S

---

## HIGH

### 3. A salon owner can attach a private note or a fake allergy record to any stranger's account

**Where**: `app/api/client-notes/route.ts:64` (POST) and `app/api/clients/[id]/nail-preferences/route.ts` (PUT, lines 55-101)

**What**: Every other client-record endpoint in the app (formulas, nail history, photos, intake) checks that the customer id you're writing to has actually been a client at your salon, using a shared helper called `clientBelongsToSalon`. These two routes skip that check entirely. They only verify that you own *a* salon, then let you attach a note, or an allergy/skin-sensitivity record plus a red flag tag, to literally any user id you type in, whether that person has ever set foot in your salon or not.

**Why**: Customer and salon ids show up all over public pages (booking links, reviews, salon pages), so anyone who owns any salon on the platform, even one created purely to abuse this, can write a defamatory note or a fabricated allergy/medical record onto a stranger's account.

**Fix**: Add the same `clientBelongsToSalon` check the sibling routes already use, before the insert/upsert in both files.

**Effort**: S

---

### 4. Admin "suspend user" doesn't actually block anything

**Where**: `app/api/admin/users/route.ts:56`

**What**: Clicking "Suspend" on a user in the admin dashboard sets a column called `is_suspended`. But the actual gate that every one of roughly 90 routes checks before letting someone book, review, or post is a completely different column, `banned_at`, which nothing anywhere in the codebase ever writes to.

**Why**: An admin believes they've blocked a bad actor. In reality, that person can keep booking, paying, and posting reviews with zero restriction, because the moderation control that looks live is disconnected from the real enforcement mechanism.

**Fix**: Change the suspend action to write `banned_at`/`ban_reason` (the columns `checkUserBanned()` actually reads), and add an audit log entry since banning someone is a sensitive action.

**Effort**: M

---

### 5. The AI "roadmap generator" tells future code to use the exact login pattern that caused this project's biggest security bug

**Where**: `lib/editor-prompts.ts:83`

**What**: Months ago, this project found and fixed a critical bug where routes checked a user's identity using `getSession()`, which trusts a cookie without verifying it against Supabase's servers. The whole codebase was migrated off it, and a tool was built specifically to block anyone from reintroducing it. But the prompt fed to Gemini when an admin uses the "generate a roadmap" AI feature literally instructs it, as a mandatory step, to use `getSession()`.

**Why**: If an admin uses this AI tool to plan a new feature, the AI-authored code it produces will re-teach the exact security bug the project spent significant effort removing.

**Fix**: Update the prompt text to say `getUser()` instead.

**Effort**: S

---

### 6. An admin photo-import feature can be used to probe your internal network (and skips validation)

**Where**: `app/api/admin/discovery/smart-import/route.ts:44`, `app/api/admin/discovery/backfill/route.ts:132`

**What**: The "import" action of this admin tool stores a photo URL straight from the request with no validation of its shape at all. Separately, a related backfill route fetches that stored URL directly, without using the project's own "is this URL safe to fetch" guard that every other AI-vision code path uses.

**Why**: This is the same category of bug already fixed elsewhere on this project: a server that fetches an admin-controlled URL and reports back whether it succeeded or failed can be used to probe internal-only addresses (a classic SSRF port-scanning trick), because the fetch result leaks back to whoever triggered it.

**Fix**: Add basic URL validation to the smart-import photos field, and call the existing `assertSafeFetchUrl` guard before the backfill route's own fetch.

**Effort**: S

---

### 7. Salon reply-to-review feature has been completely broken end to end, silently

**Where**: `app/api/reviews/[id]/respond/route.ts:50` (root cause), with downstream effects at `app/api/dashboard/batch/route.ts:73`, `app/api/notifications/route.ts:56`, and `app/api/cron/daily-digest/route.ts:122-127`

**What**: The only working "reply to a review" endpoint requires a field called `reply_text` in the request. The actual dashboard UI never sends that field, it sends a differently-named one instead. Every real reply attempt gets rejected with an error the dashboard UI doesn't even check for, so it silently behaves as if the reply saved. That means this is genuinely the only way for a salon to reply to a review at all right now, and it never works.

On top of that, three separate places (the owner dashboard's "pending replies" counter, the customer notification system, and the nightly digest email) all check for a reply using an old database column that a real reply, once the bug above is fixed, will never actually update. So even after the 400 error is fixed, all three of these will keep saying "still needs a reply" forever, even after a salon has replied.

**Why**: This is a customer-trust-and-retention feature (salons responding to reviews) that has silently never worked, and the internal reporting around it will keep lying about it even once the direct bug is fixed.

**Fix**: Make the missing field optional in the validation schema (or accept either name), and add a check in the dashboard so a failed save is never silently swallowed again. Separately, change the three "pending reply" checks to look at whether a reply row exists in the newer table, not the old column.

**Effort**: M

---

### 8. Two public portfolio pages (barbers and nail techs) are completely broken

**Where**: `app/api/barber/[slug]/portfolio/route.ts:37`, `app/api/nail-tech/[id]/portfolio/route.ts:30`

**What**: Both routes filter photos using a column name (`staff_member_id`) that does not exist on that table; the real column is named `staff_id`. Every database call with the wrong column name fails outright.

**Why**: This isn't a silent data gap, it's a hard error: both public portfolio pages return a server error for every barber and every nail tech on the platform, all the time.

**Fix**: Change both filters to use `staff_id`.

**Effort**: S

---

### 9. A salon can send a phishing-style email to everyone who favorited them

**Where**: `app/api/off-peak/route.ts:144`

**What**: When a salon sets up an "off-peak deal" alert, the email that goes out to everyone who favorited that salon includes the salon's own name pasted directly into the HTML with no escaping. A near-identical bug was already fixed on a sibling route, but this one was missed. There's also no per-salon limit on how often this broadcast can be triggered.

**Why**: A salon owner can set their salon's display name to a malicious HTML/script snippet, then trigger this alert to have Solen's own trusted email system deliver that payload to every customer who favorited them, and can repeat this as often as they like.

**Fix**: Escape the salon name (and other inserted fields) the same way the sibling route already does, and add a per-salon rate limit on the broadcast.

**Effort**: S

---

### 10. Two nightly reminder crons write notes that the database always rejects

**Where**: `app/api/cron/nail-infill-reminders/route.ts:103`, `app/api/cron/barber-smart-reminders/route.ts:125-149`

**What**: Both crons build a client-note row with values (`note_type`, `created_by`) that violate the actual database rules for that table (an invalid category value, and a required field left null or set to the literal text "system" instead of a real user id). Every insert fails. Both crons only log the error quietly and still report themselves as successful, incrementing their own "reminders created" counter before the write even runs.

**Why**: The reminder notes staff are supposed to see have plausibly never once been saved in production, and monitoring shows a clean success every night because nothing surfaces the failure.

**Fix**: Point `created_by` at a real system user id that exists in the users table, and widen the allowed note types to include what these crons actually write.

**Effort**: M

---

### 11. A booking can get cancelled by the cleanup cron right after it was legitimately approved or paid for

**Where**: `app/api/cron/pending-timeout/route.ts:33`, `app/api/cron/release-deposits/route.ts` (same pattern)

**What**: These two crons look up bookings in a "still pending" state, then cancel them. But between that lookup and the actual cancel, they never double-check the booking is still pending. A sibling cron (`abandon-sweep`) does this correctly. If a salon owner approves the booking, or the customer's payment confirms, in that small window, these two crons will still cancel it, free up its time slot, email the customer a cancellation, and (in one case) cancel the payment hold, wiping out something that had just become legitimate.

**Why**: This is a real race condition on live money and scheduling, not a hypothetical: any concurrent approval or payment lands in the danger window.

**Fix**: Add the same "recheck the status right before writing" guard the working sibling cron already uses.

**Effort**: S

---

### 12. Deleting a staff member silently detaches their upcoming bookings instead of blocking or reassigning them

**Where**: `app/api/staff/[id]/route.ts:68`

**What**: The staff list page already computes "how many future bookings does this person have" specifically to warn an owner before deleting them. The actual delete endpoint never checks this at all, it just deletes. Every future booking for that staff member has its staff link quietly wiped (the database does this automatically), with no cancellation, no reassignment, and no notification to anyone.

**Why**: An owner (or anyone hitting the API directly) can delete a stylist who has real upcoming appointments; customers still show up expecting that person, and nobody, not the owner, not the customer, is ever told what happened.

**Fix**: Before deleting, count that staff member's future non-cancelled bookings and block the delete (or require an explicit reassignment) unless the count is zero.

**Effort**: S

---

### 13. Client photo uploads have no file-type or size limit

**Where**: `app/api/clients/[id]/photos/route.ts:50`

**What**: This upload endpoint accepts any file, of any size, with a content-type the caller can simply declare, and uploads it straight to a public storage bucket. A sibling upload endpoint in the same codebase already validates for images-only and caps the size at 10MB; this one was never given the same treatment.

**Why**: Any salon owner can upload arbitrarily large or arbitrarily-typed files to public storage with no throttle on how often, which is a storage-abuse and mislabeled-content risk on the platform's own domain.

**Fix**: Copy the image-type check, size cap, and rate limit already used by the sibling formula-photo upload route.

**Effort**: S

---

### 14. A walk-in customer's paid queue ticket can lose its link back to their booking

**Where**: `lib/barber/walkin-ticket.ts:213`, interacting with `app/api/stripe/webhook/route.ts:441-446`

**What**: When a walk-in customer pays through a booking link, two different code paths can both try to create their queue ticket: the customer's own confirm action, and a backstop that fires as soon as Stripe authorizes the payment hold. Whichever one runs first "wins," and the backstop path never has the booking id to attach, so if it wins the race, the ticket never gets linked to the booking, and the booking's payment status never updates.

**Why**: If the customer reopens their pay link afterward, the system still thinks they need to pay (even though they already authorized a hold), potentially charging them again or confusing the flow. It also silently miscounts revenue reporting, since a page elsewhere classifies bookings as "walk-in" vs "appointment" purely by whether this link exists.

**Fix**: Always run the link step regardless of which path created the ticket, or pass the booking id through to the backstop path too so either winner links it correctly.

**Effort**: M

---

### 15. Sorting salon search results by price or distance only sorts within an already-cut-off page

**Where**: `app/api/salons/route.ts:452`, same pattern in `app/api/search/treatments/route.ts:91-126`

**What**: When a customer sorts by "cheapest first" or "nearest first," the database query actually fetches results ordered by an unrelated field first (creation date, or a generic ranking score), cuts that down to one page (e.g. 20 results), and only THEN re-sorts those 20 by price or distance. The genuinely cheapest or nearest salon on the platform is never surfaced if it doesn't happen to already be on that first, wrongly-ordered page.

**Why**: Today, with a small number of salons per city, this is mostly invisible because everything fits on one page. It will silently break the moment any city's salon count exceeds a page size, and the sort picker's promise ("cheapest first") becomes untrue without any error or warning.

**Fix**: Either compute price/distance in the database so sorting happens before the page cutoff, or fetch the full matching set, sort it fully, then slice to the requested page (the codebase already does this correctly for its "relevance" search mode).

**Effort**: M

---

### 16. Four money-related database functions are callable directly by anyone with the public API key

**Where**: `supabase/migrations/20260710100855_audit_fix_promo_reserve_at_checkout.sql`, `supabase/migrations/20260710103441_audit_fix_member_discount_reserve.sql`

**What**: A set of six near-identical money functions (promo code redemption, credit/voucher handling) were already locked down so only the server itself can call them, not the public app key. Four newer, closely related functions, for reserving/releasing a promo code and a member discount at checkout, were added a day later and never got the same lockdown. One of them also never checks that the "which user" argument actually matches the caller.

**Why**: Anyone who has the app's public key (which is embedded in every page load, by design) can call these functions directly and consume a limited-use promo code's cap without completing a real checkout, or manipulate another user's member-discount eligibility by passing their id.

**Fix**: Add the same lockdown migration used for the other six functions, and add a "does this id match the logged-in caller" check inside the two discount functions.

**Effort**: S

---

### 17. Phone verification (OTP) silently never sends a real text message in production

**Where**: `app/api/auth/verify-phone/send/route.ts:47`

**What**: The route reads an environment variable under one name, but the actual configured secret (and every other SMS-sending part of the codebase) uses a slightly different name. Because the variable this route looks for is never set, it falls into a fallback path that returns a "success" response saying the SMS was sent, without ever actually sending it.

**Why**: Anywhere this gates a real flow, the feature is fully broken today: the user requests a code, gets told it was sent, and never receives it, so they can never finish verifying. Nothing in the response tells them (or anyone monitoring) that this happened, other than a subtle wording difference nobody would notice.

**Fix**: Fix the one-line environment variable name.

**Effort**: S

---

### 18. Salon-initiated refunds leave no internal record of who did it or why

**Where**: `app/api/bookings/[id]/refund/route.ts`, `app/api/salon/retail/[id]/refund/route.ts`

**What**: Neither of these two refund endpoints writes to the project's internal audit log, even though the shared refund helper they both call explicitly says in its own code comment that logging that is "the caller's responsibility." Nobody did it.

**Why**: If a salon owner's account is compromised, or an owner abuses the refund allowance, there's currently no internal record inside Solen of who refunded what and why, only Stripe's own dashboard, which platform admins may not have direct visibility into per transaction.

**Fix**: Add an audit log entry after a successful refund in both routes, matching the pattern already used elsewhere (e.g. the dispute-action route).

**Effort**: S

---

### 19. The general loyalty stamp-card feature can never actually give anyone a stamp

**Where**: `app/api/loyalty/award/route.ts:58`

**What**: There is exactly one place in the whole codebase that could ever insert a stamp into a customer's loyalty card, and nothing anywhere (no booking-completion step, no cron, no webhook) ever calls it. There is also no way for a salon to actually turn this feature on through the product.

**Why**: A customer who is shown their "stamps collected" progress on their profile will never see it move, because nothing in the live system can ever add a stamp through normal use. This is the same "feature that structurally cannot work" pattern already flagged elsewhere for a different loyalty mechanism.

**Fix**: Either wire the award call into the booking-completion flow and build a salon-facing setup screen, or formally retire the feature (remove the dead code, log it as removed, stop showing customers an always-empty stamp card).

**Effort**: M

---

### 20. One report page runs one database query per salon on the platform, every time it's opened

**Where**: `app/api/analytics/benchmarks/route.ts:55`

**What**: To show an owner how their booking volume compares to other salons, this route loops over every active salon on the platform and runs one query per salon, one at a time, instead of a single combined query. There's also no rate limit stopping someone from reloading this page repeatedly.

**Why**: This gets linearly slower as the platform grows and can eventually time out or put real load on the database, and nothing stops it from being triggered repeatedly.

**Fix**: Replace the loop with one grouped database query (or a small view/RPC), and add a rate limit.

**Effort**: M

---

### 21. Recurring bookings still skip payment entirely on salons that require prepayment [known]

**Where**: `app/api/bookings/recurring/route.ts:87`

**What**: This booking type is always inserted as fully confirmed with no payment flow, no matter what payment mode the salon requires.

**Why**: A salon that requires full prepayment gets a recurring weekly appointment series with no money ever collected, indefinitely.

**Fix**: Branch on the salon's payment mode the same way the main booking route already does.

**Effort**: M

---

### 22. Express-rebook lets a customer's service/staff selection cross into an unrelated salon [known]

**Where**: `app/api/bookings/express-rebook/confirm/route.ts:43`

**What**: The service and staff ids sent by the client are never checked against the salon the time slot actually belongs to.

**Why**: A caller can pick a valid time slot at one salon, then confirm using a service or staff member from a completely different salon, corrupting that other salon's records.

**Fix**: After resolving the slot's salon, verify the service and staff ids belong to that same salon before using them.

**Effort**: S

---

### 23. Customers can still directly edit their own booking's price and payment fields [known]

**Where**: `supabase/migrations/20260601_sp1_bookings_guest_rls.sql:44`

**What**: A database-level guard was added to stop a customer from marking their own booking as "completed," but nothing stops them from directly editing the price, tier, or payment fields on their own booking row through the API, bypassing the app entirely.

**Why**: If anything downstream trusts those stored values without recomputing them, this is a real path to fee/tier manipulation.

**Fix**: Design and ship the stricter database rule this project already flagged as needed but never finished.

**Effort**: L

---

### 24. Stripe account restrictions never turn a salon's payment status back off [known]

**Where**: `app/api/stripe/webhook/route.ts:762`

**What**: When Stripe re-enables a salon's ability to take charges, the system correctly flips a flag on. When Stripe later restricts that same account, nothing flips the flag back off, and a separate signal (whether payouts are actually enabled) is never checked anywhere.

**Why**: Money can keep routing to a Stripe account Stripe itself has restricted, with the database never reflecting it until someone manually checks the Stripe dashboard.

**Fix**: Update the flag on every account-status event, not just the "turned on" case, and also check the payouts-enabled signal.

**Effort**: S

---

### 25. A sold-out retail product can still be sold to a second customer with no automatic refund [known]

**Where**: `app/api/stripe/webhook/purchase-handler.ts:139`

**What**: Two customers can both pass the "is this in stock" check at the same moment before either payment actually completes. The second one still gets charged for a product that no longer exists, and the code only logs this quietly rather than automatically refunding or alerting anyone.

**Why**: A customer can be charged real money for nothing, and nobody finds out unless someone happens to read the server logs.

**Fix**: Reserve stock atomically at the time of charge, or automatically refund and alert an admin when this race is detected.

**Effort**: M

---

### 26. Picking a time-of-day filter in search uses the wrong timezone [known]

**Where**: `supabase/migrations/20260607182403_add_salons_with_slot_in_hours_rpc.sql:20`

**What**: The "morning / afternoon / evening" search filter extracts the hour from each slot's timestamp using the server's UTC clock, not Zurich local time as the labels imply.

**Why**: A customer picking "morning" during summer (UTC+2) actually gets slots that are 11:00-14:00 local time, wrongly excluding real 9-11am slots and wrongly including 1-2pm ones. The filter isn't broken, it just answers the wrong question.

**Fix**: Convert to Zurich local time before extracting the hour, matching the pattern already used correctly elsewhere in the codebase.

**Effort**: S

---

### 27. Staff invite acceptance silently fails to actually link the new hire's account [known]

**Where**: `app/api/staff/accept-invite/route.ts:84`

**What**: The step that links a newly-accepted staff member's account runs through a database connection that isn't allowed to do that write for anyone except the salon owner. The person accepting the invite is never the owner, so this silently affects nothing (or errors) with no visible failure.

**Why**: Every self-service staff feature that identifies "who am I" by this link (my schedule, my services, my time off) will reject that person forever, even though the invite flow reported success.

**Fix**: Run this specific write through the elevated (service-role) connection already used elsewhere in the same file.

**Effort**: S

---

### 28. A salon can go fully live and take real money with zero human review [known]

**Where**: `app/api/salon/go-live/route.ts:62`

**What**: The narrower "is Stripe actually ready" check was already fixed. But there is still no check anywhere in the self-serve "go live" flow for whether an admin has actually approved the salon, even though the platform has a separate admin approve/reject workflow that implies review is required.

**Why**: Any owner who finishes Stripe setup and adds one service and photo can start taking real bookings and payments immediately, making the admin-approval workflow entirely optional in practice.

**Fix**: Either gate self-serve go-live on an explicit admin-approved flag, or remove the admin approve/reject screens so they stop implying a check that doesn't actually happen.

**Effort**: M

---

## MEDIUM

Grouped by area. Format: `file:line` , what's wrong -> the fix (effort estimate).

### Money & Payments
- `app/api/salon/earnings/route.ts:38` , salon_payouts.status never transitions away from "recorded," so the earnings dashboard's total shows CHF 0 for every salon forever -> wire the payout webhook to flip status to "transferred." (M)
- `app/api/admin/revenue/route.ts:39` , Admin revenue dashboard sums the pre-discount quoted price instead of the amount actually captured, overstating revenue whenever a promo or member discount applied -> sum the actually-captured amount instead. (M)

### Bookings & Availability
- `app/api/bookings/[id]/cancel/route.ts:258` , Waitlist "notified" flag gets stamped even when the notification email never actually sent -> only stamp it after a verified send. (S)
- `app/api/bookings/waitlist/route.ts:26` , A second, dead waitlist system is still live and reachable with zero readers of what it writes -> delete it or reconcile it with the real one. (S)
- `app/api/bookings/[id]/report/route.ts:530` , A refund status-advance write is never checked for success, unlike every other similar write in the same file -> add the same success check used elsewhere in this file. (S)

### Walk-in & Queue
- `app/api/walkin/queue/route.ts:34` , Public queue view returns waiting customers' real names, unauthenticated -> return counts/codes only, or require staff login. (S)
- `app/api/walkin/queue/[id]/route.ts:178` , A completed/no-show/cancelled ticket can be PATCHed back to "waiting," and the no-show-fee email can double-send -> add a terminal-state guard and a one-time-send flag. (M)
- `app/api/walkin/queue-stats/route.ts:6` , Two public walk-in endpoints are missing both the feature kill-switch and rate limiting every sibling route has -> add both guards. (S)

### Auth & GDPR
- `app/api/auth/verify-phone/send/route.ts:20` , Phone verification send/check has no session requirement at all -> require a logged-in session and log which user requested it. (M)
- `app/api/salons/route.ts:713` , The "phone verified" flag from the OTP flow is silently never saved to the salon record -> re-enable the write once the underlying schema-cache issue is fixed. (S)
- `app/api/profile/request-deletion/route.ts:1` , The more complete GDPR deletion endpoint (handles guest data too) is built but nothing in the UI ever calls it -> wire it up, or retire it if the simpler one is meant to be the only path. (M)

### Crons & Notifications
- `app/api/cron/release-deposits/route.ts:1` , This cron never actually calls Stripe to release the payment hold it's named for -> add the missing Stripe call. (S)
- `app/api/cron/birthday-messages/route.ts:35` , Birthday email is sent with no opt-out check, unlike every other marketing cron -> respect the same opt-out flag the others check. (S)
- `app/api/cron/auto-complete/route.ts:56` , A booking-update loop and a slot-generation step both drop real errors instead of reporting them -> surface the errors into the cron's own failure reporting. (S)
- `app/api/cron/discovery-deadcheck/route.ts:33` , No concurrency cap or time budget on a cron that makes one external HTTP call per item -> add a concurrency cap and a time budget. (S)

### Discovery & Search
- `lib/ai/recommendations.ts:24` , Time-of-day personalization computes "what time is it" using the server's clock, not Zurich time -> use the project's existing Zurich-time helper. (S)
- `app/api/content/route.ts:9` , Public CMS-content endpoint has no rate limit and no cap on how many keys can be requested at once -> add both. (S)
- `app/api/discovery/thumb/[id]/route.ts:67` , TikTok thumbnail proxy is missing the discovery feature kill-switch every sibling route has -> add it. (S)
- `app/api/recommendations/route.ts:108` , AI recommendations can surface test/unlisted salons that every other listing hides -> add the same visibility filters. (S)
- `app/api/salons/[slug]/nearby/route.ts:31` , The "nearby" widget on a salon page has no distance bound and can show hidden/test salons [known] -> add the missing filter + a real distance bound. (S)
- `app/api/salons/nearby/route.ts:62` , The geo "nearby" search only sorts by distance within an arbitrary, unordered slice of results [known] -> pre-order candidates by something distance-correlated before limiting. (M)
- `app/api/salons/by-slug/[slug]/route.ts:18` , Three routes (by-slug, by-slugs, treatments search) can show hidden/test salons that the main listing correctly hides -> add the missing visibility filters. (S)
- `lib/seo.ts:193` , Every salon's Google-visible structured data says its city is "Basel," regardless of where it actually is -> pull the real city name. (S)

### Dashboard, Staff & Clients
- `app/api/clients/[id]/intake/route.ts:53` , A customer's own intake-form submission can be silently rejected by a missing database permission -> move the insert to the elevated connection (already imported in the file). (S)
- `app/api/clients/[id]/nail-history/route.ts:78` , Staff/booking ids in the request body aren't checked to belong to the caller's own salon, across three related routes -> verify ownership before use. (M)
- `app/api/dashboard/batch/route.ts:24` , The dashboard's "batch fetch" endpoint accepts an unlimited, unvalidated list, with zero rate limit -> cap the list length and add a rate limit. (S)
- `app/api/dashboard/activity-feed/route.ts` , Most dashboard read routes have no rate limit and no banned-user check, unlike their siblings -> add both. (M)
- `app/api/services/suggest/route.ts:8` , A paid AI feature has no rate limit at all, for any logged-in user -> add one. (S)
- `app/api/salon/clients/route.ts:25` , This route pulls every booking a salon has ever had into memory before summarizing, with no limit -> aggregate in the database instead, or cap the time window. (M)

### Reviews, Loyalty & Analytics
- `app/api/metrics/global/route.ts:11` , A public stats endpoint returns hardcoded fake numbers (500 salons, 10,000 bookings, 4.9 rating) whenever the real query fails or is empty -> return an honest empty/degraded state instead of fabricated numbers. (S)

### Admin Tools
- `app/sitemap.ts:46` , The public sitemap doesn't exclude admin-seeded test salons, so fake salons can get indexed by Google -> add the missing filter. (S)
- `app/api/admin/badges/[id]/route.ts` , Several admin actions in this file never write to the audit log, unlike their siblings -> add the missing audit calls. (S)
- `app/api/admin/salon-of-month/route.ts:62` , "Confirm salon of the month" saves a flag that nothing anywhere ever reads -> either build the display surface or remove the dead feature. (M)
- `app/api/admin/salons/route.ts:23` , The admin salon list has no pagination and makes one extra API call per row just to fetch owner emails -> add pagination and batch the email lookup. (M)
- `app/api/admin/booking-disputes/[id]/action/route.ts:313` , One status-advance write in this file is the only one that never checks whether it actually succeeded -> add the same check used by the others. (S)
- `app/api/admin/badges/auto-assign/route.ts:51` , This route does one check plus one insert per qualifying salon, in a loop -> batch it into one query plus one bulk insert. (S)

### Misc & Long-tail
- `app/api/nail/hand-chart/route.ts` (whole file) , Dead unauthenticated stub: the route stores data in a per-instance in-memory `Map` (line 5), never wired to the real `hand_chart_notes` table, and has NO login/ownership check. Verified zero callers in web or mobile, so no real client data flows through it today (it is not the "anyone can read the DB" hole it first looks like), but if any UI is ever pointed at it, notes would silently vanish between requests AND be readable by an unauthenticated caller within the same warm instance -> delete the route, or build it for real against `hand_chart_notes` with auth + a `clientBelongsToSalon` check (same pattern as `app/api/nail/pricing/route.ts`). (M)
- `app/api/translate/route.ts:36` , The translate endpoint has no cap on how many languages can be requested at once, so cost per request is unbounded -> add a cap. (S)
- `app/api/ai/intake-recommendation/route.ts:49` , Customer-entered intake text is pasted directly into an AI prompt with no protection against prompt injection, unlike a sibling route that already has it -> add the same guard. (S)

### DB & Infra
- `scripts/inventory.mjs:147` , The "is our DB snapshot fresh" check only looks at the calendar date, so it reports "fresh" even when it's demonstrably stale -> check actual content, not just age. (M)
- `lib/stripe.ts:8` , The Stripe secret key bypasses the project's single source of truth for reading environment variables -> route it through the same helper everything else uses. (S)

### Performance (found by this session's manual scan of the 5 named hot paths, see the Performance scan section below for the full explanation)
- `lib/salon-detail.ts:76-114` , The salon detail page (the site's most-visited page type) makes one avoidable extra sequential database round trip on every load, on top of the already-parallel batch -> embed the staff-to-service link on the staff query instead of a separate follow-up query. (M)
- `app/api/bookings/route.ts:569-630` , Creating a booking awaits two outbound email sends, one after another, before responding to the customer, even though nothing depends on either email's result -> fire both without awaiting, matching the pattern already used in `app/api/salons/route.ts:850`. (S)

---

## LOW / hygiene

Grouped by area, one line each.

### Money & Payments
- `lib/validations.ts:178` , promo-code creation has no upper limit on a percentage discount (a sibling voucher schema already has this cap).

### Bookings & Availability
- `app/api/bookings/group/route.ts:29` , A dead existence check computes a value that's never used.
- `app/api/bookings/walk-in-verify/route.ts:28` , A security-compare helper is missing a length-equalization step, plus a generic (not dedicated) rate limiter on an endpoint that returns personal data.
- `app/api/slots/next-available/route.ts:22` , A wrong column name in a query makes this endpoint always silently report "no slots available."
- `app/api/bookings/[id]/route.ts:36` , This GET returns every internal booking column (access tokens, Stripe ids) instead of just what the UI needs.

### Walk-in & Queue
- `lib/walkin/join.ts:39` , No uniqueness rule stops the same person from joining the same queue an unlimited number of times for free.
- `lib/barber/walkin-availability.ts:36` , A walk-in availability helper doesn't check whether a salon is active/listed when the caller already has the salon ids.
- `app/api/waitlist/route.ts:8` , Neither the join nor the read endpoint for the waitlist has any rate limit.
- `app/api/walkin/queue/[id]/route.ts:216` , One endpoint hand-rolls its own token check instead of using the shared, safer helper every other route uses.

### Auth & GDPR
- `app/api/dev/login/route.ts:23` , The dev-only login helper accepts any email address, not just the intended test account.
- `app/api/auth/verify-otp/route.ts:1` , A whole endpoint is dead code, the real signup flow uses a magic link, not a 6-digit code.
- `lib/supabase.ts:98` , A dead, differently-behaved duplicate of the browser client helper is still exported.
- `middleware.ts:203` , The admin-only path list is missing a few admin subpages (defense-in-depth gap only, the routes still check auth themselves).
- `app/api/profile/live-state/route.ts:33` , A handful of authenticated profile routes have no rate limit (cost hygiene, not a data leak).

### Crons & Notifications
- `app/api/cron/release-payments/route.ts:46` , Two crons write directly to the audit table instead of using the shared helper, losing its built-in failure alerting.
- `lib/email-templates/booking-notifications.ts:25` , Unused email templates don't escape free-text fields the way the live equivalent does.

### Discovery & Search
- `app/api/discovery/save/route.ts:26` , A validated "collection" field is silently never actually used when saving.
- `app/api/discovery/similar/route.ts:41` , A payload-trimming fix (dropping an unused large field) applied to the main feed but not to four sibling endpoints.
- `app/api/discovery/collections/[id]/route.ts:20` , Several write/read endpoints in the collections feature skip rate limiting their siblings have.
- `app/api/discovery/style-names/route.ts:14` , An unpaginated query recomputes counts on every single request with no caching.
- `app/api/nail-discovery/publish/route.ts:54` , Salon-authored nail designs skip the content-moderation check customer-authored posts get.
- `app/api/salons/[slug]/gallery/route.ts:11` , Gallery upload/reorder/delete still has no rate limit [known, already tracked].
- `app/api/search/detect-category/route.ts:3` , A dead route implements an approach the project already explicitly rejected in favor of a newer one.
- `app/api/salons/verify/route.ts:5` , Two unused imports left in the file.

### Dashboard, Staff & Clients
- `app/api/conversations/route.ts:30` , The unread-message badge and an activity-feed entry are permanently dead now that the messaging feature is off.
- `app/api/conversations/route.ts:7` , This GET ignores its own salon/unread filter parameters entirely.
- `lib/validations.ts:1136` , A leftover validation schema for a deleted feature (price offers).
- `app/api/dashboard/batch/route.ts:101` , A catch block swallows every sub-request error with no logging.
- `app/api/dashboard/nail/ai-history/route.ts` , A few category-specific dashboard routes don't respect their own on/off feature flag.
- `app/api/salon/documents/route.ts:13` , Resolves "the owner's salon" with an unordered query instead of the shared helper, risking the wrong salon for multi-salon owners.
- `app/api/services/reorder/route.ts:29` , No cap on how many services can be reordered in one request, and no rate limit.
- `app/api/staff/[id]/route.ts:27` , Staff PATCH has no input validation at all, unlike every sibling mutation route.

### Reviews, Loyalty & Analytics
- `app/api/loyalty/redeem/route.ts:51` , Loyalty stamp/redeem counters use read-then-write instead of an atomic update, allowing a double-redeem under concurrent requests.
- `lib/barber/loyalty-qr.ts:18` , The loyalty QR code has no expiry or one-time-use protection, so a captured code can be replayed.
- `app/api/favorites/toggle/route.ts:44` , Skips its own ready-made validation, so a bad request produces a raw database error instead of a clean one.
- `app/api/reviews/eligibility/route.ts:1` , Three different implementations of the same "can this person review" check exist; two are unreachable dead code.

### Admin Tools
- `app/api/admin/discovery/backfill/route.ts:83` , A validated "ids" field is declared but the route never actually reads it.
- `app/api/admin/content/[key]/route.ts:17` , Content editor has no input validation or rate limit, unlike its sibling.
- `app/api/admin/homepage-sections/route.ts:52` , Accepts an arbitrary, unvalidated JSON blob.
- `app/api/admin/discovery/staging/route.ts:81` , Fetches an image URL with no SSRF safety check.
- `app/api/admin/discovery/check-ai/route.ts:11` , Inconsistent guard checks across a few admin discovery endpoints.
- `app/api/admin/segments/route.ts:19` , Member counts fetched one at a time in a loop instead of in one batch.
- `app/api/admin/badges/[id]/route.ts:17` , Badge editing has no input validation.

### Misc & Long-tail
- `app/api/ai/recommend/route.ts:56` , AI route error handlers don't log, and one leaks the raw error message to the caller.
- `app/api/nail/retail/route.ts:20` , Public retail listing exposes internal stock counts to anonymous visitors.
- `app/api/brand/[slug]/route.ts:1` , No rate limit, unlike sibling public routes.
- `lib/health.ts:91` , The public health-check endpoint reveals exact missing configuration and raw error details.
- `lib/posthog-server.ts:73` , A shutdown helper breaks the analytics client for any future use in the same process (dead code today).

### DB & Infra
- `supabase/migrations/20260709183852_audit_fix_discovery_items_rls_restore_v2.sql:12` , A few newer security policies re-check the caller's identity per row instead of once per query (a performance pattern already fixed everywhere else).
- `_inventory/_db-snapshot.json` , The cached database snapshot is stale relative to newer migrations, with nothing catching the drift automatically.
- `lib/database.types.ts:8480` , An undocumented duplicate database view exists with no migration file and no code using it.
- `supabase/migrations/064_quartier_subscriptions.sql:16` , A leftover public-write policy opens a direct spam vector nothing actually needs.
- `supabase/migrations/20260711094114_backend_loop_next_available_dates_rpc.sql:9` , One database function is missing a security hardening setting every sibling function has.
- `lib/types.ts:19` , A few dead/unused exports left behind in shared files.
- `netlify.toml:3` , A stale comment claims something is unfixed that a linked doc already says is resolved.

### Performance (added by this synthesis pass, see note below)
- `app/api/dashboard/batch/route.ts:32-33` , The salon-ownership and admin-role lookups run as two separate, sequential database round trips on every single call to this endpoint, when they don't depend on each other -> run them together (`Promise.all`), same pattern this file's sibling `app/api/bookings/route.ts` GET already uses for the identical check. (S)

## INFO

- `_plans/BACKEND_SWEEP_2026-07-10.md:160` , A parked note in an old audit doc is stale, the thing it flags is already fixed in code [known].
- `app/api/dashboard` (whole bucket) , There is no staff-permission model anywhere in the dashboard; every route is owner-or-admin only. Not a bug unless staff dashboard access is meant to exist.
- `app/api/partner/leads/route.ts:1` , A live database table has no migration file, so its schema isn't reproducible from source.

---

## Performance scan (the gap the crashed "perf" bucket left)

The perf bucket agent crashed before producing results, so this session did a focused, read-only re-scan of the five hottest customer-facing paths: `app/api/salons/route.ts`, `app/api/discovery/feed/route.ts`, `app/api/salons/[slug]/route.ts` (plus its shared loader `lib/salon-detail.ts`), `app/api/dashboard/batch/route.ts`, and `app/api/bookings/route.ts`. The prior campaign's perf fixes (explicit column lists instead of `select *`, the availability payload trim, the TikTok blob drop, `Promise.all` batching of the salon-search pre-filters, response caching headers) are confirmed still in place and were not re-reported. Two new medium-severity findings (counted in the MEDIUM section above, under a new "Performance" group) came out of this pass, explained in full here since they're worth understanding, not just skimming as a bullet:

**The salon detail page (the site's single most-visited page type) makes one more sequential database round trip than it needs to.** `lib/salon-detail.ts:76-114`, used by `app/api/salons/[slug]/route.ts` GET and the salon page's server render. Loading a salon page already correctly fetches services, staff, and reviews together in parallel (one round trip). But right after that, if the salon has staff, a fourth query runs by itself to look up which services each staff member performs. That lookup only needs the staff ids, which just came back from the parallel batch, so it can't start any earlier, but it doesn't need to be its own extra round trip either: the same information can be fetched by asking for it as part of the staff query itself (an embedded relation), the same way services and reviews already are. Every salon-page load today pays for three sequential round trips when two would do. Fix: add the staff-to-service link as an embedded relation on the staff query, removing the follow-up query entirely. Effort: M.

**Creating a booking waits on two outbound emails, sent one after another, before responding to the customer.** `app/api/bookings/route.ts:569-598` (customer confirmation email) and `:602-630` (salon owner notification email). Both are genuine outbound HTTP calls to the email provider (Resend), both are awaited one after the other before the booking-creation response returns, and neither email's outcome is used for anything (both are wrapped in swallow-and-log error handling). The salon's own onboarding welcome email, in the sibling `app/api/salons/route.ts` POST, is already sent the correct way: fire-and-forget, not awaited. Booking creation is the single highest-value, most time-sensitive action in the app, and today every booking pays the full latency of two sequential third-party email API calls before the customer sees "booked," even though the booking itself already fully succeeded first. Fix: don't await either email, fire them without blocking the response, matching the existing pattern at `app/api/salons/route.ts:850`. Effort: S.

A third, low-severity perf nit from this same pass is listed as a bullet in the LOW section below (`app/api/dashboard/batch/route.ts:32-33`).

The remaining two hot paths, `app/api/discovery/feed/route.ts` and the main `GET`/`POST` handlers of `app/api/salons/route.ts`, were read in full and are clean: no N+1 patterns, no `select(*)` over-fetching, correct `Promise.all` batching where the pre-campaign code used to be serial, and appropriate CDN cache headers already in place.

---

## Coverage gaps (not yet checked)

These are the completeness-critic's own list of what this fleet likely still missed, plus the concrete check that would close each one.

1. **Upload validation is inconsistent across storage routes.** Check: apply the same image-type + size-cap pattern already used correctly in `app/api/services/[id]/photos/route.ts` to the routes that are missing it.
2. **The `client-photos` storage bucket has no migration-managed access policy**, unlike `service-photos` and `discovery-images` which both got one. Check: pull the live policy for this bucket and add a migration if it's missing.
3. **Netlify's function execution time limit was never checked against the heaviest crons** (generate-slots, db-backup, loyalty-recompute, reconcile). Check: measure real run time for each against the plan's timeout.
4. **There is no Content-Security-Policy header anywhere** on the site, even though other security headers are set. Check: add one, verify it doesn't break image loading or the design system's inline styles.
5. **Every API error message is hardcoded English**, on a site that ships in four languages. Check: confirm whether any of these actually reach an end user untranslated, versus being generic strings the frontend already localizes.
6. **No dependency vulnerability scan was run** (the audit environment has no installed packages). Check: run `npm audit` and check Next.js/React/Supabase/Stripe SDK versions against their changelogs once in an environment with network access.
7. **The mobile app's expectations of the backend API were never diffed against the current backend**, and several backend response shapes changed this week. Check: compare the mobile app's fetch calls against the actual current response shape of each endpoint it calls.
8. **Supabase Realtime access control was never reviewed.** One live subscriber (the dashboard calendar) exists; Realtime is a known footgun for leaking rows across tenants if the underlying table's row-level security doesn't match REST access. Check: confirm the subscribed table's security policy is salon-scoped.
9. **`.env.example` and the code's actual required environment variables have drifted apart**, `.env.example` is a quarter of the length of the validation schema that reads it. Check: diff the two and fill in the gaps.
10. **No SMS provider integration could be found**, despite multiple SMS-named crons and routes. Check: confirm the real outbound SMS call site is actually wired, not silently doing nothing.
11. **Open-redirect and CORS protections look correct but were only spot-checked in one file each, not swept across the whole API.** Check: grep every redirect construction across the whole API tree for one built from user input instead of a validated allowlist.
12. **The performance modality had zero coverage this round** (the dedicated perf-bucket agent crashed). This session's own focused re-scan of the 5 named hot paths (see the Performance scan section above) partially closes this, adding 2 new findings; the remaining roughly 340 other API routes still have no dedicated perf sweep. Check: run the same N+1/over-fetch/serial-await scan across the rest of the route tree.
13. **No seed/test-data script inventory exists**, and the admin routes that inject synthetic salons/bookings were only checked for an admin-role gate, not specifically for a hard production-environment block. Check: confirm `app/api/admin/seed-test-salons/route.ts` and `app/api/admin/discovery/test-salon/route.ts` cannot run against production even with a valid admin session.

---

## Estate (hooks / skills / rules / docs / memory / plans)

This is Claude Code tooling, not product code, everything below lives in `.claude/`, `~/.claude/`, or `_plans/`/`_tasks/`/`_rules/`. Listed separately since you may want to action this on a different track than the product bugs above.

### 29. A verification tool's phantom name means a safety gate silently never fires

**Where**: `/Users/sulo/.claude/settings.json:155` and `:400`, `.claude/hooks/verify-tooling-preflight.py:46`, `.claude/hooks/verify-before-done-gate.py:58-59`

**What**: Several enforcement hooks, including the one built specifically to stop the "claims done without actually checking" problem, are hardcoded to recognize a browser-tool name (`mcp__Claude_Preview__...`) that doesn't exist in this environment's actual toolset (which is `mcp__Claude_Browser__...`). A memory file was even edited today re-asserting the old, wrong name as a "correction."

**Why**: If the rename is real and permanent, the preflight checks and the "did you actually verify" gate silently never recognize genuine verification work done with the tools that actually exist, so they either never fire or force a workaround.

**Fix**: Confirm the tool rename, then update all four references (settings.json, both hooks, and the memory file) to the current tool names, and add the old name to the phantom-reference detector so a future rename can't hide the same way.

**Effort**: S

### 30. Several substantial, still-open pieces of work are invisible from the main workstream index

**Where**: `_plans/BOOKING_POLISH.md` and about a dozen other files (`FLOW_HARNESS.md`, `HANDOFF.md`, the 9-file backend-audit cluster, and more), none linked from `_plans/ACTIVE.md`

**What**: `ACTIVE.md` exists specifically so nothing falls through the cracks between sessions, but roughly a dozen substantial plan files, including one with two genuine unresolved decisions that need your input (a schema-design fork, and why a nightly cron stopped running), have no row in it at all.

**Why**: These decisions can silently sit forever, since nobody would think to look for them.

**Fix**: Add index rows for the still-open files, and archive or consolidate the ones that are actually done.

**Effort**: M

### 31. A tracking doc's own security claim is backwards

**Where**: `_inventory/STATUS.md:38-43`

**What**: This doc, which the project explicitly instructs people to trust for "what's not obvious" about the database's current security state, says 16 tables have row-level security fully disabled. The very data file it points to as its source shows zero. An independent, later audit also confirms zero. This was found independently by two separate parts of this same audit fleet.

**Why**: Anyone following this doc's own instruction (trust this file over reading migrations) gets an internally contradictory answer to a security-relevant question.

**Fix**: Regenerate the underlying database snapshot from the live database, then correct this doc to match.

**Effort**: S

### 32. A pixel-comparison safety gate has never actually blocked anything

**Where**: `.claude/hooks/pre-component-edit-pixel-spec.sh:125`

**What**: Every other gate in this project that's meant to stop a risky edit exits with a specific code (2) that Claude Code actually treats as "block this." This one exits with a different code (1), which is treated as a warning, not a block. It was written before the block-code convention was established and never updated.

**Why**: The gate's carefully-written warning message displays, but the edit goes through anyway, silently defeating the entire point: catching an edit made against an unverified or wrong visual spec.

**Fix**: Change the exit code.

**Effort**: S

### 33. The Stop-time enforcement half of a work-logging hook has never actually run

**Where**: `.claude/hooks/worklog.py:81`

**What**: This hook has two modes: one that starts logging at the beginning of a session (which is wired up), and one that's supposed to check at the end of a session whether the work log was actually updated and block if not (which is never wired up anywhere).

**Why**: The whole point of building this as a hook instead of a written instruction was to make it enforce itself. As built, it doesn't, the log staying current depends entirely on remembering, which was the original problem.

**Fix**: Register the missing "stop" mode call in settings.json.

**Effort**: S

### 34. A different safety gate can't recognize the browser tool that's actually available

**Where**: `.claude/hooks/browser-verify-gate.sh:82`

**What**: Same root cause as finding 31: this gate only recognizes a couple of specific, partly-outdated tool name prefixes as "real verification happened," and doesn't recognize the browser tool that's actually the default one available in this environment. It also tells you to use tool names in its warning message that don't exist anywhere.

**Why**: Genuine verification done with the tools actually available today gets falsely flagged as "you didn't verify," forcing a workaround (or the escape-hatch flag that other parts of this same audit flag as an eroding pattern).

**Fix**: Add the missing tool-name prefix, and fix the tool names in the warning message.

**Effort**: S

### 35. Multiple skills tell you to measure things using a tool name that no longer exists [known]

**Where**: `/Users/sulo/.claude/skills/fable-reasoning/SKILL.md:26`, `fable-frontend`, `gemini-visual-check`

**What**: Same phantom tool name as findings 31 and 36, appearing inside the actual instructions three separate skills give when they tell you how to measure or screenshot something. This was already flagged with an "unresolved, needs confirmation" banner in three of these files; this session's evidence resolves that open question directly: the tool by that name genuinely does not exist in the live environment.

**Why**: Following these skills' own instructions literally produces a tool-not-found error on the single step ("measure, don't eyeball") these skills exist to enforce.

**Fix**: Repoint all three to the tools that actually exist today.

**Effort**: S

### 36. A council/brainstorming skill defaults to an AI model its own sibling skill already flagged as retired

**Where**: `/Users/sulo/.claude/skills/llm-council/scripts/query_llms.py:63`

**What**: This skill's default Gemini model name is the exact string a neighboring skill's script comment already calls "retired."

**Why**: Any run that doesn't override the model explicitly silently loses the Gemini perspective (the code fails soft per-model), with no clear signal that it happened.

**Fix**: Update the default to match the corrected value the sibling skill already uses.

**Effort**: S

### 37. A skill and a live, registered hook both point at a skill that was never built

**Where**: `/Users/sulo/.claude/skills/screenshot-spec/SKILL.md:178`, `/Users/sulo/.claude/hooks/skill-autopilot.py`

**What**: Both a documentation pointer and an actual live hook (registered and firing on video-related prompts) tell the agent to invoke a "watch" skill for video references. No such skill exists among the installed skills.

**Why**: Any prompt referencing a video link triggers the live hook, which then instructs the agent to run something that doesn't exist, a dead end.

**Fix**: Either build the skill, or repoint both references to the current way video analysis is actually done.

**Effort**: M

### Estate , MEDIUM

- `.claude/hooks/browser-verify-gate.sh:79` , One safety gate's file-scope check silently excludes an entire legacy component folder -> widen the regex. (S)
- `.claude/settings.json:58` , A multi-file-edit safety net only wires up 2 of the 5 relevant checks -> wire the other 3. (M)
- `CLAUDE.md:9` , The documented way to skip a check no longer actually works as written -> update the instructions to match the current mechanism. (S)
- `.claude/hooks/pre-build-exists-check.sh:91` , A check meant to stop people gaming the "does this already exist" search can still be tricked with a quoted decoy string -> parse the command more strictly. (S)
- `/Users/sulo/.claude/hooks/audit-status.py:17` , A startup hook is permanently dead, the file it checks for no longer exists anywhere -> repoint it or retire it. (S)
- `_plans/DEEP_AUDIT_2026-07-11.md:63` , This very audit's own tracking doc still calls something "owner-excluded" after it was actually approved and built the same day -> correct the note. (S)
- `/Users/sulo/.claude/hooks/lessons-ledger-inject.py:38` , A "lessons learned" ledger's banner says it's being kept current, but nothing has been added to it in weeks -> add the missing entries. (M)
- `/Users/sulo/.claude/hooks/link-gate.py:32` , At least 10 separate end-of-session checks each independently re-read the entire conversation transcript every single time -> share one parse across all of them. (M)
- `/Users/sulo/.claude/hooks/mockup-preflight-manifest.py:172` , A "preflight" summary check duplicates two other gates' logic in a way that's gone out of sync with them, so it can give an all-clear the real gates then contradict -> sync the duplicated logic. (S)
- `/Users/sulo/.claude/hooks/mockup-visual-gate.py:72` , This gate blanket-excludes the whole mobile app folder, missing an exception a sibling gate already added for the same situation -> copy the sibling's exception. (S)
- `/Users/sulo/.claude/skills/gemini-visual-check/SKILL.md:3` , This skill's own documentation still teaches a retired AI model name its own script already stopped using -> update the docs to match. (S)
- `/Users/sulo/.claude/commands/harden.md:45` , Points at a hook file that was renamed and no longer exists under the old name -> fix the reference. (S)
- `_rules/KEY_FEATURES.md:2` , Lists two features that were actually killed as if they're still live and shipped -> mark them removed, matching how other killed features in the same file are already marked. (S)
- `/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory/MEMORY.md:19` , A memory index entry describes an old, superseded rule as if it's still current -> rewrite it to match the current rule. (S)
- `/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory/project_db_schema_drift.md:3` , A memory's headline table count is stale and the refresh it promised never actually happened -> regenerate the database inventory and update the count. (S)
- `_plans/ACTIVE.md:10` , Row numbers in the main workstream index collide and go out of order -> renumber them. (S)
- `_plans/ACTIVE.md:28` , One row is still marked "in progress" even though its own detail file shows the work is fully done and committed -> mark it done. (S)
- `_plans/ACTIVE.md:26` , A migration-tracking row is stuck showing day-one status while more current information exists elsewhere, unlinked -> update it. (S)
- `_tasks/SOLEN_DESIGN.md:3` , A doc that's supposedly archived is actually still the live version, and the canonical doc's claim that it was archived is false -> either actually archive it, or correct the claim. (S)

### Estate , LOW

- `.claude/skills/solen-drift-check/scripts/check.py:104` , A few already-known drift-checker inconsistencies confirmed still open, one additional instance found [known, no new fix beyond what's already prescribed].
- `.claude/hooks/pre-commit-graveyard.sh:23` , One skip-flag is a bare on/off switch while two sibling skip-flags were already hardened to require a written reason.
- `.claude/hooks/pre-component-edit-pixel-spec.sh:84` , Missing a Linux fallback for a file-age check every sibling hook already has.
- `/Users/sulo/.claude/settings.json:451` , A response-length gate is registered with an empty match condition [known, still unfixed].
- `/Users/sulo/.claude/hooks/apology-spiral-gate.py:115` , This is the only end-of-session gate in its group that signals "block" a different way than all 11 of its siblings.
- `/Users/sulo/.claude/hooks/taste-log-inject.py:72` , This hook currently does nothing at all, the file it's supposed to match keywords against has zero keywords defined.
- `/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory/MEMORY.md` , One memory index line contradicts both the file it links to and the current live behavior.
- `/Users/sulo/.claude/hooks/phantom-column-warn.py:8` , Cites a doctrine file that doesn't exist in the repo.
- `/Users/sulo/.claude/hooks/SHELVED.txt:12` , The stated reason one script was shelved is factually incorrect.
- `/Users/sulo/.claude/workflows/council.workflow.js:39` , Four unused fields reference agent definitions the code never actually calls.
- `_rules/ROADMAP_RULES.md:109` , Points at the wrong file for a numbered decision list.
- `_rules/search-bar-rules.md:171` , A testing checklist requires checking dark mode on an app that only has a light theme.
- `_rules/search-bar-rules.md:170` , References a retired rule number in a file that's now just an archive stub.
- `_rules/STRUCTURAL_RULES.md:92` , Three rules still marked "in flux" actually contradict the design system that's since been locked down.
- `_rules/ROADMAP_RULES.md:86` , Points to an archived stub with no real index behind it.
- `/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory/project_meta_audit_2026_07_07.md:16` , Three memory links point at files that don't exist.
- `/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory/project_law_system_2026_07.md:23` , Cites a rules file that doesn't exist and two dead plan pointers.
- `_tasks/INCOMPLETE_FEATURES.md:254` , One "incomplete feature" entry is stale, the gap was actually closed by a since-merged fix.
- `_tasks/INCOMPLETE_FEATURES.md:3` , The file's own banner cites a rule number that doesn't exist under that name.
- `_tasks/CUSTOMER_FIX_PROGRESS.md` , A "decision pending" note is stale, the decision already shipped.

---

## Known / already-tracked

These 24 items were already written down in an earlier audit document. They're re-surfaced here so you can see they weren't forgotten, but none of them are new.

- [high] `app/api/bookings/recurring/route.ts:87` , recurring bookings skip payment entirely (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [high] `app/api/bookings/express-rebook/confirm/route.ts:43` , service/staff id not checked against the slot's salon (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [high] `supabase/migrations/20260601_sp1_bookings_guest_rls.sql:44` , no WITH CHECK on customer booking edits beyond status (source: `_plans/DB_FIX_MIGRATIONS.md` item 4)
- [high] `app/api/stripe/webhook/route.ts:762` , Stripe account restriction never flips the payment flag back off (source: `_plans/PAYMENTS_BACKEND_AUDIT.md`)
- [high] `app/api/stripe/webhook/purchase-handler.ts:139` , sold-out race with no auto-refund/alert (source: `_plans/PAYMENTS_BACKEND_AUDIT.md`)
- [high] `supabase/migrations/20260607182403_add_salons_with_slot_in_hours_rpc.sql:20` , time-of-day search filter uses UTC not Zurich time (source: `_plans/SEARCH_DISCOVERY_BACKEND_AUDIT.md`)
- [high] `/Users/sulo/.claude/skills/fable-reasoning/SKILL.md:26` , phantom measurement tool name (source: `_plans/ESTATE_AUDIT_2026-07-11.md` item 24)
- [high] `app/api/staff/accept-invite/route.ts:84` , invite acceptance can't actually link the account (source: `_plans/DASHBOARD_CRM_BACKEND_AUDIT.md`)
- [high] `app/api/salon/go-live/route.ts:62` , self-serve go-live bypasses admin approval (source: `_plans/ONBOARDING_BACKEND_AUDIT.md`)
- [medium] `app/api/auth/verify-phone/send/route.ts:20` , phone OTP has no session requirement (source: `_plans/AUTH_BACKEND_AUDIT.md`)
- [medium] `app/api/bookings/[id]/cancel/route.ts:258` , waitlist "notified" stamped without a real send (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [medium] `app/api/bookings/waitlist/route.ts:26` , dead orphaned waitlist system (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [medium] `app/api/salon/earnings/route.ts:38` , payout status never advances past "recorded" (source: `_plans/PAYMENTS_BACKEND_AUDIT.md`)
- [medium] `app/api/salons/[slug]/nearby/route.ts:31` , nearby widget has no geo bound or visibility gate (source: `_plans/SEARCH_DISCOVERY_BACKEND_AUDIT.md`)
- [medium] `app/api/salons/nearby/route.ts:62` , geo nearby sorts only within an arbitrary window (source: `_plans/SEARCH_DISCOVERY_BACKEND_AUDIT.md`)
- [medium] `app/api/walkin/queue/route.ts:34` , public queue view leaks customer names (source: `_plans/BOOKING_BACKEND_AUDIT.md` #26)
- [medium] `app/api/walkin/queue/[id]/route.ts:178` , duplicate no-show email + missing terminal-state guard (source: `_plans/BOOKING_BACKEND_AUDIT.md` #30)
- [low] `app/api/bookings/group/route.ts:29` , dead unused existence check (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [low] `app/api/bookings/walk-in-verify/route.ts:28` , HMAC compare missing length guard + generic rate limiter (source: `_plans/BOOKING_BACKEND_AUDIT.md`)
- [low] `/Users/sulo/.claude/settings.json:451` , empty matcher on a response-length gate (source: `_plans/ESTATE_AUDIT_2026-07-11.md` Tier 6 item 34)
- [low] `.claude/skills/solen-drift-check/scripts/check.py:104` , known drift-checker divergences (source: `_plans/SELF_AUDIT_2026-07-11.md`)
- [low] `app/api/salons/[slug]/gallery/route.ts:11` , gallery endpoints still unrate-limited (source: `_plans/RATELIMIT_CENSUS.md` ring 9)
- [low] `lib/walkin/join.ts:39` , no uniqueness rule stops free double-join (source: `_plans/BOOKING_BACKEND_AUDIT.md` #29)
- [info] `_plans/BACKEND_SWEEP_2026-07-10.md:160` , a parked note in an old doc is itself stale (source: the doc itself)
