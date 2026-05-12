# Onboarding Flow Audit — Signup, Pet Profile Timing, Welcome Flow

**Phase:** 0.13 (Solen → dog-grooming pivot research)
**Date:** 2026-05-13
**Scope:** New-user signup form fields, pet profile creation timing, email verification, welcome email content, first-time empty home state, first-booking incentives — across Fresha (multi-vertical marketplace), Groomit (on-demand pet grooming), Scenthound (membership pet grooming chain).
**Goal:** Surface decisions for the Solen MVP onboarding spec.

Evidence sources are quoted inline. Where the public site/help-center is silent on a detail, the row is marked `[INFERRED]` and reasoned from adjacent evidence.

---

## 1. Per-site signup flow steps

| Step | Fresha (multi-vertical, app-first) | Groomit (on-demand mobile groomer) | Scenthound (membership chain, US franchise) |
|---|---|---|---|
| 1. Entry point | Homepage CTA = `Get the app` with QR + iOS/Android badges. Web signup is secondary; the funnel is "scan QR, install app." Web auth lives at `/auth?type=socials-login`. [INFERRED from `fresha.com` homepage fetch] | Homepage CTA = `Book Now` (header, hero, sticky bottom). Phone fallback: `+1 (646) 718-5360`. Browsing is open (zip + pet details enter pricing widget without auth). | Homepage CTA = `Book Now` → `/login-to-book-an-appointment`. Membership selection sits in nav. No standalone "Join" hero CTA on homepage. |
| 2. Auth gate | "Continue with Facebook" → "Continue with Google" → Email (`Continue` button), single combined form. No password field at this step (multi-step: email first, then either OAuth handoff or password screen). Apple appears in iOS app only. [Fresha auth page fetch + help-center] | Same vertical layout: Email/phone → password → social row (Google, Apple, Facebook). Forgot password link. Password field has eye-toggle. Phone verification is a separate 4-digit-code modal. | Booking funnel requires login first. Membership signup is in-store/via-location-page; e-commerce-style join flow not surfaced on `.com`. [INFERRED — page redirects to location selector before account creation.] |
| 3. Identity verification | Email verification link mailed at signup. Quote: *"A verification email will be sent to the email address provided during setup."* (Fresha help-center) | SMS verification: 4-digit code to mobile. Quote: *"Verification Code sent to … [4-digit entry]"* (Groomit auth modal). Credit-card-on-file also required pre-booking. | [INFERRED] Standard email confirmation + payment-method capture at membership purchase. |
| 4. Profile capture | Name, profile photo (optional). Pulled automatically from OAuth provider when used. Quote: *"the platform gets an access token that grants access to first and last name, email, user ID and (apart from Apple) profile photo."* (Fresha help) | Address required pre-booking (service-area gate). Pet details (breed, size) entered during booking, not at account creation. Quote: *"Choose your grooming package and any add-ons … Confirm your booking"* (Groomit how-it-works). | [INFERRED] Location attached to account at membership purchase. Dog details (name, breed, weight) captured at first SCENT-check visit, not at signup — staff fill the 6-point wellness check on intake. |
| 5. First action | Search salons / save favorites / book service. Browsing is open without account; account only gates booking + favorites persistence. | Pet info → service selection → date/time → confirm + immediate charge. *"create pet profiles, select grooming packages, schedule appointments"* (Groomit app description). | Book trial visit ($25 E-scent-ials package) → arrive in-store → staff captures dog profile + assigns membership tier. |

**Key contrast:** Fresha = OAuth-light, Groomit = phone + payment-method-heavy, Scenthound = location-first, staff-mediated profile.

---

## 2. Pet profile creation timing

| Pattern | Who uses it | Tradeoff |
|---|---|---|
| **At signup (wizard)** | None of the three big refs use this for the public flow. BusyPaws / Time-To-Pet (B2B intake forms) do — but they're operator tools, not consumer marketplaces. | Highest friction, highest data quality. Best for memberships / recurring care. Wrong for first-time discovery. |
| **At first booking (inline)** | **Groomit.** Quote: *"When booking an appointment through the Groomit website or mobile app, you need to provide details about your pet, including breed, size, and specific grooming needs."* | Right balance for transactional marketplaces. Pet info collected only when commitment is real (the booking). Avoids "fake profile abandon" pattern. |
| **At first visit (staff-mediated)** | **Scenthound.** SCENT check happens on first physical visit; staff rate skin/coat/ears/nails/teeth/glands 1-5. Customer only books a slot online. | Lowest digital friction, highest service-quality lock-in. Only works with physical-location chains. Not applicable to a marketplace. |
| **Deferred / optional** | **Fresha.** No pet profile concept — they're multi-vertical (hair, nails, spa). [INFERRED] If they added pets, would be a profile-tab feature added post-booking, not a gate. | Lowest commitment, lowest data quality. Right when the vertical is broad. |

