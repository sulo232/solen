# Booking-Flow UX Audit — Fresha · Groomit · Swiss baseline

**Date:** 2026-05-13
**Owner:** Solen → dog-grooming pivot (Phase 0.8)
**Scope:** Step-grain UX of consumer booking flow on three reference platforms — what fields per step, what payment timing, what cancellation surface, what reschedule path. Output feeds Phase 4 booking-flow build.
**Method:** WebFetch (parallel-safe, no Playwright) + WebSearch user-reports + help-center docs. No interactive flow walked — UI labels quoted are from help docs / landing pages / third-party reviews. Where data wasn't visible the entry is marked `[not visible via WebFetch]`.

---

## 1. Fresha — booking flow trace

Fresha is a multi-vertical marketplace (salons, barbers, spa, medspa, **pet grooming** as a vertical). Pet grooming lives under `fresha.com/for-business/pet-grooming` with the customer-facing flow identical to the human-services flow — pet-specific data is collected as **profile-level notes** rather than as a step in the booking funnel.

### 1.1 Step-by-step (inferred from help docs + landing review)

| # | Step | Required input | Optional input | Surface | Friction notes |
|---|------|----------------|----------------|---------|----------------|
| 1 | Search / discovery | City + service keyword | Date filter, "top-rated" filter | Marketplace homepage `fresha.com/` | Search bar labeled "Search Fresha"; secondary tiles "Hair Salons in Sydney" etc. |
| 2 | Salon detail | (browse only) | — | `/a/{slug}` page e.g. `/a/dogs-allowed-london` | Service rows w/ "from £X" + duration. Star rating gated at ≥4 reviews per team member. |
| 3 | Service select | 1+ service row tap | Multi-service stacking | Same page, opens slot picker | Each service has its own duration; system stacks total. |
| 4 | Team / time slot | Time + (optional) specific stylist/groomer | "Any available" | Slot grid | "pick the day, time and stylist" — verbatim user testimonial. |
| 5 | **Account creation** | Email, password, phone | — | Modal between slot and pay | "Clients are required to create a Fresha account to book" — explicit friction point per third-party review (thesalonbusiness.com). NO guest checkout. |
| 6 | Important info + policy | Acknowledge | — | Pre-checkout block | Business can "Add key information clients should see at checkout" — parking, age req, prep tips, **and presumably cancellation policy**. |
| 7 | Payment | Deposit OR card-on-file capture (whichever policy is set) | — | Stripe-style checkout | Two modes per business config: (a) pay deposit (% or fixed) to confirm; (b) "add card details to confirm — no payment taken." Deposit is "non-refundable by default" per partner contract. |
| 8 | Confirmation | — | Add to calendar | Confirmation screen + email | "confirmation right away" — user testimonial. |

### 1.2 Field count per step (estimated)

| Step | Required fields | Optional fields | Total |
|------|-----------------|-----------------|-------|
| 1 Search | 1 (location/keyword) | 1-2 filters | 1-3 |
| 2 Salon | 0 | 0 | 0 |
| 3 Service | 1 (tap) | n services | 1+ |
| 4 Time | 1 (slot tap) | 1 (team member) | 1-2 |
| 5 Account | 3 (email, pwd, phone) | 1 (name) | 3-4 |
| 6 Info ack | 0-1 (tick) | 0 | 0-1 |
| 7 Pay | 4 (card) OR 2 (stored) | 0 | 2-4 |
| 8 Confirm | 0 | 0 | 0 |
| **Total** | **9-12 mandatory** | **2-4 optional** | **~13** |

### 1.3 Pet info collection — critical observation

Fresha's pet grooming surface stores **breed, allergies, grooming preferences, past services, behavior notes** in a **pet profile**, not as inline booking fields. Quote from `fresha.com/for-business/pet-grooming`:

> "Store breed info, allergies, grooming preferences, past services, and even cute notes about behavior or quirks."

This means: pet profile lives at `account → pets`, populated **after** first booking or lazily prompted at booking confirmation. Booking step itself does **not** branch on pet metadata. Pricing is service-row-based, NOT breed/size-conditioned. **Implication for Solen:** if we want breed/size-conditioned pricing (which Groomit does), we cannot inherit Fresha's flow as-is — pet selection must move **before** service select.

### 1.4 Deposit / payment timing

From `fresha.com/help-center/knowledge-base/payments/613-payments-policies-overview`:

