# Adjacent Booking Patterns — Cross-Vertical UX Study

**Date:** 2026-05-13
**Phase:** 0.15 (Solen → dog-grooming pivot research)
**Scope:** Booksy, StyleSeat, Doctolib, OpenTable. Pattern inspiration that could beat the Fresha-clone funnel for pet-grooming.
**Method:** WebFetch + WebSearch. Marked **[inferred]** where sources are indirect (UX case studies, help docs, vendor marketing) rather than firsthand flow walkthroughs. Direct homepage fetches on all four properties returned thin content (SPAs, login walls); the strongest evidence comes from third-party UX case studies and the platforms' own help/biz docs.

---

## 1. Per-platform booking flow trace

### 1.1 Booksy (international beauty marketplace)

| # | Screen | What happens | CTA / fields | Source |
|---|---|---|---|---|
| 1 | Discover business | Find via Google, Bing, Booksy app, or "Favorites" | (no CTA; entry point) | biz.booksy.com/blog/how-to-book-an-appointment |
| 2 | Category | Browse service categories (hair, facial, nails…) | Tap category | same |
| 3 | Service | Pick service; **price shown inline** | "each service has a price attached to it" | same (verbatim) |
| 4 | Staff | Pick stylist (optional; "select same person for future appointments") | Tap staff card | same |
| 5 | Date | Calendar; only available dates are bold | "The dates in bold are the available dates" | same (verbatim) |
| 6 | Time | Time-slot grid; **only-available-shown rule** | "You will only ever be shown available times" | same (verbatim) |
| 7 | Confirm | Form: name, email, phone, mailing address (autofilled if returning user) | "Fill required information" | same |
| 8 | Done | Confirmation page; reschedule/cancel links | (terminal) | same |

> "Clients can instantly book you wherever they find you, **without downloading an app**." — biz.booksy.com/features/online-booking

**Rebooking shortcut:** "simply click 'Book Again', and have their next appointment booked and confirmed in seconds" — same source.

**Payment:** **[inferred]** Booksy's blog page does NOT explicitly state when payment hits. Their help center references no-show fees and deposits as optional business-side settings, not mandatory. Confirmation is **SMS-first**: "Every confirmation text includes the basics (Salon Name, Service, Date, Time, Address), a clear Call-to-Action, and a brief Policy Notice." (biz.booksy.com/blog/the-perfect-appointment-confirmation-text-tips-and-samples)

**Auth:** Confirm-screen form collects email + phone, suggesting **guest-friendly with implicit-account-creation** — first booking creates the account silently from the form data. Returning users autofill. No explicit "sign up" gate before booking.

**Steps to confirm:** 8 screens. Slightly heavier than Fresha-clone target.

### 1.2 StyleSeat (US beauty marketplace, stylist-centric)

| # | Screen | What happens | CTA / fields | Source |
|---|---|---|---|---|
| 1 | Stylist profile | Browse services, prices, photos, reviews | "browse services, get pricing information, and book their own appointments 24/7" | help.styleseat.com (verbatim) |
| 2 | Service select | Pick service | (standard) | same |
| 3 | Time picker | Calendar + slots | (standard) | same |
| 4 | **Card-on-file** | **Card required at booking** | "Clients are required to input a card at the time of booking" | help.styleseat.com checkout article (verbatim) |
| 5 | Confirm | Account auto-created from form | (implicit) | same |
| 6 | Day-of: $1 auth | "$1 temporary authorization charge to verify the payment on file" | (background) | same (verbatim) |
| 7 | Post-service | "Card on file will be charged 1-hour after the appointment" | (background) | same (verbatim) |
| 8 | Tip / signature | "tip + sign in the chair" OR signature on manual checkout | tip flow | same (verbatim) |

**Payment timing — KEY divergence from Fresha:** charge is deferred to **1 hour after the appointment**, NOT at booking. Card is captured at booking only as authorization/anti-no-show.

**Deposits:** opt-in per-pro. "You can require a deposit in order for a client to book an appointment. You can easily collect prepayments from clients by sending a Payment Request in advance."