**Solen sits between Groomit and Scenthound:** marketplace model (Groomit-like) but recurring-care vertical (Scenthound-like). Recommendation in §7.

---

## 3. Email verification: required-to-book or optional?

| Site | Verification required to browse? | Required to book? | Method |
|---|---|---|---|
| Fresha | No | Yes (account required for booking). Quote: *"Clients need to create or log in to a Fresha client account to book and confirm an appointment online."* Verification link emailed. | Email link |
| Groomit | No (open browse + pricing widget) | Yes — and additionally phone-verified + credit-card-on-file. *"Yes. Signing up helps us provide personalized service and keeps your information safe."* | SMS 4-digit code + email [INFERRED for email] |
| Scenthound | No (location-finder open) | Yes for trial-visit booking and for membership purchase. | Email + payment method [INFERRED — standard for membership/POS] |

**Pattern:** All three gate booking behind a verified account but leave browsing wide open. None require verification to browse.

---

## 4. Welcome email content (templates observed)

**Fresha welcome flow is automated and operator-customizable**, not a single fixed template. Quote from Fresha's `Manage automated messages for Client Loyalty` help-center:
> *"Celebrate new clients joining your business by reaching out to them with exclusive discounts creating a positive relationship from their very first interaction."*
> *"Utilize the deal block to offer discounts and incentives, driving conversions and customer loyalty."*

So Fresha ships an **infrastructure** (automated message system + deal block + price block) rather than a fixed template — each salon configures their own. The platform-level welcome (consumer signing up for Fresha itself, not for a specific salon) is a thin "verify your email" transactional, not a marketing welcome. [INFERRED from app-first positioning]

