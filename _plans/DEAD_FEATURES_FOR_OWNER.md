# Dead and dormant features, for you to decide

This is a plain-English list of things that are built into Solen's code but don't actually do anything for a real customer or salon today. Nothing has been changed. Each item below needs one decision from you: throw it away, finish wiring it up, or leave it as-is. Nothing gets touched until you say so.

A quick note on the count: the last two backend audits (2026-07-11 and 2026-07-12) originally flagged around 18 things in this "does nothing" category. I re-checked every single one against the actual code today, not just the old audit text, because a lot of backend cleanup has happened since those audits were written. Roughly half of the original list turned out to already be fixed or deleted in that cleanup (see the bottom of this doc for exactly which ones, so you know they weren't forgotten). What's left below, 8 items, are the ones that are genuinely still dead or dormant right now.

**Tally: 4 Retire, 2 Wire up, 2 Decide.**

---

## Retire (easy wins, safe to just delete)

### General loyalty stamp card (the "auto-award a stamp" path)
- **What it is:** A second way for a customer to get a stamp on their loyalty card, meant to fire automatically the moment a booking is marked complete.
- **What it does today:** Nothing, because nothing in the app ever calls it. No booking-completion step, no nightly job, no payment webhook, nothing triggers it. There's also no screen for a salon to turn this on in the first place.
- **Where:** `app/api/loyalty/award/route.ts`
- **My recommendation:** Retire. Solen already has a real, working loyalty system: staff scan a QR code in person and the stamp gets added that way (`app/api/loyalty/stamp/route.ts`, live, has a real customer-facing card page). This second "auto-award" path is a leftover from an earlier idea and just sits there unused. Delete it, or if the "automatically stamp on checkout" idea is something you actually want, that's a real feature to design and build, not something to leave half-finished.

### A second, duplicate "join the waitlist" system
- **What it is:** A second backend endpoint that looks like it does the same job as Solen's real waitlist feature (join a list to get notified if a slot opens up).
- **What it does today:** Nothing useful. It's a real, working endpoint, but the actual "Join Waitlist" button in the app always calls the OTHER endpoint (`/api/waitlist`). Whatever this duplicate one stores is never read by anything.
- **Where:** `app/api/bookings/waitlist/route.ts`
- **My recommendation:** Retire. It's confusing to have two systems doing the same job under different names, and a future edit could easily target the wrong one by mistake. Delete this one, keep `/api/waitlist` as the only waitlist.

### A duplicate "AI recommendation" endpoint for staff
- **What it is:** Part of the intake-form feature where AI suggests a treatment recommendation to staff based on what a customer wrote. There are two nearly identical backend versions of this.
- **What it does today:** This particular copy does nothing, it has zero callers anywhere in the app. The real "Generate Recommendation" button in the dashboard calls the other one (`/api/ai/recommend`).
- **Where:** `app/api/ai/intake-recommendation/route.ts` (dead) vs. `app/api/ai/recommend/route.ts` (the live one, actually used by `components-legacy/dashboard/IntakeFormTab.tsx`)
- **My recommendation:** Retire the dead copy. A security fix for this feature (blocking customers from sneaking hidden instructions into the AI prompt) was already applied to the live one, so keeping the unused duplicate around only invites someone to edit the wrong file next time and reintroduce that risk.

### A leftover "can this person review" checker
- **What it is:** A small backend check meant to answer "is this customer allowed to leave a review for this salon."
- **What it does today:** Nothing. It was already found unused in an earlier cleanup and turned into a stub that just replies "this endpoint has been retired" to anyone who calls it. The real check now lives directly in the reviews page's own code.
- **Where:** `app/api/reviews/eligibility/route.ts`
- **My recommendation:** Retire (finish the job). It's already inert, so this is just deleting a file that serves no purpose anymore.
- **Correction (2026-09-04):** This description is stale, checked against the live file today. The route is NOT a retired stub, it holds real, working logic implementing a dated owner decision (`app/api/reviews/eligibility/route.ts:8-9`, comment reads "Owner decision 4, 2026-08-09"; last touched in commit `ed44b3298`, 2026-08-09, same date). What IS true: nothing calls it. Grepped `components-legacy/ReviewForm.tsx`, `app/[locale]/_components/salon/SalonReviews.tsx`, and every file under `app/[locale]/reviews`, zero hits for "eligibility" anywhere. So this is live logic nobody wired up, not dead code. The right call is Wire up (point a review page at it) or a deliberate decision to leave it unused, not Retire.

---

## Wire up (worth finishing, real value if activated)

### The fuller account-deletion endpoint (covers guest bookings too)
- **What it is:** A more complete version of "delete my account," built to handle both registered customers AND guests who booked without ever making an account.
- **What it does today:** Nothing, because the account-settings page's delete button calls a different, simpler deletion endpoint instead. This fuller one, including the part that erases a guest's personal data, is fully built and correct, it's just never triggered.
- **Where:** `app/api/profile/request-deletion/route.ts` (the unused, fuller one) vs. `app/api/profile/delete/route.ts` (the one the Settings page actually calls)
- **My recommendation:** Wire it up. This is a real gap: if the simpler endpoint doesn't already cover guest bookings the same way, guests who ask to have their data erased may not actually be getting that today. Worth a quick look to confirm, then point the Settings page at the fuller one.
- **Correction (2026-09-04):** Already fixed, this item can be closed. `app/[locale]/profile/settings/SettingsForm.tsx:242` now calls `/api/profile/request-deletion` (the fuller one that covers guest PII), not `/api/profile/delete`. Landed in commit `1dcebe4e9` (2026-07-13), before this doc's own 2026-08-15 date. Verified with `grep -n "request-deletion" "app/[locale]/profile/settings/SettingsForm.tsx"`, which returns the call at line 242.

### The staff "leaderboard" numbers that are permanently stuck at zero
- **What it is:** Three metrics shown on the barber dashboard leaderboard and walk-in analytics screens: chair utilization, client retention percentage, and average tip per stylist.
- **What it does today:** Always shows 0, on purpose (this was a deliberate choice to show an honest zero instead of making up a fake number). But the underlying data these numbers would need doesn't exist in the database yet, so the screen has been permanently blank since it shipped.
- **Where:** `app/api/dashboard/walkin-analytics/route.ts` (chair utilization), `app/api/dashboard/barber-leaderboard/route.ts` (retention, average tip, chair utilization)
- **My recommendation:** Wire it up, but only if you actually want these numbers. It needs three real things to be built first: a way to track tips (there's no tip amount stored anywhere today), a model for how many hours a chair/stylist is actually open (to compute utilization), and a way to calculate whether a client came back (retention). Until one of those exists, the number it's attached to should probably just be hidden from the dashboard instead of shown as a permanent 0, since a permanent zero can read as "this stylist has 0% retention," which isn't true, it's "we don't measure this yet."
- **Correction (2026-09-04):** Partially stale. Client retention (the code calls it `rebooking_pct`, not `retention_pct`, same concept) IS now a real calculation: `app/api/dashboard/barber-leaderboard/route.ts:134-144` computes it from real repeat-customer history and returns it at line 159. Average tip is NOT wired anywhere, I grepped the whole repo for `avg_tip`, `tip_amount`, and "tip" fields, zero hits outside comments, there is still no tip amount stored anywhere, so this metric is not even a hardcoded 0, it is simply absent from the API response entirely. Chair utilization is confirmed still a hardcoded 0 at `app/api/dashboard/walkin-analytics/route.ts:91`. So of the three original metrics: 1 fixed (retention/rebooking), 1 still fully unbuilt (tip, not even a zero), 1 still hardcoded 0 (chair utilization).

---

## Decide (needs your call on product direction, not just a code fix)

### "Salon of the month" admin confirm button
- **What it is:** An admin screen where staff can review a shortlist of the platform's top-rated salons and click "confirm" to name one salon of the month.
- **What it does today:** Nothing customer-facing. Clicking confirm saves a flag in the database, but no page, badge, homepage section, or email anywhere on the site actually reads that flag and shows it to anyone.
- **Where:** `app/api/admin/salon-of-month/route.ts`
- **My recommendation:** Decide. This is half of a feature, the "pick a winner" half exists, the "show it off" half was never built. If you still want a "salon of the month" badge on the site, that's a real design + build task (needs a spot on the homepage or salon listing). If you don't want it anymore, retire the admin screen too.
- **Correction (2026-09-04):** Already fixed, this item can be closed. `app/[locale]/page.tsx:60` imports `SalonOfMonth` and `app/[locale]/page.tsx:283` mounts it (`<SalonOfMonth locale={locale} />`) inside the homepage, feature-flag gated. Same commit as the deletion fix above, `1dcebe4e9` (2026-07-13). Verified with `grep -n "SalonOfMonth" "app/[locale]/page.tsx"`, which returns both lines.

### In-app messaging between salons and customers (chat)
- **What it is:** A built-out direct-message system so a customer and a salon could chat inside the app, including sending photos and a "make an offer" style message.
- **What it does today:** Nothing. No page or button anywhere in the current site calls this. The messaging feature is switched off at the product level. On top of that, the photo-sharing storage area for this chat has no lock on who can upload into someone else's conversation folder, a gap that only matters once this gets turned back on, but it's live in the database right now regardless of whether the feature is visible.
- **Where:** `app/api/conversations/route.ts` (the messaging API, unreached), the `chat-media` storage bucket, and the "price_offer" message type in `lib/validations.ts`
- **My recommendation:** Decide. This was clearly a real, deliberately-built feature that got paused, not an accident. If messaging is coming back at some point, it's worth tightening that photo-storage lock now since it's cheap to fix and otherwise just sits open. If messaging is staying off indefinitely, it's fine to leave as-is, just know it's there.
- **Correction (2026-09-04):** The storage-lock gap described above is already fixed, that part of this item can be closed. `supabase/migrations/20260815010000_chat_media_read_own_folder_only.sql` scopes the `chat-media` bucket's SELECT policy to `auth.uid() = folder[1]`, matching the INSERT/DELETE policies that were already scoped. Applied live 2026-08-14 per the migration's own header. Verified the file exists (`ls supabase/migrations/20260815010000_chat_media_read_own_folder_only.sql`) and its body reads `using (bucket_id = 'chat-media' and (auth.uid())::text = (storage.foldername(name))[1])`. The rest of this item (messaging feature switched off, no page calls it) is still accurate and unchanged.

---

## Already fixed since the audit (no decision needed, listed for your peace of mind)

These were named in the original audits as "does nothing" but a backend cleanup pass already fixed or removed them before this list was written. Confirmed by re-reading the current code, not the old audit text:

- **The OTP phone-verification endpoint** the audit called dead code, that file (`app/api/auth/verify-otp/route.ts`) no longer exists, it's been deleted.
- **The nail "hand chart" notes screen**, previously an unauthenticated stub that lost data on every request, now has real database storage, a login check, and an ownership check, and is genuinely used by the nail dashboard's hand-chart tool.
- **A duplicate Supabase login-client helper** the audit flagged as dead code, it's been removed from the file entirely.
- **The "collection" field on saved discovery posts** the audit said was silently ignored, it's now correctly passed through and saved.
- **A dead search-by-category route** the audit flagged, that file no longer exists either.
- **The client-photo gallery** (the before/after photo tool salon staff use on a client's profile), the audit found it was building broken image links because the storage folder is private. That's now fixed: photos load through a proper time-limited link instead.
- **The salon reply-to-reviews feature**, the audit found a salon's reply never actually saved because of a field-name mismatch between the dashboard and the backend. That mismatch is fixed now.
- **The salon earnings dashboard total**, the audit found it always showed CHF 0 because it was checking for a payout status that could never exist. It's now checking the real status value and should show real numbers.