**Auth:** card-required = de-facto account. No anonymous guest checkout.

**Steps to confirm:** ~5 screens (service → time → card → confirm → done). But card-entry adds heavy friction for first-time clients.

### 1.3 Doctolib (DE/FR/CH medical)

> "the appointment booking process consists of exactly **six screens**, each corresponding to one task" — caroline-graver.medium.com Doctolib case study (verbatim)

| # | Screen | Task | Source |
|---|---|---|---|
| 1 | Home | Search field — specialist + city | case study |
| 2 | Search results | Pick specialist | case study |
| 3 | Profile | "make an appointment online" button | case study (verbatim) |
| 4 | Reason | Pick appointment reason (consultation, follow-up, vaccine…) | case study |
| 5 | Timetable | Pick day + time | case study |
| 6 | Patient info | Answer questions, confirm | case study |

**Core UX principle (the famous one):** *"there is one screen for each task. It might be for this reason that using this app seems so fluid and quick."* — same case study (verbatim).

**NOT actually 3 clicks** — the "3-click booking" reputation is myth; six discrete screens, but each is single-purpose, so it FEELS fast. **The trick is 1-task-per-screen, not few clicks.**

**Payment:** none at booking (insurance-paid in EU). Doctolib's Billeo billing engine fetches data from the Carte Vitale post-visit (medium.com/doctolib).

**Auth:** first-time patients fill registration on screen 6 (name, DOB, contact, insurance/Carte Vitale data). Returning patients log in and skip. **No card on file. No deposit. No no-show fee at the platform level.** (Practices can charge no-shows offline.)

**Steps to confirm:** 6 screens / ~6 clicks. Subjectively feels like 3 because each screen has one decision.

### 1.4 OpenTable (restaurant reservations)

**Home search bar** (single-row, 4 fields) **[inferred from search results, not direct fetch]**:
- **Date** (today/tomorrow/specific)
- **Time** (15-min increments)
- **Party size** (1–20+)
- **Location** (city/neighborhood/restaurant name)

> "users can search by date, time, and location to see what's available, and then narrow down options using filters like outdoor seating, price range or dietary restrictions." (OpenTable support)

| # | Screen | Task | Source |
|---|---|---|---|
| 1 | Home | 4-field search bar → "Let's go" / "Find a table" | OpenTable support docs |
| 2 | Results | Restaurant list with **inline time-slot pills** (2-3 nearest slots shown on the card itself) | OpenTable support docs |
| 3 | Restaurant page | Confirm slot (or pick another) | same |
| 4 | Diner info | Name, phone, email; optional account | help.opentable.com |
| 5 | Done | SMS + email confirmation | same |

**Critical pattern:** **time-slot pills surface ON the search-results card** — users skip the "open restaurant detail" tap entirely if the right time is already visible. **One-tap-from-results booking.**

**Payment:** zero at booking for normal reservations. Premium / hard-to-book / experience reservations may carry a deposit ("Experiences" feature). Most reservations = $0 captured.

**Auth:** **guest reservation is supported.** Account is optional but recommended for managing bookings later. Confirmation goes to phone + email; account can be claimed retroactively via that email.

**Cancellation:** OpenTable's lever isn't payment — it's the **"4 no-shows in 12 months = account suspended"** reputation system. Pet-grooming reputation systems could mirror this.

**Steps to confirm:** 3–5 screens depending on whether time-slot pill is tapped from results or restaurant page is opened first. **Fastest funnel of the four.**

---

## 2. Time-to-confirm comparison

| Platform | Vertical | Min screens | Decisions per screen | Time-to-confirm (estimated) | First-time vs returning |
|---|---|---|---|---|---|
| OpenTable | Restaurant | **3** | 1–2 | **~30s** | guest allowed → same speed |
| Doctolib | Medical | 6 | 1 (key trick) | ~60s | first-time +60s for profile form |
| Booksy | Beauty | 8 | 1 | ~75s | returning ~30s (autofill + "Book Again") |
| StyleSeat | Beauty | 5 + card | 1–2 | ~90s first time (card capture) | returning ~30s |
| Fresha (current Solen pattern) | Beauty | 7–8 | 1 | ~75s | similar |