**Industry-standard welcome email anatomy** (from MoeGo's pet-groomer email-template guide + general welcome-email research):
1. Personalized greeting using customer + pet name when collected. Quote: *"Welcome to Our Pack, {customerName}! We're wagging our tails with excitement to have you and your furry friends as new clients at {storeName}."* (MoeGo template)
2. Brand intro / value proposition — 1-2 sentences.
3. First-booking incentive — quote from research: *"A 10-20% discount or coupon for their first purchase will intrigue your target audience."*
4. Single CTA — "Book your first visit" (not multiple competing CTAs).
5. Expectations setter — what to expect next (booking confirmation, reminder timing, cancellation policy).
6. Sent within **5 minutes** of signup. Quote: *"It's generally best to send your first welcome email within five minutes of your customer subscribing or purchasing."* Welcome emails have *"four times the open rate and five times the click-through rate of a standard email."*

**Groomit-style welcome promo** (observed from search results, not a screenshot): *"Book today and get a Free holiday bundle on your appointment. USE Promo code Dogs: Woof24 Cats: Meow24"* — they push promo codes through marketing emails after signup rather than embedding in a welcome.

**Scenthound welcome flow** [INFERRED]: location-attached, would be franchise-templated. The $25 trial offer ($25 trial = first-visit anchor) lives on the trial-offer landing page and is the implicit "welcome incentive."

---

## 5. First-time empty home state (no bookings yet)

None of the three refs publish their empty-home-state screenshots, but the search surfaced one general pattern worth noting (Salonna app, App Store description): *"improved empty-state experience when no appointments remain."*

[INFERRED across the three references and pet-app pattern norms]:
- **Fresha** empty state likely shows: recommended salons near you (location-based seeding) + "Book your first appointment" CTA + saved-list teaser. Pulls double-duty as a discovery surface because there's no booking history to anchor on.
- **Groomit** empty state likely shows: "Book your first grooming" hero + recently-viewed groomers + service catalog. The app already has the user's zip from signup-area-check.
- **Scenthound** members never see an empty state because the membership-purchase flow books the first SCENT check as part of joining. [INFERRED]

**Industry pattern:** the strongest empty home state is one that *behaves like discovery* — not "you have nothing" but "here's what to do first." Common ingredients: nearby providers, a single primary CTA ("book your first visit"), social proof (reviews from nearby owners), and the platform's signature category ribbon. The empty state is the second-most-viewed screen after signup in transactional apps. [INFERRED from welcome-email industry data + Salonna release note]

---

## 6. First-booking incentives observed

| Provider | Offer | Format |
|---|---|---|
| **PetSmart** | *"New customers save $20 on their pet's first bath or groom, and get 50% off their first day at Doggie Day Camp."* | Dollar-off, channel-coupled |
| **Healthy Spot** | *"Receive 25% off your first dog grooming service at Healthy Spot!"* | % off, first-only |
| **Little Munchkins** | *"$5 off their bath or grooming package on their first appointment if you mention this discount."* | Dollar-off, mention-driven (in-store) |
| **Groomit** | *"Book today and get a Free holiday bundle on your appointment. USE Promo code Dogs: Woof24 Cats: Meow24"* | Promo-code seasonal bundle |
| **Scenthound** | $25 trial of E-scent-ials (bath, ear clean, nail clip, teeth brush + 6-point check). Quote: *"A $25 trial is available to first-time customers at any Scenthound location."* | Fixed-price trial (anchor-pricing, not % off) |
| **Fresha** | None at platform level. Salons configure their own via the automated-messages deal block. | Operator-defined |

**Decision pattern:**
- **Discount-style** (% or $-off) is the marketplace default — Groomit, PetSmart, Healthy Spot, Little Munchkins.
- **Trial-anchor** ($25 fixed price) is the membership-chain pattern — Scenthound. It works because it converts to monthly LTV.
- **No platform incentive** is the open-marketplace pattern — Fresha. The platform stays neutral; salons compete on their own offers.

For a Swiss dog-grooming marketplace, Groomit-style platform-controlled first-booking promo (e.g. CHF 10 off first booking, valid 30 days) is the strongest fit: it's the platform's voice, drives sign-up→book conversion, and gives Solen direct attribution data. Salon-funded would need P2C/marketplace-fees mechanics that don't exist yet. [INFERRED — recommended in §7]

---

## 7. Solen MVP onboarding spec

> **Posture:** This section makes recommendations; locked decisions are noted as recommendations not facts. Final values need user sign-off before implementation. Item names match the brief's request list.

### 7.1 Account creation form fields

**Recommendation:** Email + password as primary, with Google + Apple OAuth as alternates. **Skip Facebook** (declining relevance in CH/DE; OAuth setup cost outweighs share).

**Rationale (first principles):**
- Marketplace conversion research shows passwordless magic-link can lift signup completion 20-35% (Notion went 64% → 87%). But Solen needs the user to come back repeatedly post-booking — magic-link-only adds friction every return visit, especially on cellular networks where mail can lag. Email + password gives habitual users instant re-entry; OAuth gives one-tap users their preferred path.
- Apple is mandatory on iOS App Store if any social OAuth ships (Apple's policy 4.8). Google covers Android and web. Facebook adds a third provider to maintain for shrinking marginal coverage — defer.

**Fields, in order:**
1. `Continue with Google` (button row, top — most-tapped)
2. `Continue with Apple` (button row, top, second)
3. Divider: `oder mit E-Mail / or with email`
4. Email (required)
5. Password (required, 8+ chars, no other rules — fights forgot-password incidents)
6. Implicit consent footer linking to ToS + privacy policy (not a checkbox — the Fresha/Groomit pattern is "by continuing you agree" inline text; CH/EU-compliant when wording explicit).

**Skip at signup:** name (capture at first booking — Fresha doesn't capture name on web auth either), phone (capture only when needed for booking SMS reminders), full address (capture as part of location-gate, not as signup field).

### 7.2 Pet profile creation timing

**Recommendation:** **Deferred to first booking** — inline pet wizard inside the booking flow, NOT a post-signup wizard.

**Rationale:**
- Groomit's pattern is the closest market-fit: marketplace, pay-per-visit, breed/size matter for pricing. They collect pet info at booking. Conversion-loss from a pre-booking pet wizard is significant: every required field before the user has committed to a salon trades signup-completion for data-quality.
- Scenthound captures dog details at first physical visit (staff-mediated). Solen has no physical-visit hook because we're a marketplace, not a chain — so this hybrid doesn't apply.
- Optionally offer a `Pet hinzufügen / Add a pet` tile on the empty home state for users who want to set up before browsing. Don't gate on it.

**Pet wizard fields (collected at first booking, in order):**
1. Pet name
2. Breed (autocomplete-search; "Misch / Mixed" as default option)
3. Coat type (short / medium / long / curly — drives pricing)
4. Size band (XS <5kg / S 5-10kg / M 10-20kg / L 20-30kg / XL >30kg) — replaces weight to reduce friction
5. Age (optional, year only — used for senior discount logic later)
6. Notes (optional free-text — "anxious," "loves treats," "history of skin allergy")

Photo is **optional and deferred** to profile page — not asked at first booking.

### 7.3 Email verification

**Recommendation:** **Required for first booking, not for browsing or favoriting.**

**Rationale:**
- All three references gate booking behind verification but leave browsing open. This is industry-standard for a reason: it lets discovery happen without commitment, then anchors verification to the moment of real value.
- Implementation: account creation emits the verification link immediately; the booking-confirm button checks `email_verified=true` and shows an inline "Bestätige deine E-Mail / Verify your email" with a resend link if unverified. The booking is held (not committed) until verification succeeds.
- **Do not block** browsing salons, viewing salon details, or adding to favorites pre-verification — these are top-of-funnel and verification breakage would tank conversion.

### 7.4 Welcome email template (German + English)

**Recommendation:** Single welcome email, sent within 5 minutes of signup. CHF 10 off first booking as the anchor incentive. Single CTA.

**German (de-CH primary):**
```
Subject: Willkommen bei Solen — CHF 10 Gutschein für deine erste Buchung

Hallo,

schön, dass du bei Solen bist. Wir bringen dich und deinen Hund mit
geprüften Hundecoiffeuren in der ganzen Schweiz zusammen.

Damit der Start einfach ist: deine erste Buchung wird mit CHF 10
rabattiert. Code wird automatisch beim Checkout angerechnet — kein
Eingeben nötig.

→ [Coiffeur in deiner Nähe finden]

Gültig 30 Tage. Eine Buchung pro Konto.

Wenn du Fragen hast, antworte einfach auf diese E-Mail.

Solen
```

**English:**
```
Subject: Welcome to Solen — CHF 10 off your first booking

Hi,

Glad you're here. Solen connects you with verified dog groomers
across Switzerland.

To get you started, your first booking is CHF 10 off. The discount
applies automatically at checkout — no code to remember.

→ [Find a groomer near you]

Valid 30 days. One per account.

Questions? Just reply to this email.

Solen
```

**Notes:**
- Verification link is a **separate transactional email**, not bundled with welcome. Welcome assumes verified or pre-verified state and focuses on conversion. Verification email subject = `Bestätige deine E-Mail bei Solen / Verify your email at Solen`.
- The CHF 10 anchor is set higher than Little Munchkins' $5, lower than PetSmart's $20, and structurally simpler than Groomit's seasonal-bundle code (no code-to-remember = higher redemption).
- Footer should include unsubscribe + Solen postal address (CAN-SPAM / Swiss UWG compliance). [INFERRED — confirm with legal before launch]
- Match `SOLEN_LIVE_TRUTH.md` brand voice: warm + plain, no fluff, no emoji.

### 7.5 First-time empty home state

**Recommendation:** Treat empty state as a **scoped discovery surface**, not an "empty" message.

**Sections (top-to-bottom on mobile):**
1. Hero: `Willkommen, [first name from booking — fall back to "Hallo"]` + subheader `Finde einen Hundecoiffeur in deiner Nähe`.
2. Location chip (auto-detected or zip-entered) with edit affordance.
3. `Coiffeure in deiner Nähe` — 4-6 salon cards. This is the de-facto Coiffeur ribbon from the existing homepage components (`Coiffeur.tsx`).
4. `Letzte Plätze diese Woche` (Last Minute) — 3-4 cards if data exists. Drives same-week conversion.
5. `Beliebt in [Stadt]` — popularity-sorted within detected city.
6. Soft tile: `Profil deines Hundes anlegen` — optional CTA to pre-fill pet profile before booking. Skippable.

**What the empty state explicitly does NOT show:**
- "You have no bookings yet" copy.
- Empty illustrations / sad-dog icons.
- Multiple competing CTAs (book + favorite + invite-a-friend).

The empty state should look exactly like the home state with bookings, minus the `Deine Termine / Your bookings` ribbon. Same hero, same discovery sections, same Solen voice.

---

## 8. Decisions surfaced (for user sign-off)

| # | Decision | Recommended | Why | Status |
|---|---|---|---|---|
| 1 | Signup auth | Email/password **+ Google OAuth + Apple OAuth**. Skip Facebook. | Marketplace habit-use needs password fallback; OAuth covers convenience tier; Apple required by App Store policy if any OAuth ships. | **Open** — needs lock |
| 2 | Magic-link consideration | Don't ship at MVP. Revisit if signup conversion < 60%. | Magic-link adds infra cost + breaks habitual return. Better as a v2 conversion lever. | **Open** |
| 3 | Pet profile timing | **Deferred to first booking** (inline wizard). Optional pre-book tile on home. | Groomit pattern is the right marketplace fit. Pre-booking wizard kills signup conversion. | **Open** — needs lock |
| 4 | Email verification | **Required to book**, not to browse or favorite. | Industry standard across all three refs. Verification ≠ discovery gate. | **Open** — needs lock |
| 5 | First-booking incentive | **CHF 10 off first booking**, auto-applied (no code). Valid 30 days. One per account. | Higher than $5 (visible enough to motivate), lower than $20 (sustainable margin), simpler than promo codes (higher redemption). | **Open** — needs lock + finance sign-off |
| 6 | Welcome email channel | Single welcome email at signup (5-min lag), separate verification transactional. | Welcome emails have 4× open / 5× CTR; bundling with verification dilutes both. | **Open** |
| 7 | Empty home state | Discovery surface (nearby Coiffeurs + Last Minute + Beliebt), not "empty" copy. | Empty states that behave like discovery convert; empty states that announce emptiness don't. | **Open** |
| 8 | OAuth provider priority order | `Continue with Google` → `Continue with Apple` → divider → email/password. | Google > Apple in CH/DE web traffic, Apple > Google on iOS. Order is web-default; mobile app can flip. | **Open** |
| 9 | Phone number capture | **Defer** to booking flow (only when needed for SMS reminder opt-in). | Groomit forces phone at signup because they SMS-verify. Solen can email-verify and skip phone friction. | **Open** |
| 10 | Pet photo capture | Optional, deferred to profile page post-first-booking. Never gated. | Reduces first-booking friction. Photo adds emotional value to repeat sessions, not first session. | **Open** |

---

## Sources

- [Fresha homepage](https://www.fresha.com)
- [Fresha customer login (socials)](https://www.fresha.com/auth?type=socials-login)
- [Fresha — Update account password and social logins](https://www.fresha.com/help-center/knowledge-base/personal-account/34-update-your-account-password-1)
- [Fresha — Manage automated messages for Client Loyalty](https://www.fresha.com/help-center/knowledge-base/marketing/572-manage-automated-messages-for-client-loyalty)
- [Fresha — Automated messages overview](https://www.fresha.com/help-center/knowledge-base/marketing/125-automated-messages-overview)
- [Fresha for customers — App Store](https://apps.apple.com/us/app/fresha-for-customers/id1297230801)
- [Groomit homepage](https://www.groomit.me)
- [Groomit login](https://www.groomit.me/user/log-in)
- [Groomit — How Does It Work](https://www.groomit.me/help/article/getting-started/how-does-it-work)
- [Groomit — First-time booking groomer pick](https://www.groomit.me/help/article/groomers/i-am-booking-an-appointment-for-the-first-time-can-i-pick-my-pet-groomer)
- [Groomit — App Store](https://apps.apple.com/us/app/groomit-on-demand-grooming/id1240314505)
- [Scenthound homepage](https://www.scenthound.com)
- [Scenthound — Why Membership](https://www.scenthound.com/why-membership)
- [Scenthound — FAQs](https://www.scenthound.com/faqs)
- [Scenthound — Trial offer landing](https://www.scenthound.com/trial-offer)
- [PetSmart — New customer specials](https://services.petsmart.com/content/monthly-services-offers)
- [Healthy Spot — 25% off first groom](https://grooming.healthyspot.com/website/)
- [MoeGo — 22 Email Marketing Templates for Pet Groomers](https://www.moego.pet/blog/email-marketing-templates)
- [Omnisend — Welcome Email Templates and Best Practices (2026)](https://www.omnisend.com/blog/welcome-email-template/)
- [MojoAuth — Passwordless patterns that lift activation](https://mojoauth.com/blog/ree-trial-to-paid-passwordless-activation)
- [Supertokens — Magic Links](https://supertokens.com/blog/magiclinks)
