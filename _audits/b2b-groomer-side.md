# B2B / Groomer-Side Onboarding & Platform Audit

**Phase:** 0.18 (Solen → dog-grooming pivot research)
**Date:** 2026-05-13
**Status:** Phase 6 prep, non-blocking for MVP
**Scope:** How leading booking platforms onboard and serve the provider (salon / groomer) side. Used to inform Solen's eventual B2B build (Phase 6).
**Companion docs:** `_audits/2026-05-13-us-pet-grooming-leaders-audit.md` (consumer-side), `_audits/pet-grooming-scope-teardown.md`.

Evidence is quoted from primary marketing pages and pricing pages where possible. Where the page rejected scraping (marketing pages with heavy JS or auth walls), figures are reconstructed from third-party reviewers (Pabau, SchedulingKit, GlossGenius, GetApp, Capterra) and explicitly marked `[third-party]`. Anything inferred is marked `[inferred]`.

---

## 0. TL;DR — the 5 platforms in one paragraph

**Fresha** = transactional commission model. CHF 18.95/mo solo or CHF 12.95/mo per seat (Team) + **20% one-time fee on first booking from a new marketplace client** (min CHF 5). Card processing 1.29% + CHF 0.21. Self-serve onboarding, 7-day trial, no sales call. The classic "salon SaaS + marketplace" hybrid; explicitly pet-grooming-ready.
**Booksy** = pure SaaS + opt-in commission. **$29.99/mo** base + $20/seat, **+30% one-time commission on Boost-acquired first booking** (min $10, cap $100). Self-serve, 14-day trial.
**Doctolib** = enterprise SaaS, sales-led. **€139/mo** flat per practitioner, no commission. Discovery call required, no self-serve signup. Healthcare-grade, very different model from beauty/pet.
**Treatwell** = marketplace-commission-first. First-booking commission only (rate not publicly disclosed; "0% on repeat bookings" is the headline contrast vs. competitors). Daily payouts. Self-serve signup, dual app (Treatwell Connect + Treatwell Pro).
**Groomit** = aggregator / managed-marketplace (independent-contractor model). Groomer applies, gets vetted, optionally rents a Groomit-branded van ($1k refundable deposit) or uses their own. Weekly payouts. **No groomer-side commission disclosed publicly** — clients pay a separate "mobile van fee" on top of the groom price, which Groomit keeps. Curated supply, not self-serve.

**Implication for Solen:** The European beauty market (Fresha, Treatwell) converges on a **freemium-with-marketplace-commission** model; the US grooming-specific market (MoeGo, Groomsoft, Gingr) converges on a **flat SaaS subscription with no marketplace acquisition channel**. Groomit is the only pure-marketplace pet play in this set, and it solves supply by *owning the van*, not by aggregating existing salons.

---

## 1. Feature inventory — per platform

### 1.1 Source table