**The fastest funnel (OpenTable) wins by surfacing time-slot pills on the results card** — the user skips the "open salon → pick service → pick staff → pick time" stack and books from search results.

---

## 3. Form-field friction (mandatory fields by step)

| Platform | Discover | Service | Time | Confirm |
|---|---|---|---|---|
| Booksy | 0 | 0 | 0 | name, email, phone, [optional addr]; **autofill on return** |
| StyleSeat | 0 | 0 | 0 | name, email, phone, **CARD ON FILE** (mandatory) |
| Doctolib | search query | reason (1 tap) | day + time | name, DOB, contact, **insurance card data** (new patients only) |
| OpenTable | date+time+party+loc | 0 | 0 | name, phone, email, [optional notes] |

**Pet-grooming-specific data we'd add (none of the four already capture):**
- Dog breed + weight (60min vs 90min slot prediction)
- Vaccination proof (some salons mandate)
- Aggression / behavior flags (handler safety)
- Coat condition photo (price-from-photo)

This data MUST get captured somewhere — the question is **when**. Pre-booking (loses conversions) vs. post-booking-pre-arrival (deferred onboarding email/SMS, like Airbnb's "complete your profile" nudge).

---

## 4. Payment timing

| Platform | At-booking | Day-of | Post-service | No-show |
|---|---|---|---|---|
| Booksy | optional deposit (per business) | nothing automatic | optional auto-charge | per-business policy |
| StyleSeat | card captured, **NOT charged** | $1 auth check | **charge 1h after** | card-on-file enables auto-fee |
| Doctolib | nothing | nothing | insurance handles | platform doesn't charge |
| OpenTable | nothing (most) / deposit on Experiences | nothing | nothing | **reputation: 4 no-shows = suspended** |

**Pattern hierarchy from least → most friction:**
1. OpenTable — zero payment, reputation-as-lever
2. Doctolib — zero payment, insurance-paid externally
3. Booksy — optional, salon-controlled
4. StyleSeat — mandatory card-on-file, deferred charge

**For pet-grooming verdict:** StyleSeat's **card-captured-charged-later** is the strongest model. Dogs no-show more than restaurants but less than medical (because owners actively bring the dog). 1-hour-after-charge eliminates "did the price change" surprise. Captures card without the "pay now" psychological hit.

---

## 5. Auth requirement

| Platform | Sign-up required? | OAuth? | Guest checkout? |
|---|---|---|---|
| Booksy | implicit (form = account) | yes (Google, Apple, Facebook on app) | de-facto guest (form-only) |
| StyleSeat | yes (card needs an account) | yes | no |
| Doctolib | first time = full profile; returns = login | no (medical privacy) | no |
| OpenTable | **optional** | yes (Google, Apple, Facebook) | **YES — explicit guest path** |

**For pet-grooming verdict:** OpenTable's optional-account model is the conversion-best. Owner books with phone/email, gets confirmation, account is auto-created and claimable later via magic-link. Mirrors Airbnb's "we made you an account, claim it later."

---

## 6. Mobile vs desktop divergence

| Platform | Mobile-specific moves | Desktop-specific moves |
|---|---|---|
| Booksy | client app pushed for repeat bookings; "Book Again" is a 1-tap home-screen action | none significant |
| StyleSeat | Apple Pay / Tap-to-Pay in-chair flow; SMS payment-request link | identical funnel |
| Doctolib | identical (1-screen-per-task scales) | identical |
| OpenTable | time-slot pills get bigger, fewer per row; "Notify Me" stronger on mobile | denser results grid; map view side-by-side |

**Insight:** the platforms that LOOK most mobile-native (Doctolib, OpenTable) actually have the LEAST mobile/desktop divergence. They picked a flow that worked at 375px first and let it stretch.

**Anti-pattern (StyleSeat, Booksy):** desktop versions are just "wider" — no use of horizontal real estate to surface more decisions in parallel.

---

## 7. Cross-vertical patterns worth STEALING for Solen-Dog

**S1. Doctolib's "1 screen per task" rule.** Don't merge service+time+staff onto a single dense page. Each decision gets full-screen focus. Six screens that each FEEL like one decision beat three screens that each feel like five.

**S2. OpenTable's results-card time pills.** On a "near me" list, show 2–3 nearest slots ON the salon card. Owner picks dog → search → sees "Bella's Spa — Today 3pm, 5pm, Tomorrow 10am" pills inline. One tap = booking initiated. **This is the biggest possible UX leap vs Fresha.** Fresha forces salon-open before any slot is visible.

**S3. OpenTable's guest-with-claimable-account.** Phone + email is enough. Account auto-created. Magic-link in confirmation SMS lets owner claim it later. Drops first-booking friction from "create account" page to nothing.

**S4. StyleSeat's card-captured-charged-after.** Capture card at booking (anti-no-show), charge 1h after appointment. Removes "pay now" psychological friction. Solves cancellations.

**S5. Booksy's "Book Again" one-tap rebook.** For repeat customers (dog grooming is naturally 6-week cadence), home screen shows "Book again — same groomer, same service, suggested 2026-06-24 3pm?" as a single-tap chip.

**S6. Booksy's SMS-first confirmation.** Confirmation isn't an email tucked in spam — it's an SMS with calendar-add, address, policy notice, all in one. Cuts post-booking anxiety.

**S7. OpenTable's reputation-as-cancellation-lever.** Instead of charging no-show fees (legal/payment-processing complexity), track "no-shows in 12 months" and gate accounts at threshold. Salons get a "verified" badge for owners with clean records.

**S8. Doctolib's "appointment reason" pre-filter.** Replace dropdown service-list with "Why are you booking? [Trim · Full groom · Bath only · Nail clip · Other]" as visual chips. Reason then narrows service options. Faster than scrolling 14 services.

---

## 8. Cross-vertical patterns to REJECT

**R1. Doctolib's insurance-card upload.** Medical-only. Pet grooming has no insurance equivalent (some pet insurance exists but rarely covers grooming). Don't borrow.

**R2. StyleSeat's mandatory-card-at-booking.** Too aggressive for **first-time** users in a market still building trust. Adopt the principle (R5 — capture card) only after a salon has accepted, OR for second-and-later bookings. First booking should be claimable-guest like OpenTable.

**R3. Booksy's 8-screen funnel.** Too long. Doctolib does the same job in 6, OpenTable in 3-5. Solen-Dog target: **5 max, including data-capture screens unique to dogs.**

**R4. OpenTable's "experience deposits" model for ALL bookings.** Their default is zero-payment; only premium/holiday reservations have deposits. We need card-captured-on-most because dog no-show damages a 60min slot worth ~CHF 80–120, while restaurant no-show damages a 90min table that gets walked-in within 30 minutes. Different economics.

**R5. StyleSeat's "tip in the chair."** Cash-tip culture doesn't transfer to CH. Tipping should be either built into service price or absent. Don't bolt on US-style tip-screen.

**R6. Booksy's "without downloading an app" as a virtue.** True early-stage. But for **6-week-cadence service** (dog grooming is naturally repeat), an app delivers Book-Again, reminder push, photo timeline. Don't ship app-first — but don't be allergic to an app once liquidity hits.

**R7. Doctolib's "no payment at platform level."** That works because EU insurance back-stops. Without that, no-show economics break. Reject.

---

## 9. Decisions surfaced

### D1. Adopt Doctolib's 1-screen-per-task model? — **YES**

Don't replicate the 6-step count; replicate the **one-decision-per-screen principle**. For Solen-Dog, candidate flow:

1. Discover (search/map/category)
2. Salon page — pick service ONLY (with reason-chip pre-filter from S8)
3. Pick groomer (or "any")
4. Pick day + time (single screen, calendar above, slots below)
5. Owner+dog info (name, phone, email, dog breed + weight + age)
6. Confirm (review + book)

**6 screens** matches Doctolib. Each is one decision. Card-captured on screen 6 silently.

### D2. Guest booking (no signup) for first-time? — **YES, OpenTable-style**

Phone + email is enough. Account auto-created. Confirmation SMS includes magic-link to claim. Returning bookings detect the phone number and offer "log in to autofill" or continue as guest again.

**Risk** [inferred]: Swiss GDPR-equivalent (revDSG) requires explicit consent for marketing. Solve with: "By booking you agree to transactional SMS/email for THIS booking. Marketing opt-in is separate."

### D3. Restaurant-style "available now" surfacing? — **YES, but adapted**

OpenTable's "results card with 2-3 slot pills" — copy directly. On homepage "near me" feed and search results:

```
[Salon card]
   Bella's Dog Spa · 2.3km · ★4.8 · CHF 80–120
   [Today 14:00] [Today 16:00] [Tomorrow 09:00]   ← tappable pills
```

Tap pill → skips salon page → goes directly to "owner+dog info" step. **3-screen booking for repeat customers** (search → pill → confirm).

For first-timers we still want the salon-detail step (trust-building). Pattern: first tap on the pill opens salon-detail-overlay with the slot pre-selected. They scroll, like what they see, "Continue" button = data form.

### D4. Card-captured-charged-after? — **YES, but only for repeat customers**

First booking: no card, claimable-guest, salon eats the no-show risk OR confirms manually for high-value bookings. Salons opt-in to "require deposit for first-time bookings."

Second-onwards booking: card-on-file required (auto-prompt after first successful appointment closes). Charge 1h post-appointment a la StyleSeat.

**[Inferred risk]:** CH payment-processing (Stripe + Twint) needs to support card-capture-charge-later. Stripe does; Twint may require full charge at auth time. Verify in implementation phase.

### D5. Pet-data capture — pre-booking vs post-booking? — **HYBRID**

Pre-booking (mandatory): breed, approximate weight, age. These drive slot-length and price-band.

Post-booking, pre-arrival (deferred onboarding email/SMS, 24–48h before): vaccination upload, behavior flags, coat photo. Salon sees these in their dashboard pre-arrival.

This separates "data needed to BOOK correctly" from "data needed to PREPARE correctly."

### D6. SMS-first confirmation — **YES**

Confirmation SMS includes: salon, service, dog name, datetime, address, magic-link to claim account, magic-link to modify/cancel. Email backup with calendar attachment + map. No app needed.

### D7. Reputation-based cancellation policy — **YES, hybrid with card capture**

- First-time bookings: cancellation tracked silently. No fee yet.
- After 1 no-show: card capture required for future bookings.
- After 3 no-shows in 12 months: account suspended pending review.
- Salons see "First-time customer" vs "Returning · X bookings" vs "Flagged · 2 no-shows" badges next to incoming bookings.

---

## 10. Risks of going too-far / over-simplifying

**Risk A — Over-simplification loses pet-grooming-specific capture.** OpenTable can be 3 screens because there's nothing dog-specific. Solen-Dog MUST capture breed + weight to price correctly. Don't let "fast like OpenTable" become "skips data we need."

**Mitigation:** D5 hybrid — mandatory bare minimum (breed, weight) pre-booking; rich data (vax, photos) deferred.

**Risk B — Doctolib's "feels fast" works only if each screen is genuinely single-purpose.** If we cram service+price+staff onto one screen "to save screens," we lose the feel entirely.

**Mitigation:** every screen wireframe gets a "what is the ONE decision?" review gate.

**Risk C — OpenTable's slot pills depend on real-time availability data being accurate.** Stale/cached slots = "Bella's Spa says 3pm available → I tap → 3pm is gone → fallback to time picker." This breaks trust faster than not having pills at all.

**Mitigation:** pills served from same source-of-truth as detail page; pessimistic invalidation; "Slot just taken — here are 4 nearby alternatives" fallback.

**Risk D — Card-captured-charged-after is unfamiliar to CH consumers** (most platforms here are pay-now or invoice). Some users will assume "card capture = charge now" and bail.

**Mitigation:** explicit copy at card-capture step: "We won't charge anything today. You pay after your appointment. Card is held in case of no-show." (Mirror what Hotels.com / Airbnb explain at booking.)

**Risk E — Booksy's autofill-on-return creates phone-number identity collision.** Two owners share a phone (couples) — one's autofill leaks to the other.

**Mitigation:** [inferred] tie identity to phone + email pair, not phone alone. Or "Is this you, Anna?" disambiguation.

**Risk F — Reputation-based cancellation has the "first-time user" cold-start problem.** Brand-new owner has no track record, salons see "First-time" and worry about no-show.

**Mitigation:** [inferred] phone-number verification (SMS OTP) on first booking + optional account claim raises confidence enough. Salons accept first-bookings as a known new-customer cost.

---

## 11. Synthesis — recommended Solen-Dog booking funnel

Combining S1, S2, S3, S5, S6, S8:

```
Owner journey (first-time):
  Search → Salon list with slot-pills → Tap pill OR open salon detail
       → Reason chips (Trim / Full / Bath / Nails / Other)
       → Service (filtered by reason)
       → Groomer (or "Any")
       → Day + time (skipped if pill-tapped earlier)
       → Owner info + dog info (combined: name/phone/email/breed/weight)
       → Confirm
       → SMS confirmation with magic-link to claim account

Owner journey (repeat, with claimed account):
  Home → "Book again — Bella, same as last time?" chip → Confirm
  OR
  Salon card with slot-pill → tap → Confirm (autofilled)
```

**First-time count:** ~5 screens (matches Doctolib's principle, beats Booksy's 8, beats Fresha's 7–8).
**Repeat count:** 1–2 screens (matches OpenTable's experience).

This is the answer to "are there UX moves that beat the Fresha pattern": **yes — Doctolib's 1-task-per-screen + OpenTable's slot-pills-on-results-card + OpenTable's guest-then-claim auth, combined.** Fresha's funnel doesn't surface availability until step 4; we surface it at step 1.

---

## Sources

- biz.booksy.com/en-us/blog/how-to-book-an-appointment (Booksy's own step description)
- biz.booksy.com/en-us/features/online-booking (no-app-needed quote)
- biz.booksy.com/en-us/blog/the-perfect-appointment-confirmation-text-tips-and-samples (SMS confirmation structure)
- biz.booksy.com/en-us/blog/faq-everything-you-need-to-know-about-salon-software (2026 features)
- help.styleseat.com/articles/13642398-checkout-payment-processing (card-capture, 1h-after charge, signature)
- styleseat.freshdesk.com/support/solutions/articles/69000469766-checkout-payment-processing (mirror, additional payment processing details)
- caroline-graver.medium.com/lets-see-how-doctolib-s-app-user-flow-works-14d41cd5453d (Doctolib UX case study — 6 screens, 1-task-per-screen)
- medium.com/doctolib/the-doctor-the-bill-and-the-engine-6a484aa20fb5 (Carte Vitale billing)
- opentable.com/blog/notify-me (slot alerts pattern)
- help.opentable.com/s/article/How-do-I-make-a-reservation-1505260085031 (reservation help — fetch errored, content inferred from search summaries)
- support.opentable.com/s/article/mobileapp (mobile app management)
- support.opentable.com/s/article/Guest-SMS-Messaging (SMS confirmations)
- pageflows.com/ios/flows/booking-an-appointment (iOS booking patterns — Zocdoc documented)
- booknetic.com/blog/appointment-scheduling-process (2026 appointment scheduling best practices)
- Background context: 60%+ hotel bookings mobile (phptravels.com); UX improvements can lift booking conversion ~30% (startdesigns.com)