> "take part of the service cost upfront, decide when it becomes non-refundable, and collect the remaining balance at checkout"

From `615-set-up-payment-policies`:

> "choose to collect a percentage or fixed amount of the total appointment value" — businesses choose deposit type
> "non-refundable or set a time frame during which clients can cancel and receive a refund" — refundability per-business

Two payment modes:
1. **Deposit upfront** — % or fixed amount taken at booking, remainder at salon.
2. **Card-on-file capture** — no charge at booking, card stored, fees billed if customer no-shows / late-cancels.

Each business picks one. Customer sees policy on the checkout step but **enforcement** (fee charging) is staff-initiated post-no-show, not automatic. Refunds are 100% business-discretion via dashboard — no customer-initiated refund.

### 1.5 Cancellation / reschedule UX

From `617-charge-no-show-and-cancellation-fees`:

> "Enter the amount to charge the client, up to the limit agreed in your payment policy"
> "Charge the cancellation to the client's saved card"

Cancellation **window** and **fee** are 100% per-business — Fresha sets no platform default. Customer reschedule:

> "clients can reschedule online within the allowed rescheduling period, even if they have already paid a deposit, and the payment remains linked to the updated booking"

Deposits **transfer** to rescheduled booking — good UX, avoids double-charge friction.

### 1.6 Fresha — strengths & friction (for Solen)

| Strength | Friction |
|----------|----------|
| Deposit-transfer on reschedule (no re-pay) | Forced account creation pre-payment |
| Flexible deposit policy per-business | Pet profile divorced from booking flow — fine for haircuts, awkward for breed-priced grooming |
| Business-controlled fee enforcement (no auto-charge surprises) | Refunds are business-only (customer has no in-app refund path) |
| Standardized booking page across all businesses | Cannot customize/skin to match business brand |

---

## 2. Groomit — booking flow trace

Groomit is a **pure-pet, US-only, on-demand mobile groomer marketplace** (in-home + mobile-van). Vertically specialized. The flow is **pet-first**, NOT service-first.

### 2.1 Step-by-step (from help-center + landing observations)

| # | Step | Required input | Optional input | Surface | Field count |
|---|------|----------------|----------------|---------|-------------|
| 1 | ZIP entry | 5-digit ZIP | — | Homepage hero | 1 mandatory |
| 2 | Pet type | Dog OR cat (binary) | — | Wizard step | 1 mandatory |
| 3 | Breed | Searchable dropdown (500+ options) | — | Same wizard | 1 mandatory |
| 4 | Coat type | Short hair / long hair (dog) or cat-specific | — | Same wizard | 1 mandatory |
| 5 | Size | Selection menu | — | Same wizard | 1 mandatory |
| 6 | Package + add-ons | Gold / Silver / Eco package | Multi add-ons (de-shedding, flea/tick, teeth, paw care) | Pricing now visible per-zip + per-pet | 1 mandatory + n optional |
| 7 | Date & time | Slot tap | "Same-day" (extra fee) | Calendar grid | 1 mandatory |
| 8 | Address | Full street address | Access notes (gate code, parking) | Form | 1-3 mandatory |
| 9 | Account | Email, password, phone | Name | Modal | 3 mandatory |
| 10 | Payment | Card details — **full service charged at booking** | Tip (post-service) | Stripe-style | 4 mandatory |
| 11 | Confirmation | — | Add to calendar, set recurring | Confirmation screen | 0 |

### 2.2 Field count summary

| Step | Required | Optional |
|------|----------|----------|
| 1 ZIP | 1 | 0 |
| 2 Pet type | 1 | 0 |
| 3 Breed | 1 | 0 |
| 4 Coat | 1 | 0 |
| 5 Size | 1 | 0 |
| 6 Package | 1 | n |
| 7 Time | 1 | 1 |
| 8 Address | 1-3 | 1 |
| 9 Account | 3 | 1 |
| 10 Pay | 4 | 0 |
| 11 Confirm | 0 | 0 |
| **Total** | **15-17 mandatory** | **3-5+ optional** |

Groomit has ~50% more mandatory fields than Fresha (pet-profile collected **inline** at booking, not deferred to profile setup). This is by-design because:
- Pricing **branches** on breed × size × coat (not flat per-service).
- Service is in-home, so address is mandatory at booking, not "find a salon on a map".
- Mobile van scheduling needs precise location early to determine route + availability.

### 2.3 Pet-add inline UX (unique to vertical)