| Feature | Fresha | Booksy | Doctolib | Treatwell | Groomit | MoeGo (pet-specific bonus) |
|---|---|---|---|---|---|---|
| **Online calendar** | Yes | Yes | Yes | Yes (Treatwell Pro) | Yes (in Groomer Business App) | Yes ("Smart Schedule") |
| **Service catalogue / per-staff pricing** | Yes | Yes | Yes | Yes | Groomer sets own rates | Yes |
| **Pet profile (breed, allergies, photos)** | Yes — "Store breed info, allergies, grooming preferences, past services" | Generic client profile [inferred for pets] | N/A (healthcare) | Generic client profile | Yes [inferred — required for groomer prep] | Yes — vaccination tracking + grooming notes |
| **Portfolio / photo gallery upload** | Yes | Yes | N/A | Yes | N/A (groomer doesn't sell themselves; Groomit assigns) | Yes ("Grooming Report" = post-appt photo card to owner) |
| **Messaging (groomer ↔ client)** | Yes (SMS + WhatsApp, metered) | Yes | Yes | Yes | Yes (via app) | Yes (SMS + automated workflows) |
| **Payouts / payments** | Stripe-like in-house; 1.29% + CHF 0.21 | In-house processor (3rd-party reports ~3% card fee) | Bills patient-direct in DE; no in-platform payments | "Contactless payment via smartphone/tablet" — in-house | Weekly payouts; Groomit handles billing entirely | Integrated payment |
| **Marketing tools (boost / promo / email)** | "Automated marketing campaigns", "client referrals", "promotional discounts" | "Boost" (marketplace promotion) | Patient acquisition via Doctolib search | "Access to ~500,000 daily customer searches" | "Groomit invests heavily in nationwide marketing" | "Automated Workflow", "Review Booster" |
| **Reviews management (respond)** | Yes | Yes | Yes (regulated in DE — limited replies) | Yes | Groomer rating shown in-app | Yes |
| **Analytics dashboard** | Yes (performance reporting, revenue, retention) | Yes ("Detailed reports") | Yes | Yes | "Track weekly earnings", "Monitor stats and ratings" | KPI dashboard (revenue, occupancy, client growth) |
| **Multi-staff / team mgmt** | Yes (Team plan) | Yes ($20/seat) | Yes | Yes | N/A — solo contractor model | Yes ("Staffing module") |
| **Inventory / retail** | Yes ("retail tracking") | Yes [third-party] | N/A | Yes | N/A | Yes |
| **No-show protection / deposits** | Yes (deposits, cancellation policies) | Yes ("cancellation policies, collect deposits or fees, manage waitlists") | Yes ("reduces no-shows by approximately 40%") | "No-show reduction support" | N/A (Groomit absorbs no-shows in van model) | Yes |
| **Vaccination / health record gate** | [inferred from pet profile fields] | [not surfaced] | N/A | [not surfaced] | Requires client-side documentation | **Yes — explicit feature** |
| **Mobile app for the provider** | Fresha Partner app | Booksy Biz app | Doctolib Pro app | Treatwell Connect + Pro | Groomer Business App | MoeGo Pet Business Suite (iOS/Android) |

### 1.2 Notable provider-side patterns

- **Pet-specific features only appear on Fresha + MoeGo + Groomit**, not on Booksy/Treatwell/Doctolib. Fresha is the only horizontal platform that explicitly markets a pet-grooming vertical: *"baths, haircuts, nail trims, and de-shedding services with client notes for breed and behavior… feline grooming sessions, coat treatments… full grooms"* (fresha.com/for-business/pet-grooming).
- **Booksy Biz** sells itself on "**24/7 booking across our network of 44+ million users**" — i.e. the *marketplace audience* is the lead feature, not the calendar.
- **Treatwell** is the most aggressive on commission framing: *"Erstbuchung only commission… repeat bookings 0% (vs. competitor's 56%)"* — the "competitor" is presumed Fresha [inferred].
- **Doctolib** has no in-platform payment because in DE/CH healthcare patients pay via insurance card or invoice — different rails entirely. Not transferable to grooming.
- **Groomit** is the only one where **the platform owns supply infrastructure** (vans, scheduling, billing) and the groomer is a 1099 contractor, not a small-business owner. This is structurally closer to Uber than to OpenTable/Fresha.

---

## 2. Pricing model comparison

### 2.1 Side-by-side

| Platform | Base SaaS | Per-seat | New-client commission | Card processing | SMS/marketing fees |
|---|---|---|---|---|---|
| **Fresha** (CH) | CHF 18.95/mo (solo) | CHF 12.95/mo/seat (Team) | **20% one-time, min CHF 5 per new marketplace client** | 1.29% + CHF 0.21 (online/in-person); 2.20% + CHF 0.20 (manual entry); tap-to-pay +CHF 0.10/auth | 20 SMS free, then CHF 0.05/SMS; 50 emails free, then CHF 0.02; WhatsApp CHF 0.08–0.15 |
| **Booksy** (US) | $29.99/mo | $20/mo/seat | **30% one-time, min $10, cap $100** (only if Boost is on) | ~3% [third-party — gomarketbox.com] | Boost premium placement $49.99+ |
| **Doctolib** (DE) | €139/mo per practitioner | Bundled | None | None (off-platform) | Likely bundled [inferred] |
| **Treatwell** (DE/CH) | None publicly disclosed | None disclosed | First-booking commission only (rate undisclosed); "0% repeat" | Bundled into contactless payment offering | Bundled [inferred] |
| **Groomit** (US) | None (provider rents van) | N/A | Take-rate undisclosed; clients pay a separate "mobile van fee" Groomit keeps | Groomit-managed | N/A |
| **MoeGo** (US, pet-specific) | From $49/mo; tiered Starter / Growth / Ultimate; user reviews report $100–$250/mo at larger tiers | Bundled in tier | None — no marketplace | Integrated, fees not disclosed publicly | Bundled |

### 2.2 Headline pricing-model archetypes

1. **Pure SaaS, no marketplace.** MoeGo, Doctolib. Highest sticker price ($49–€139+/mo), zero acquisition. You bring your own clients.
2. **Freemium-ish SaaS + marketplace commission on first booking.** Treatwell, Fresha (post-2025 pricing change). The platform earns by being a referral engine. Best for providers without an existing client base.
3. **Pure SaaS + opt-in marketing add-on with commission.** Booksy. You pay $29.99/mo no matter what; Boost is an opt-in supply of new clients at 30% of first booking.
4. **Managed marketplace, contractor model.** Groomit. The platform owns the supply chain (vans, insurance, scheduling, billing) and pays the labour. The "groomer" is closer to a delivery driver than a small-business owner.

### 2.3 Key data point — Fresha's 2025 model change

> *"Fresha was once known for being 100% subscription-free but changed its pricing model in 2025… As of 2025, Fresha charges a monthly subscription for solo providers and per bookable team member on the Team plan."* — glossystack.com Fresha Review 2026

Industry context: Fresha bet the company on "free forever" 2018–2024 to capture market share, then introduced subscriptions once it had network effects. **Some salon owners reported feeling "blindsided"** by the shift. This is a critical lesson for Solen — see §8.

---

## 3. Onboarding flows

### 3.1 Self-serve vs sales-led

| Platform | Path | Time to first listing | Friction |
|---|---|---|---|
| **Fresha** | Self-serve. Signup → 7-day trial → set up services + calendar → publish | Same-day | Low. "Migration support" optional for larger ops. |
| **Booksy** | Self-serve. Signup → 14-day trial → set up | Same-day | Low. |
| **Doctolib** | Sales-led. Discovery form (specialty, practice size, features) → consultation call → contract | Days–weeks [inferred] | High. No self-serve. |
| **Treatwell** | Self-serve. Pick business type → signup at `connect.treatwell.de/join/` → onboarding | Same-day | Low–medium. Likely a verification step before going live [inferred]. |
| **Groomit** | **Vetted application.** Online application + document upload (license, insurance) → interview/review → sign IC agreement → set schedule and pricing in-app → go live | Days–weeks (vetting) | High. 2+ years professional experience required. |

### 3.2 What the marketing pages emphasize

- **Fresha:** "Free to start", 7-day trial, "Migration support". Self-service is the headline. Customer success managers reserved for larger operations.
- **Booksy:** "No commitment, cancel anytime". 14-day trial. CTA "List your business".
- **Doctolib:** "Limited-time offer valid through July 31, 2026 for the first 1,000 customers, with potential additional costs for data migration." Limited-quantity scarcity + price anchor. Sales-form-first.
- **Treatwell:** Pick business type (hairdressing / barbering / nails / massage / wellness / spa / skincare / aesthetics) → signup. Friendly self-serve with vertical pre-routing.
- **Groomit:** "Double your income, set your own schedule & work at your own pace". Application gates: valid driver's license, parking space for van, water access, professional grooming skills, regular platform activity, plus 2 years of grooming experience.

### 3.3 The onboarding spectrum

```
Fully self-serve <--Fresha--Booksy--Treatwell---Groomit-(vetted)----Doctolib-(sales)--> Fully sales-led
```

For Solen's Phase 6 (DE/CH pet grooming): **the European beauty-marketplace precedent is self-serve with light verification.** Sales-led only makes sense if Solen targets multi-location chains (the Doctolib model). Default to self-serve.

---

## 4. Dashboard UX patterns (from marketing screenshots & feature copy)

Direct screenshots couldn't be scraped; pattern inventory is reconstructed from third-party reviews + product descriptions:

### 4.1 Common dashboard zones across all platforms

1. **Today / Calendar** — agenda for the day. Drag-and-drop appointments. Default landing screen on every platform.
2. **Clients** — searchable client list with pet profile cards (Fresha, MoeGo). Last-visit, preferred service, notes.
3. **Inbox / Messages** — unread message count badge. Doctolib emphasises this heavily because of GDPR/healthcare context.
4. **Payments / Earnings** — running total + weekly/monthly chart. Booksy and Fresha both call it "Sales" or "Reports".
5. **Marketing** — campaign builder + boost toggles. Booksy puts "Boost" as a top-level nav item.
6. **Settings → Services / Staff / Hours / Holidays** — multi-tab settings panel.
7. **Profile / Marketplace listing preview** — what consumers see when searching. Fresha and Treatwell both surface this prominently to motivate completeness (photos, services, hours).

### 4.2 Pet-specific dashboard patterns (MoeGo + Fresha pet vertical)

- **Pet card** as the primary unit, owner is the secondary unit. (Unusual — most calendars are owner-first.)
- **Vaccination expiry alerts** in MoeGo (explicit feature).
- **Grooming Report** in MoeGo — post-appointment photo + notes auto-sent to owner. This doubles as a marketing/referral asset.
- **Behaviour / temperament notes** prominent in Fresha pet vertical ("cute notes about behavior or quirks").

### 4.3 Mobile-first vs desktop-first

- **Booksy, Fresha, Treatwell, Groomit, MoeGo** all ship dedicated provider mobile apps and treat mobile as primary. Salon owners run their day from a phone or iPad on the front desk.
- **Doctolib** treats desktop as primary (clinical settings) and mobile as supplementary. Healthcare-grade.

**Implication for Solen:** Phase 6 dashboard should be mobile-first responsive web (PWA) or native — desktop-secondary. The groomer at a sink with wet hands doesn't open a laptop.

---

## 5. Marketing tools offered (provider-facing)

| Platform | Boost / Featured slot | SEO / local discovery | Social tooling | Email/SMS marketing | Referral programs |
|---|---|---|---|---|---|
| Fresha | Marketplace search ranking + "promotional discounts" | Yes (Fresha marketplace SEO) | Profile shareable to Instagram | Yes (metered: 20 SMS / 50 emails free per seat per month) | "Client referrals" |
| Booksy | **Boost** — paid placement in Booksy marketplace at 30% of first booking + $49.99+ premium tiers | Yes | Yes | Yes | Yes |
| Doctolib | Top-of-search prioritization (algorithmic, not paid) | Strong — Doctolib dominates DE healthcare SEO | Limited (regulated) | Limited (regulated) | N/A |
| Treatwell | First-booking referral fee = the marketing tool itself | Yes — "Access to ~500,000 daily customer searches" | Yes | Yes | First booking IS the referral |
| Groomit | Groomit's nationwide marketing campaigns deliver clients | Groomit owns the SEO surface | N/A for individual groomer | N/A | N/A |
| MoeGo | "Review Booster", "Automated Workflow", lead capture from missed calls | Provider-owned SEO | Yes | Yes | Yes |

### 5.1 The "Boost" archetype

Booksy's Boost is the cleanest pay-for-acquisition model in this set: provider toggles Boost on → Booksy promotes them in marketplace search → if a new client books, Booksy takes 30% of that first booking; if no new client books, provider pays nothing. Recurring bookings from that client = provider keeps 100%.

This is structurally identical to Fresha's marketplace commission (20% first-booking-only) and Treatwell's commission model. The convergence is significant: **the European/US beauty market has settled on "first-booking-only commission" as the standard provider-side marketing mechanic.** Solen Phase 6 should default to this.

---

## 6. Payouts UX

| Platform | Payout cadence | Method | Notes |
|---|---|---|---|
| Fresha | T+ stadium [inferred, likely T+1 or T+2 via Stripe Connect-equivalent] | Bank deposit | Card processing fees deducted before payout |
| Booksy | Daily or weekly [third-party] | Bank deposit | |
| Doctolib | N/A (off-platform billing) | N/A | Patient pays direct or via insurance |
| Treatwell | **Daily** ("Zahltag-Feeling jeden Tag" — "payday feeling every day") | Bank deposit | Headline marketing feature |
| Groomit | **Weekly** | Bank deposit | Reduces groomer churn (predictable cashflow) |
| MoeGo | Per the integrated processor [inferred — Stripe-like] | Bank deposit | |

### 6.1 Stripe Connect equivalence

All beauty platforms use a Stripe-Connect-shaped model: the platform is the merchant of record, takes the swipe, deducts its fees + commission, and pushes the net to the provider. **Treatwell's daily-payout marketing is a defensible UX win** — for cash-flow-sensitive small businesses, daily payouts beat weekly. Solen should match daily as table stakes.

---

## 7. Phase 6 Solen B2B requirements — draft

These are **Phase 6 candidates**, not MVP scope. Phase 6 is deferred. Listed here so we have a target picture.

### 7.1 Required (table stakes — cannot ship a B2B side without these)

1. **Self-serve onboarding.** Fresha/Treatwell pattern. Signup → claim/create salon → verify (business registration, liability insurance certificate) → set services + hours + photos → go live. Vetting in <48h for solo groomers; manual review for multi-location chains.
2. **Calendar management.** Day/week/month views. Drag-and-drop. Working hours, blocks, holidays. Per-staff schedules.
3. **Service catalogue with custom pricing per groomer/per-pet-attribute.** Dog grooming has breed-coat-size price variance (a Bichon full groom ≠ a Newfoundland full groom). Pricing must support per-breed-size multipliers, not just flat prices.
4. **Pet profile.** Breed, coat type, weight, age, allergies, vaccinations + expiry, behaviour notes, prior service history, photos.
5. **Vaccination gate.** Optional toggle: "require proof of vaccination before booking". Pet-grooming-specific — none of Fresha/Booksy mandates this; MoeGo does.
6. **Photo upload + portfolio.** Drag-and-drop from phone. Auto-compress. Tag by service type.
7. **Reviews moderation.** Groomer can respond to reviews; flag-for-violations workflow.
8. **Stripe Connect payouts.** Daily by default. Card processing 1.5–2% all-in (priced below Fresha's 1.29% + flat to be competitive on small-ticket grooms).
9. **Analytics.** Bookings/week, no-show rate, avg rating, revenue, top services, repeat-rate.
10. **Mobile-first provider app or PWA.** Calendar + inbox + payments + check-in.
11. **No-show protection.** Card-on-file + cancellation-fee toggle. (Solen consumer side already half-built — extend to provider settings.)
12. **Messaging.** In-app chat between groomer and pet-owner. SMS optional add-on (metered).

### 7.2 Differentiating (Solen-specific bets)

13. **Vaccination/health-record interop** — DE/CH `Heimtierausweis` (EU pet passport) parsing if possible. Owner uploads once, groomer reads.
14. **Breed/coat pricing wizard.** Pre-built pricing template by breed (Goldendoodle bath+brush ≠ Goldendoodle full groom ≠ Goldendoodle de-shed). Saves new groomers 30+ min of setup time.
15. **"Solen Abo" provider toggle** — if/when subscription billing ships in Solen v2 (per `_tasks/INCOMPLETE_FEATURES.md`), let groomers opt into accepting Abo-holders at a fixed monthly rate.
16. **Multi-language UI (DE + FR + IT + EN).** Required for CH and DACH. Fresha + Treatwell both support DE; this is table stakes for the region.
17. **Cantonal / regional compliance helpers** — KMU registration check, MwSt threshold awareness. Light-touch, surfaced as warnings not blocks.

### 7.3 Deferred (post-Phase-6)

18. Boost / paid placement (only meaningful once organic supply hits >50 active groomers per metro).
19. Inventory / retail.
20. Memberships / packages (if Solen Abo absorbs this, redundant).
21. Multi-location chain dashboard (only needed once 10+ chains are on the platform).
22. Hardware POS (terminal device sales — Fresha/Booksy do this; Solen shouldn't until >500 active providers).

---

## 8. Pricing-model decision for Solen — recommendation

### 8.1 The three credible models

| Model | Provider monthly fee | Marketplace commission | Card fee | Pros for Solen | Cons |
|---|---|---|---|---|---|
| **A. Pure SaaS** (MoeGo-style) | CHF 39–69/mo | None | 1.5–1.9% all-in | Predictable provider P&L; aligns Solen with provider success; no "you took my client" friction | Doesn't reward Solen for delivering supply; high CAC payback per provider; harder to convince groomers without existing client base |
| **B. Freemium + first-booking-only commission** (Fresha 2018–2024 / Treatwell) | CHF 0 | 15–20% of first booking, min CHF 5–10 | 1.5–1.9% all-in | Zero-friction signup → faster supply onboarding; Solen earns when it delivers value (new client) | Revenue volatile early; same "blindsided" risk Fresha created in 2025 if Solen later adds a base fee |
| **C. Hybrid: low base + first-booking commission** (Fresha 2025) | CHF 12–19/mo solo, CHF 9–13/mo/seat | 15–20% of first booking | 1.5–1.9% all-in | Diversified revenue (subscription + transactional); aligned incentives | Highest perceived price; harder pitch to a solo groomer with established client base |

### 8.2 Recommendation: **Model B (freemium + first-booking commission) for Phase 6 launch; reserve right to migrate to Model C after network effects.**

Reasoning from first principles:

1. **Switzerland's grooming supply is fragmented and small-shop-dominated.** Independent groomers don't pay €100+/mo for software; MoeGo's pricing is the upper bound, not the median. A free baseline lowers signup friction to near-zero.
2. **Solen's value proposition to the groomer is "we deliver clients you don't already have."** That maps directly to first-booking commission. A flat SaaS fee asks the groomer to pay for software they could replicate with Google Calendar + WhatsApp + a Stripe link. A first-booking commission asks them to pay only for value Solen demonstrably delivered.
3. **The "Fresha blindside" lesson.** Fresha launched free-forever, captured the market, then introduced a fee in 2025 and burned trust. Solen can avoid this trap by being clear from day 1: "We charge a one-time fee on new clients we bring you. We may add tier-based subscriptions later for advanced features. Your existing client bookings are always free." Set the precedent up front.
4. **Risk reduction:** if Model B revenue is too thin, migrating to Model C is *adding* a paid tier on top of free, not *removing* free. That's an additive change, not a betrayal.

**Concrete proposal:** 18% one-time commission on first booking from a Solen-marketplace-acquired client, minimum CHF 5. Returning clients = 0%. Card processing = 1.7% + CHF 0.20. Zero monthly fee. Daily payouts via Stripe Connect.

**Counter-arguments to be aware of:**
- Pure SaaS (Model A) gives more predictable revenue and is easier to model financially. Worth re-evaluating once Solen has 200+ active groomers and the marketplace flywheel is proven.
- Model C may be necessary sooner than expected if Stripe processing margin is too thin to cover Solen's per-transaction infrastructure cost. Reserve the right to introduce a CHF 9.95/mo "Pro" tier in v2.

### 8.3 What this is NOT a recommendation for

- **Not** a recommendation on Solen Abo (consumer-side subscription) — that's a separate question.
- **Not** a recommendation on managed-marketplace (Groomit-style) — Solen is fundamentally a directory/booking platform, not a service operator.

---

## 9. Decisions surfaced for the user (Phase 6 prep, not blocking MVP)

These are flagged so they don't get silently decided by default later. Decision deferred until Phase 6 begins.

### D1. B2B pricing model (Model A vs B vs C)
**Recommendation:** Model B (freemium + 18% first-booking commission) at launch. Reserve right to introduce subscription tiers post-Phase-6.
**Decision deferred to:** Phase 6 kickoff.

### D2. Sales-led vs self-serve onboarding
**Recommendation:** Self-serve with light verification (Fresha/Treatwell pattern). Sales calls only for multi-location chains (5+ locations).
**Decision deferred to:** Phase 6 kickoff.

### D3. Vaccination gate — opt-in or mandatory?
**Recommendation:** Opt-in per-groomer setting. Some groomers require proof; others don't.
**Decision deferred to:** Phase 6 design phase.

### D4. Daily vs weekly payout cadence
**Recommendation:** Daily (Treatwell precedent). Defensible UX win.
**Decision deferred to:** Stripe Connect setup.

### D5. Required vs deferred features in v1 of the groomer dashboard
- Required for v1: items 1–12 in §7.1.
- Required for v1: items 13 (vaccination interop) + 14 (breed pricing wizard) — these are the Solen differentiators.
- Deferred: items 18–22 in §7.3.
**Decision deferred to:** Phase 6 scope-lock.

### D6. Mobile-first PWA vs native iOS/Android app for groomers
**Recommendation:** Start mobile-first PWA (already aligned with Next.js stack). Native app only once >100 active groomers and PWA limitations bite (background notifications, offline check-in).
**Decision deferred to:** Phase 6 architecture review.

### D7. Multi-location chains vs solo groomers — who's Solen's primary B2B customer?
**Open question.** Solo groomers are easier to acquire but lower LTV. Chains are higher LTV but require sales motion and richer features (multi-staff, multi-location reporting). Most platforms serve both. Recommend solo-first for Phase 6 launch, chain support added in Phase 7.
**Decision deferred to:** GTM plan.

### D8. Should Solen build its own provider-side mobile app or integrate with existing tools (Calendly/Outlook/Apple Calendar)?
**Recommendation:** Own the calendar — calendar IS the product on this side. Integrate with Apple/Google for read-only sync (so groomer sees their personal calendar overlaid). Don't try to be a thin layer over Google Calendar.
**Decision deferred to:** Phase 6 architecture review.

---

## 10. Sources

### Primary (scraped or quoted directly)
- Fresha pricing — https://www.fresha.com/pricing
- Fresha pet grooming — https://www.fresha.com/for-business/pet-grooming
- Booksy Biz — https://biz.booksy.com/en-us/
- Treatwell partner — https://www.treatwell.de/partner
- MoeGo — https://www.moego.pet/
- Groomit groomer application — https://www.groomit.me/apply-groomer

### Secondary (third-party reviewers + comparison sites)
- Pabau, "Fresha Pricing vs Pabau: Plans, Fees & Hidden Costs (2026)" — https://pabau.com/blog/fresha-pricing/
- SchedulingKit, "Fresha Pricing (2026)" — https://schedulingkit.com/pricing-guides/fresha-pricing
- Glossystack, "Fresha Review 2026" — https://www.glossystack.com/software/fresha
- TheSalonBusiness, "The Ultimate Fresha Review 2026" — https://thesalonbusiness.com/fresha-review/
- Booksy Support, "How does Boost pricing work?" — https://support.booksy.com/hc/en-us/articles/16486248108946-How-does-Boost-pricing-work
- GlossGenius, "Booksy pricing: $29.99/mo, staff fees, processing costs" — https://glossgenius.com/blog/booksy-price
- GetApp Doctolib pricing — https://www.getapp.com/healthcare-pharmaceuticals-software/a/doctolib/pricing/
- Contrary Research, "Doctolib Business Breakdown" — https://research.contrary.com/company/doctolib
- MobiHealthNews, "Doctolib 300,000 doctors" — https://www.mobihealthnews.com/news/emea/doctolib-now-used-300000-doctors-and-health-workers-across-europe
- MoeGo pricing — https://www.moego.pet/pricing
- MoeGo (Capterra) — https://www.capterra.com/p/165732/MoeGo/

### Companion Solen docs
- `_audits/2026-05-13-us-pet-grooming-leaders-audit.md` (consumer-side audit)
- `_audits/pet-grooming-scope-teardown.md`
- `_audits/2026-05-10-v3-wireup-audit.md` (V3 customer-side wireup status)
- `_tasks/INCOMPLETE_FEATURES.md` (Solen Abo subscription billing status)

---

**End of audit.** Phase 6 is deferred; this document is the brief the team will pick up when Phase 6 kicks off. Re-validate all pricing in the month before Phase 6 launch — these platforms change pricing 1–2x per year (Fresha's 2025 shift being the prime example).