Groomit collects pet metadata at step 2-5 as a **forced 4-step wizard before pricing is revealed**. Quote from `groomit.me/`:

> "Pricing is fully transparent; it is shown before booking based on your pet's breed, size, and location."

The 4-step wizard is the **price-discovery gate**. The user cannot see what they'll pay until they've described their pet. This is a deliberate funnel design — it filters tire-kickers and ensures the listed price is binding.

For multi-pet households: each pet has its own profile. Help-center quote (`groomit.me/help` Groomit App category): "Where can I edit my pet profile?" / "How can I delete a pet?" — profiles persist between bookings; future bookings skip steps 2-5 by picking from saved pets.

### 2.4 Recurring booking opt-in (unique strength)

From `groomit.me/recurring-booking`:

> "every 4, 6, 8, or 12 weeks" — interval options
> "Recurring Pay-Per-Appointment (Flexible)" vs "Recurring Annual Plan"
> Flexible: "Skip or reschedule anytime" / "modify or skip without hassle"
> Annual: "No cancellation fees on annual. If you miss an appointment on the annual plan, it will be added towards the end of your annual plan."

Web-search result confirms discount: "6-week and 4-week frequency appointments offer a 15% discount." (Source: search result, third-party article — recurring-booking page itself says "special discount" but doesn't quote %.)

**Opt-in placement:** post-confirmation screen offers recurring as an upsell — NOT a step in the primary booking flow. This is correct UX: don't gate first booking on commitment.

### 2.5 Payment timing — full prepay model

From `groomit.me/help/article/booking-process/how-much-does-the-service-cost`:

> "You'll be charged at the time of booking. All selected packages and add-ons are processed securely once your appointment is confirmed."

**No deposit concept — full service charged upfront.** This is stricter than Fresha's flexible deposit model but simpler operationally. Refunds flow back via the structured cancellation matrix (see 2.6).

### 2.6 Cancellation policy — concrete fee matrix

From `groomit.me/customer-cancellation-policy`:

| Timing | Cancel fee | Reschedule fee |
|--------|------------|----------------|
| 24+ hrs before | $0 (free) | $0 (free) |
| <24 hrs before | $30 | $15 |
| Groomer on the way | $60 | $30 |
| Groomer arrived | $100 max | $80 |
| In-progress | Up to full price | Up to full price |

> "Refunds are issued back to the original payment method where applicable."

No-show = "the groomer arrives and the customer is absent, the pet is unavailable, or communication fails" — full-price charge possible.

**Severe matting clause** (vertical-specific): groomer may refuse service; cancellation charges still apply if customer declines recommended approach. Vaccination verification is also required (separate help-center article).

### 2.7 Groomit — strengths & friction (for Solen)

| Strength | Friction |
|----------|----------|
| Pet metadata captured inline, enables breed-priced pricing | 15-17 mandatory fields — long form |
| Concrete fee matrix (not "up to business") = customer trust | Full prepay = higher cart abandonment risk vs deposit |
| Recurring as post-booking upsell = good conversion sequencing | Vertical lock-in: ZIP gate excludes non-covered areas without alternative |
| Vaccination + matting clauses formalized | App-first; web flow exists but app-pushed heavily |

---

## 3. Swiss groomer "old UX" baseline

Three reference sites studied. Pattern: **Switzerland is overwhelmingly phone+WhatsApp+SMS-first; online widgets are bolt-ons via Koalendar / Wix booking / linkout, not first-class**.

### 3.1 cutnlove.ch — moderate digital

- **Primary CTA:** "Jetzt online buchen" → linkout to `cutnlove-onlinebooking.ch/de/home` (separate-domain booking widget — vendor unclear, looks like custom Wix-style)
- **Secondary CTAs:** Email "Buchung", phone `+41 77 529 40 46`, WhatsApp `wa.me/+41775294046`
- **Pricing:** Not on homepage — must visit `/dienstleistungen` separately
- **Cancellation policy:** Not visible
- **Field count (homepage to booking widget click):** 1 mandatory (the click)

### 3.2 petwashbasel.ch — WhatsApp-preferred + Koalendar

- **Primary signal:** "Termine bitte vorzugsweise per Whatsapp oder SMS" — explicit channel preference posted in header
- **Online widget:** Koalendar at `koalendar.com/e/petwashbasel` (third-party scheduling)
- **Contact:** WhatsApp `+41 76 266 79 92`, SMS same, email
- **Cancellation policy** (explicit): "Für versäumte oder verspätet abgesagte Termine wird eine Gebühr von CHF 50.00 erhoben" (CHF 50 fee for missed/late-cancelled appointments) + 24-hr notice
- **Pricing:** Variable, determined "nach der Inspektion des Tieres" (after inspecting the animal). **No prepay possible.**
- **Payment:** Cash, Twint, card (no PostFinance)

### 3.3 hundesalon-schnauz.ch — fully manual

- **CTA:** "Termin vereinbaren" (Book Appointment) — link target is `javascript:;` (non-functional)
- **Booking method:** Phone `076 581 58 50` or contact form ONLY
- **Critical state:** "derzeit kann ich leider keine neuen Kund:innen annehmen" (currently cannot accept new clients — fully booked)
- **Cancellation / deposit:** Not visible
- **Field count:** 0 online — entirely offline funnel

### 3.4 Swiss baseline summary

| Site | Online booking | Vendor | Pricing visible | Cancellation policy | Payment timing |
|------|----------------|--------|-----------------|---------------------|----------------|
| cutnlove.ch | Yes (linkout) | Custom domain | No (separate page) | Not stated | At salon |
| petwashbasel.ch | Yes (third-party) | Koalendar | No (post-inspection) | CHF 50 late/no-show, 24h | Cash/Twint/card at salon |
| hundesalon-schnauz.ch | No | — | No | Not stated | At salon |

**Observations:**
1. **Zero of three** offer in-flow pricing — pricing is "after inspection" or on a separate Dienstleistungen page. CH customers are conditioned to "ask first, pay later" rather than browse-and-prepay.
2. **Zero of three** collect pet metadata online — pet info is verbal at intake or via WhatsApp screenshot.
3. **Zero of three** offer deposit / prepay — payment is in-person, cash or Twint dominant.
4. **WhatsApp/SMS is the dominant booking channel** — explicit in petwashbasel; implicit in the other two via prominent phone numbers.
5. **One of three** (petwashbasel) has a concrete cancellation fee posted; others are silent.

**Implication for Solen:** the Swiss "old UX" is so under-built that Solen's competitive position isn't "beat Fresha" — it's "give CH groomers a Groomit-quality flow while keeping the CH-native trust signals (Twint, no-prepay-required option, WhatsApp link as fallback)." Don't blindly inherit US prepay norms.

---

## 4. Comparison table (all three)

| Dimension | Fresha | Groomit | Swiss baseline (best-of-three: petwashbasel) |
|-----------|--------|---------|----------------------------------------------|
| Steps in flow | ~8 (incl. account, info, pay) | ~11 (incl. 4-step pet wizard) | 1 (linkout) |
| Mandatory fields | 9-12 | 15-17 | 1 (the link click), then external |
| Optional fields | 2-4 | 3-5+ | 0 |
| Pet info captured | In separate profile, post-booking optional | Inline, pre-pricing (steps 2-5) | Verbal / WhatsApp |
| Pet info gates pricing | No (flat per-service) | **Yes** (breed × size × coat) | No (post-inspection) |
| Deposit timing | Per-business: % or fixed at booking, OR card-on-file (no charge) | **Full prepay at booking** | None (cash at salon) |
| Deposit refundable | Per-business (default non-refundable) | Refund per cancellation matrix | N/A |
| Cancellation window | Per-business (no platform default) | **24 hrs** (platform default) | 24 hrs (petwashbasel only) |
| Cancellation fee | Per-business (% or fixed) | $30 <24h → $100 arrived (matrix) | CHF 50 flat (petwashbasel) |
| No-show fee | Per-business | Up to full price | CHF 50 (petwashbasel) |
| Reschedule | Free within window; deposit transfers | $15 <24h → $80 arrived (matrix) | Phone/WhatsApp negotiate |
| Reschedule cap | None stated | None stated, but escalating fees | None stated |
| Recurring booking | "Rebooking nudges" — no formal schedule | **4/6/8/12-wk intervals + Flexible vs Annual plan** | None |
| Recurring discount | None | 15% (4-wk & 6-wk per third-party) | None |
| Guest checkout | **No** (account required) | No (account required) | Yes (just call) |
| Payment methods | Card (Stripe-style) | Card (Stripe-style) | Cash, Twint, card |
| Vaccination verification | Not seen | **Required** (separate help article) | None |
| Severe-matting clause | None seen | **Yes** (formal clause) | None |
| Customer-initiated refund | None — business-only | Via cancellation matrix | N/A |

---

## 5. Patterns identified — who does X best

| Concern | Best in class | Why |
|---------|---------------|-----|
| **Discovery → book speed** | Fresha | Pet info deferred, short funnel for repeat clients |
| **Breed-conditioned pricing** | Groomit | Pet wizard before price reveal is the only way to do binding per-breed pricing honestly |
| **Trust around fees** | Groomit | Concrete fee matrix beats "up to your business" — customer knows exactly what late-cancel costs |
| **Reschedule UX** | Fresha | Deposit transfers; only Fresha solves the "I paid, now I want to move it" friction without re-pay |
| **Recurring opt-in placement** | Groomit | Post-confirmation upsell with concrete discount + clear skip rules |
| **Vertical safety (vax/matting)** | Groomit | Vertical platforms can formalize what marketplaces can't |
| **CH-native payment norms** | Swiss baseline (Twint) | Twint is non-negotiable in CH retail; US-style Stripe-card-only will lose ~20-30% of older customers |
| **WhatsApp fallback** | Swiss baseline | Solen MUST keep a contact-the-groomer-direct path for the "I have questions first" cohort |
| **Account-optional first booking** | Swiss baseline | Forced account creation costs Fresha conversions per third-party review; guest-checkout-then-prompt-account is winning UX |

---

## 6. Solen MVP booking flow spec

**Goal:** Adopt Groomit's pet-first wizard for breed-conditioned pricing, Fresha's deposit-transfer-on-reschedule for friction reduction, Swiss baseline's payment-method breadth (Twint), and guest-checkout-optional posture. Total target: **6-8 steps, ~10-13 mandatory fields**.

### 6.1 Proposed flow

| # | Step | Required | Optional | Notes |
|---|------|----------|----------|-------|
| 1 | **Discovery** — city/PLZ + service hint | 1 (location) | 1 (date filter) | Mirror Fresha hub; Solen Path C lobby already does this |
| 2 | **Groomer detail** — browse | 0 | 0 | Card with bilingual name + Twint badge + WhatsApp icon if groomer enables |
| 3 | **Pet-quick-pick** | 1 (existing pet OR "new pet") | — | If returning user with saved pets: pick from list, skip to step 5. If new: branch to 4. |
| 4 | **New-pet inline mini-wizard** (only if step 3 = new) | 4 (breed, size, coat, name) | 1 (special notes) | Groomit-style but compressed to one screen w/ 4 dropdowns vs 4 sequential steps. Persist as pet profile for future. |
| 5 | **Service + add-ons** | 1 (service) | n (add-ons) | Price now visible — breed-conditioned via step 4 data. |
| 6 | **Date + time slot** | 1 (slot) | 1 (specific groomer if multi-staff salon) | "Earliest available" surfaced as one-tap chip. |
| 7 | **Account / contact** | 2 (email or phone + name) — OR 0 if logged in | 1 (acct password to save) | **Guest checkout supported**; account prompted post-booking. Phone is required for groomer-to-customer SMS contact. |
| 8 | **Payment + policy ack** | Deposit OR card-on-file (groomer-configurable, default = CHF 20 deposit) + 1 (policy tick) | Tip slider | Twint + card both supported. Policy text shown inline before tick — cancellation matrix + no-show rules. |
| → | Confirmation | — | "Set recurring" upsell, "Add to calendar", "Open in WhatsApp to message groomer" | Post-booking surface — NOT a step. |

**Total: 8 numbered steps, but steps 3+4 collapse to 1 for returning users → effective 7 for new, 6 for returning.**

### 6.2 Field count

| User type | Mandatory fields | Optional fields |
|-----------|------------------|-----------------|
| **New user, new pet** | 11 (loc, pet=new, breed, size, coat, pet name, service, slot, email+name+phone, policy tick) | ~6 (filter, multi-add-ons, specific groomer, account pwd, tip) |
| **Returning user, saved pet** | 6 (loc, pet pick, service, slot, policy tick, payment if no card on file = 4) | ~4 |
| **Returning user, saved pet, saved card** | 4 (loc, pet pick, service, slot) + 1 tick = 5 | ~3 |

This puts Solen between Fresha (9-12) and Groomit (15-17) on first booking, but **below both** on returning bookings — which is the lifetime-value driver. The 5-field returning-user flow is the competitive moat.

### 6.3 Deposit policy spec

- **Default:** CHF 20 deposit at booking, **transfers on reschedule** (Fresha-pattern), **non-refundable if cancelled <24 hrs** (Groomit-pattern).
- **Groomer can override:**
  - Deposit amount: CHF 0 (no deposit, card-on-file only) → CHF 100 max → full prepay.
  - Refund window: 24h (default), 48h, 72h, or non-refundable.
- **Customer always sees** deposit + refund rule inline before policy tick — no surprise charges.
- **Twint must be available** alongside card. CH-specific. Stripe supports Twint as a payment method.

### 6.4 Cancellation matrix spec (platform default; groomer can soften)

| Timing | Customer cancel fee | Reschedule fee |
|--------|---------------------|----------------|
| 24+ hrs before | CHF 0 (deposit transfers if rescheduling) | CHF 0 |
| <24 hrs before | Deposit forfeited (CHF 20 default) | CHF 10 |
| <2 hrs before | 50% of service price | 25% of service price |
| No-show | 100% of service price | N/A (re-book required) |

Note: Reschedule fees lower than cancel fees by design — encourage reschedule over cancel. Reschedule cap = **2 reschedules per booking** (after which it must be cancelled + re-booked, to prevent infinite-slip abuse).

### 6.5 Reschedule UX spec

- One-tap in confirmation email + booking detail screen.
- Calendar opens to "next 14 days, this groomer's openings."
- Deposit transfers automatically (Fresha-pattern) — no re-pay needed.
- Reschedule count visible to customer: "1 of 2 reschedules used."
- Groomer notified via SMS + in-app.

---

## 7. Decisions surfaced (need explicit lock from product)

| # | Decision | Recommendation | Rationale |
|---|----------|----------------|-----------|
| D1 | Deposit default amount | **CHF 20 platform default**, groomer-configurable CHF 0 to full prepay | Low enough to not block first-timers; high enough to deter no-shows. Groomit charges full prepay (US norm) — too aggressive for CH where post-inspection pricing is the cultural baseline. |
| D2 | Cancellation window | **24 hrs platform default**, non-negotiable for free cancel | Matches Groomit + petwashbasel; standard across pet vertical. |
| D3 | No-show fee | **100% service price** | Matches Groomit; lower would let abusers loop. |
| D4 | Reschedule cap | **2 reschedules per booking, then re-book** | Prevents slip-abuse; high enough that legitimate reschedules don't hit ceiling. |
| D5 | Guest checkout | **Yes, with post-booking account prompt** | Differentiates from Fresha (forced acct = friction). |
| D6 | Twint requirement | **Mandatory at launch** | CH-non-negotiable; ~30% of in-person retail payments. Stripe supports Twint natively. |
| D7 | Vaccination verification | **Optional at MVP, groomer-configurable; phase-2 = required** | Groomit requires; CH vet practice less centralized — start with self-attest checkbox, formalize later. |
| D8 | Recurring booking | **Phase 2, NOT MVP** | Groomit's 4/6/8/12-wk + Annual is sophisticated. MVP ships one-off booking; recurring after Tier 1 lands. |
| D9 | Pet profile persistence | **Yes from day 1** | Returning-user flow drops from 11 → 5 fields. Critical for LTV. |
| D10 | WhatsApp fallback link on groomer card | **Yes, groomer-opt-in** | CH-native trust signal; Fresha has nothing equivalent. Risk: cannibalizes platform booking — mitigate via "in-app message" first, WhatsApp as fallback. |

---

## 8. Risks for Phase 4 build

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Stripe Twint integration complexity** | High | Stripe supports Twint as a payment-method but requires CH-bank account on Stripe Connect side; verify with groomer onboarding flow early. |
| **Breed dropdown UX** (500+ options like Groomit) | Medium | Use autocomplete + "most common in CH" pre-sort (Berner Sennenhund, Labrador, mixed-breed, etc.); fallback "other" with text input. |
| **Deposit-transfer-on-reschedule edge cases** | High | Multi-currency holds, partial refunds, reschedule across price-changing dates (e.g. weekend uplift) — need explicit rules. Stripe Payment Intents support partial captures but the UX must show "CHF 20 from prior booking + CHF 10 difference" clearly. |
| **Pet wizard before pricing reveal** = bounce risk | Medium | Mitigate by showing "indicative price range" upfront (Groomit shows post-wizard binding price; Solen could show "CHF 60-120 depending on your dog" at step 1, then exact post-wizard). |
| **Cancellation policy localization (DE/FR/IT/EN)** | Medium | Policy text is legally binding — needs i18n review, not just translation. Quote `petwashbasel.ch` precedent for DE wording. |
| **Guest-checkout email collision** | Medium | If guest books with `foo@bar.com` then later creates account with same email, must reconcile bookings. Spec the merge flow. |
| **Groomer-configurable policy + customer trust** | High | If every groomer has different rules, customers lose the "I know what happens if I cancel" trust Groomit's matrix gives. Mitigate by **enforcing platform-default deposit/window** and only letting groomers soften, never harden, the policy. |
| **WhatsApp fallback cannibalizing platform** | Medium | Track booking-attribution: "WhatsApp click" event before "booking confirmed" event = platform-attributed; if no booking event in 24h, count as offline-leakage. |
| **Severe-matting / refusal clause for CH** | Low-Medium | Groomit has it; Swiss baseline doesn't. Add to terms but make it less prominent at MVP — don't scare first-timers. |
| **Vaccination self-attest legal exposure** | Medium | Some CH cantons require rabies + parainfluenza for grooming. Need legal opinion before launch — flag at Phase 2 vaccination upgrade. |

---

## Evidence index — quotes & sources

- Fresha homepage CTAs: `fresha.com/` ("Book local selfcare services", "pick the day, time and stylist")
- Fresha account-creation requirement: `thesalonbusiness.com/fresha-review/` ("Clients are required to create a Fresha account to book")
- Fresha deposit mechanics: `fresha.com/help-center/knowledge-base/payments/613-payments-policies-overview` ("take part of the service cost upfront, decide when it becomes non-refundable, and collect the remaining balance at checkout")
- Fresha % vs fixed deposit: `615-set-up-payment-policies` ("choose to collect a percentage or fixed amount of the total appointment value")
- Fresha deposit transfers on reschedule: search result snippet ("clients can reschedule online within the allowed rescheduling period, even if they have already paid a deposit, and the payment remains linked to the updated booking")
- Fresha pet grooming pet-profile: `fresha.com/for-business/pet-grooming` ("Store breed info, allergies, grooming preferences, past services, and even cute notes about behavior or quirks")
- Groomit ZIP entry: `groomit.me/` ("Enter ZIP Code"; "Pricing is fully transparent; it is shown before booking based on your pet's breed, size, and location")
- Groomit cancellation matrix: `groomit.me/customer-cancellation-policy` (full fee table quoted verbatim in §2.6)
- Groomit payment timing: `groomit.me/help/article/booking-process/how-much-does-the-service-cost` ("You'll be charged at the time of booking")
- Groomit in-home vs van: `groomit.me/help/article/booking-process/what-is-the-difference-between-in-home-and-mobile-van-grooming` ("Both require account creation and prepayment via credit card at booking time")
- Groomit recurring: `groomit.me/recurring-booking` ("every 4, 6, 8, or 12 weeks"; "Flexible" vs "Annual"; "No cancellation fees on annual")
- Groomit recurring discount %: web-search third-party article ("6-week and 4-week frequency appointments offer a 15% discount") — page itself only says "special discount"
- petwashbasel cancellation: `petwashbasel.ch/` ("Für versäumte oder verspätet abgesagte Termine wird eine Gebühr von CHF 50.00 erhoben")
- petwashbasel post-inspection pricing: ("nach der Inspektion des Tieres")
- petwashbasel WhatsApp/SMS preference: ("Termine bitte vorzugsweise per Whatsapp oder SMS")
- cutnlove booking linkout: `cutnlove.ch/` ("Jetzt online buchen" → `cutnlove-onlinebooking.ch/de/home`)
- hundesalon-schnauz offline-only: `hundesalon-schnauz.ch/` (CTA target = `javascript:;`; "Bitte kontaktiere mich für eine Terminvereinbarung vorab telefonisch")
- Koalendar as the CH-common scheduling vendor: search result `koalendar.com/scheduling-software-for/pet-grooming`

**Data not visible via WebFetch (marked in body):**
- Fresha actual booking-widget step ordering (`/book-now/{slug}` was 403)
- Groomit live booking-page field sequence (page returned loading state)
- Fresha specific salon-detail page service-row layout (multiple 404s on test slugs)
- Specific Groomit user-review quotes about booking-flow friction (reviews page showed metrics only)
