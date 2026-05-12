# Phase 0 Extensions · Deep Plan

> Locked 2026-05-13. Phase 0 (scope analysis, decisions locked as V2-D58.0)
> is complete. The user requested **deeper coverage** before moving to
> Phase 1 — adding 14 sub-phases (0.8–0.21) covering the gaps surfaced
> after the initial Phase 0 + US-leaders audit. Each sub-phase matches
> the depth of 0.1–0.7 (clear goal, sub-agent dispatches with prompts,
> specific deliverable, duration, decisions to lock). Plus 0.22
> (super-synthesis) and 0.23 (Phase 0 extensions close).
>
> Cadence: this is the deep plan. User approves → I execute 0.8–0.23 in
> sequence (or selectively per the **priority tiers** at the end).
>
> Total estimated: ~7.5 hrs if all 16 sub-phases run. Tier-by-tier
> breakdown at §end so user can pick scope.

---

## Cadence reminder

Per master plan: deep plan written → user approves → execute → lock as V2-D## entry.

Existing Phase 0 sub-steps (DONE):
- 0.1 Fresha booking UX (homepage-level)
- 0.2 Pet-platform competitor teardown (Rover + Pawshake)
- 0.3 Basel/CH dog grooming site survey (Tipaw, cutnlove, petwashbasel)
- 0.4 Pet-specific data model research
- 0.5 Service catalog inventory (CH pricing)
- 0.6 Synthesize teardown doc (`_audits/pet-grooming-scope-teardown.md`)
- 0.7 Phase 0 close + V2-D58.0 entry

Bonus already done:
- US pet grooming leaders feature audit (`_audits/2026-05-13-us-pet-grooming-leaders-audit.md`)

This deep plan adds:

| Sub-phase | Title | Tier | Duration |
|---|---|---|---|
| 0.8 | Booking flow deep-dive | 🔴 HIGH | 60 min |
| 0.9 | Mobile UX patterns | 🔴 HIGH | 60 min |
| 0.10 | Reviews + photos UX | 🔴 HIGH | 45 min |
| 0.11 | Pricing presentation model | 🔴 HIGH | 45 min |
| 0.12 | Search + filter UX | 🟡 MEDIUM | 30 min |
| 0.13 | Onboarding / first-time user | 🟡 MEDIUM | 30 min |
| 0.14 | Notification + reminder UX | 🟡 MEDIUM | 30 min |
| 0.15 | Adjacent platform booking | 🟡 MEDIUM | 45 min |
| 0.16 | Empty states + edge cases | 🟡 MEDIUM | 30 min |
| 0.17 | SEO patterns for pet grooming | 🟢 LOW | 30 min |
| 0.18 | B2B groomer-side UX (Phase 6 prep) | 🟢 LOW | 45 min |
| 0.19 | Photography + brand identity | 🟢 LOW | 30 min |
| 0.20 | Loyalty / subscription deep-dive | 🟢 LOW | 45 min |
| 0.21 | Trust + safety mechanics | 🟢 LOW | 30 min |
| 0.22 | Super-synthesis (Phase 0 v2 master doc) | — | 45 min |
| 0.23 | Phase 0 extensions close + V2-D58.0.1 entry | — | 10 min |
| **Total** | | | **~7.5 hrs** |

---

## 🔴 TIER 1 — High-impact (recommended minimum)

These four shift Phase 4 (consumer flow build) quality the most.

### 0.8 · Booking flow deep-dive (~60 min)

**Goal:** Walk through every step of an actual booking on Fresha, Groomit, and one Swiss groomer. Capture form fields per step, transitions, payment timing, deposit policy, post-confirm UX, reschedule + cancellation paths.

**Why it matters:** The abstract flow (search → groomer → service → time → confirm) is already documented. What's missing is **step-grain detail** — how many fields per step, what's mandatory vs optional, when does the deposit hit, where does cancellation surface. Without this, Phase 4 burns 1-2 hrs per step on UX discovery.

**Subagent dispatches** (3 parallel general-purpose agents):

1. **Agent A — Fresha booking walkthrough**:
   > Use Playwright to walk through a complete Fresha booking flow. Pick a real Basel salon (search "Basel salon" on fresha.com). For each step (service selection → time slot → guest details → payment), capture: (a) full-page screenshot, (b) form fields visible + required/optional status, (c) CTA labels + their hover/click states, (d) error states triggered by submitting empty form. Document the deposit policy + cancellation flow visible during booking. Output a markdown trace under `_audits/booking-flows/fresha-trace.md` + screenshots in `_audits/booking-flows/fresha-screens/`. Limit: 8 screenshots max, 700-word writeup max.

2. **Agent B — Groomit booking walkthrough**:
   > Same pattern as Agent A but for groomit.me. Pick a Mobile Spa service in a US city (Manhattan or LA). Capture pet selection step (this is unique to pet platforms — what fields appear when adding a new pet during booking?). Document the recurring booking opt-in flow. Output `_audits/booking-flows/groomit-trace.md` + `_audits/booking-flows/groomit-screens/`. Same limits.

3. **Agent C — Swiss groomer booking walkthrough**:
   > Visit cutnlove.ch (Allschwil) + hundesalon-mara.ch (Frenkendorf) booking pages. Document what the actual existing CH groomer booking UX looks like (likely Wix-form or Google Form behind the "Termin" link). Capture all form fields + the user friction this implies. Output `_audits/booking-flows/swiss-groomer-trace.md` + screenshots.

**Output (synthesis):**
`_audits/booking-flows.md` with sections:
1. Step-by-step trace for each of the 3 platforms (table format)
2. Form-field count per step + mandatory ratio
3. Deposit policy comparison (when does money hit?)
4. Cancellation policy + UX surface (where does user see this?)
5. Reschedule flow comparison
6. Mobile vs desktop differences (note where divergent)
7. **Solen MVP booking flow spec** (concrete, building from §7 of Phase 0 teardown)
8. Risks / open questions for Phase 4

**Decisions to lock at end of 0.8:**
- Deposit timing: at booking / day before / pay-at-salon
- Cancellation window + fee policy
- Reschedule UI: in-app or email link?
- Pet-add inline during booking vs require pet profile pre-existing

---

### 0.9 · Mobile UX patterns (~60 min)

**Goal:** Re-run site-teardown at 375×812 mobile across all 8 platforms previously surveyed at desktop. Mobile is 60-70% of pet platform traffic; many design decisions (search bar UX, navigation, CTA placement, form layout) diverge significantly from desktop.

**Why it matters:** Phase 4 needs mobile-first decisions on Day 1. Solen V3 header already has different mobile structure (centered wordmark + icons + login pill — per V2-D57). Other components need same mobile-first thinking. Without this, we'd ship desktop-first and retrofit mobile (~3× the cost).

**Subagent dispatches** (4 parallel general-purpose agents — each handles 2 sites):

1. **Agent A — Fresha + PetSmart mobile**:
   > Navigate Playwright to fresha.com at 375×812, then services.petsmart.com/grooming at 375×812. For each: take 3 screenshots (above-fold, mid-page card grid, footer area). Use getComputedStyle to extract: header height + structure (single bar / two bar), search bar position (top / hero / inline), CTA size + position (sticky bottom?), card grid (1-col / 2-col / horizontal-scroll?), font sizes (compared to their desktop equivalents). Output: `_audits/mobile-ux/fresha-mobile.md` + `_audits/mobile-ux/petsmart-mobile.md`.

2. **Agent B — Groomit + Scenthound mobile**:
   > Same pattern. Groomit at 375×812 → capture; Scenthound at 375×812 → capture. Note: Groomit's "Choose your groomer" gallery — how is this presented on mobile? Scenthound's subscription tier card — same. Output: `_audits/mobile-ux/groomit-mobile.md` + `_audits/mobile-ux/scenthound-mobile.md`.

3. **Agent C — Rover + Pawshake mobile**:
   > Rover.com/ch at 375×812 + Pawshake.ch at 375×812. Both are pet-care marketplaces, expected to be mobile-mature. Capture hero, service category grid, sitter/groomer card layout. Output: `_audits/mobile-ux/rover-mobile.md` + `_audits/mobile-ux/pawshake-mobile.md`.

4. **Agent D — Swiss groomers mobile**:
   > cutnlove.ch + petwashbasel.ch at 375×812. The "old UI" baseline — what's bad about their mobile? Output: `_audits/mobile-ux/swiss-groomers-mobile.md`.

**Output (synthesis):** `_audits/mobile-ux-patterns.md` with:
1. Header structure comparison (single bar vs two bar, centered logo vs left, hamburger placement)
2. Search bar UX (where + how big on mobile)
3. Service category presentation (grid vs list vs horizontal scroll)
4. Card layout (1-col always vs 2-col on plus mobile)
5. CTA strategy (sticky bottom? floating? inline?)
6. Form-flow patterns (single-step modal vs multi-step page)
7. Typography scale shifts (mobile font sizes vs desktop ratios)
8. **Solen mobile recommendations** for Phase 4 build

**Decisions to lock at end of 0.9:**
- Mobile search bar: top-of-page sticky, hero-anchored, or fullscreen takeover?
- Mobile card grid: 1-col list vs 2-col grid vs horizontal scroll
- Sticky bottom Book CTA on groomer detail: yes/no
- Mobile filter UX: bottom sheet vs full-page modal vs inline accordion

---

### 0.10 · Reviews + photos UX (~45 min)

**Goal:** Document how leading platforms display reviews (star + text + photos + responses), photo galleries (before/after, salon interior, groomer-with-dog), and trust signal placement (verified badges, "Featured" pills, review count flex).

**Why it matters:** Reviews + photos are the #1 conversion lever for any marketplace. Phase 4 build must get this right. Solen's V3 salon detail has a Reviews section, but pet grooming has specific patterns (before/after archives = breed-specific work demonstrations).

**Subagent dispatches** (3 parallel agents):

1. **Agent A — Fresha review UX**:
   > Visit fresha.com, pick a high-review salon (>500 reviews). Navigate to its detail page. Document the reviews section: rating breakdown bars (5★/4★/3★/2★/1★), sort options (newest/highest/lowest), review card anatomy (avatar / name / date / rating / text / photos / service-tag / "Read more"), salon response UX, "See all reviews" pagination/modal. Capture 5 screenshots. Output: `_audits/reviews-photos/fresha-reviews.md`.

2. **Agent B — Groomit photo + groomer presentation**:
   > Visit groomit.me. Navigate to a "Choose your groomer" detail page (named groomers like Luna/Milo/George). Document: groomer profile photo style, before/after archive UX, photo gallery navigation (lightbox? carousel? grid?), bio/about section, services-offered presentation per groomer. Output: `_audits/reviews-photos/groomit-photos.md`.

3. **Agent C — Scenthound trust signals**:
   > Visit scenthound.com. Navigate to a specific franchise location page. Document: 6-Point Wellness Check presentation, testimonials UX, before/after photo grid (if present), membership tier card design, location-team photos. Output: `_audits/reviews-photos/scenthound-trust.md`.

**Output (synthesis):** `_audits/reviews-photos-ux.md` with:
1. Review card anatomy comparison
2. Rating breakdown UX (do they show all 5★/4★/3★/2★/1★ bars?)
3. Photo gallery patterns (lightbox / carousel / grid / hover-expand)
4. Before/after archive treatment (slider, side-by-side, swipe)
5. Salon/groomer response UX
6. Trust badges + verified-pro pills (placement + style)
7. **Solen reviews section spec** for Phase 4

**Decisions to lock:**
- Review sort options: newest / highest / lowest / most-helpful?
- Photo lightbox vs in-page enlarge
- Before/after archive: dedicated tab or inline with reviews?
- Allow groomer responses to reviews: yes/no for MVP
- Verified-pro badge: when (10+ bookings? 50+? hand-verified?)

---

### 0.11 · Pricing presentation model (~45 min)

**Goal:** Capture HOW pricing is shown across platforms — exact prices vs "from X", deposit timing display, cancellation fee disclosure, size-class scaling presentation, bundle pricing, surcharge transparency (matted coat, aggressive dog).

**Why it matters:** Phase 3 schema needs to support the pricing model (flat / size-dependent / bundled). Phase 4 UI presents it. Transparent pricing = #1 differentiator vs Swiss groomers (most don't show prices online).

**Subagent dispatches** (4 parallel agents):

1. **Agent A — Fresha pricing UX**:
   > Walk through fresha.com salon detail + service selection. Capture: how is price shown (CHF X / from CHF X / range X-Y)? Is duration shown alongside? Discount UX (last-minute discount, member discount)? Service bundle pricing display? Cancellation fee disclosure (does it show this at checkout?). Output: `_audits/pricing/fresha-pricing.md` + screenshots.

2. **Agent B — Groomit pricing flow**:
   > Visit groomit.me booking flow. Note: pricing is hidden until location-locked (US zip code). Capture the pricing-after-zip-entry experience. Document size-class scaling (S/M/L/XL pricing tiers), add-on pricing (Polish $5, Breath Freshener $10), surcharge UX (matted coat, special handling). Output: `_audits/pricing/groomit-pricing.md`.

3. **Agent C — PetSmart pricing presentation**:
   > Visit services.petsmart.com/grooming. PetSmart's service catalog is comprehensive — capture how they show the full service list with prices. FURminator premium tier add-on pricing pattern. Output: `_audits/pricing/petsmart-pricing.md`.

4. **Agent D — Scenthound subscription pricing**:
   > Visit scenthound.com. Capture membership tier card design + price breakdown (what's included monthly, what's add-on). Specific tier comparison UX. Output: `_audits/pricing/scenthound-pricing.md`.

**Output (synthesis):** `_audits/pricing-presentation.md` with:
1. Pricing display patterns (table: site × strategy)
2. Size-class scaling presentation (how do platforms show "+20% for medium dog"?)
3. Add-on UX (à la carte vs bundle vs membership tier)
4. Deposit + cancellation fee disclosure timing
5. Surcharge transparency (matted coat surcharge, etc.)
6. **Solen pricing strategy** for MVP (recommend: show flat OR "from X" on cards, exact price after size selected, deposit at confirm-time, free cancellation 24hr window)

**Decisions to lock:**
- Card-level pricing display: flat / "from X" / range?
- Size-class scaling: shown on card or revealed after size pick?
- Deposit timing: at booking / day-of / never (pay-at-salon)?
- Cancellation fee: flat (CHF 10?) or percentage?
- Cancellation window: 24hr / 48hr / 12hr?
- Surcharge UX: line-item or "starting from" with disclaimer?

---

## 🟡 TIER 2 — Medium-impact (nice to have, lower urgency)

### 0.12 · Search + filter UX (~30 min)

**Goal:** Document what filters platforms expose (distance / price / rating / availability / breed-specialty / service-type) and how they present filter chips (inline / drawer / modal / accordion).

**Subagent dispatches** (3 parallel agents):

1. **Agent A — Fresha filter UX**:
   > Visit fresha.com/search. Capture all filter options visible. Document the filter UI (chip / dropdown / drawer). Note default sort. Output: `_audits/search-filter/fresha-filters.md`.

2. **Agent B — Yelp dog grooming filter**:
   > Visit yelp.com → search "dog grooming Boston". Yelp is the filter-UX exemplar for local services. Capture all filter chips + their interaction patterns. Output: `_audits/search-filter/yelp-filters.md`.

3. **Agent C — Booksy + Doctolib filters**:
   > Booksy.com (international beauty marketplace, strong filter UX) + Doctolib.de (CH medical booking, mature filter patterns). Output: `_audits/search-filter/booksy-doctolib-filters.md`.

**Output:** `_audits/search-filter-ux.md` with filter inventory + UI pattern catalog + Solen MVP filter set (5-7 chips max).

**Decisions to lock:**
- MVP filter set (distance + price + rating + size-class + service-type? + breed-specialty?)
- Filter UI: inline chips / drawer / modal?
- Default sort (rating? distance? recommended?)

---

### 0.13 · Onboarding / first-time user flow (~30 min)

**Goal:** Document new-user sign-up flow + pet profile creation timing (account-first or pet-first?) + welcome email + empty-state homepage.

**Subagent dispatches** (3 parallel agents):

1. **Agent A — Fresha first-time signup**:
   > Visit fresha.com, click sign-up. Walk through the flow, document form fields + steps + what happens after signup (welcome email? empty home? immediate booking prompt?). Output: `_audits/onboarding/fresha-onboarding.md`.

2. **Agent B — Groomit first-time signup**:
   > Same pattern on groomit.me. Note when pet profile creation happens (during signup, deferred to first booking, or optional onboarding wizard?). Output: `_audits/onboarding/groomit-onboarding.md`.

3. **Agent C — Scenthound first-time membership signup**:
   > scenthound.com sign-up flow. Membership signup is more committal than à-la-carte booking. Document the friction tradeoff. Output: `_audits/onboarding/scenthound-onboarding.md`.

**Output:** `_audits/onboarding-flow.md` with comparison table + Solen MVP onboarding spec.

**Decisions to lock:**
- Pet profile creation: required at signup, deferred to first booking, or optional onboarding wizard?
- Email verification: required to book or optional?
- Welcome email content (template + CTAs)
- First-booking incentive (free first nail trim? 10% off?)

---

### 0.14 · Notification + reminder UX (~30 min)

**Goal:** Capture notification patterns — booking confirmation email, day-before reminder, post-visit review request, multi-channel (email + SMS + push) strategy.

**Subagent dispatches** (research-based, since we can't sign up + book + wait for emails on each platform — limited to documentation + UX pattern libraries):

1. **Agent A — Fresha email pattern research**:
   > Search the web for "Fresha booking confirmation email" + "Fresha reminder email". Find screenshots from real users (Reddit, blog posts, UX gallery sites). Document confirmation email structure, reminder timing + content, post-visit review-request UX. Output: `_audits/notifications/fresha-emails.md`.

2. **Agent B — Groomit notification research**:
   > Same pattern for Groomit. Search "Groomit confirmation email" + their help docs for notification policy. Output: `_audits/notifications/groomit-notifications.md`.

3. **Agent C — Industry pattern research**:
   > Search "salon booking reminder email best practices" + "appointment SMS reminder timing". Pull insights from Twilio's notification patterns documentation + Stripe's customer comms. Output: `_audits/notifications/industry-patterns.md`.

**Output:** `_audits/notifications-ux.md` with notification matrix (event × channel × timing) + Solen MVP notification spec.

**Decisions to lock:**
- Channels MVP: email only / email+SMS / email+SMS+push?
- Reminder timing: 24hr / 2hr / both?
- Post-visit review request timing: 1 day / 3 days / 1 week?
- Booking confirmation email template (German + English)

---

### 0.15 · Adjacent platform booking patterns (~45 min)

**Goal:** Study booking-flow UX from adjacent verticals with mature patterns — Booksy (international beauty), StyleSeat (US beauty marketplace), Doctolib (CH medical booking), Zenchef / OpenTable (CH restaurant booking). Cross-vertical patterns inform the booking UX.

**Subagent dispatches** (4 parallel agents):

1. **Agent A — Booksy.com booking flow**:
   > Walk through booking on booksy.com. Document the flow + form fields + payment timing. Output: `_audits/adjacent/booksy-trace.md`.

2. **Agent B — StyleSeat booking flow**:
   > styleseat.com. Same pattern. Output: `_audits/adjacent/styleseat-trace.md`.

3. **Agent C — Doctolib booking flow**:
   > doctolib.de or doctolib.ch (CH medical booking, mature local UX). Output: `_audits/adjacent/doctolib-trace.md`.

4. **Agent D — Zenchef or OpenTable booking flow**:
   > zenchef.ch or opentable.ch. Restaurant booking — fast + low-friction. Output: `_audits/adjacent/restaurant-booking.md`.

**Output:** `_audits/adjacent-booking-patterns.md` with cross-vertical pattern synthesis. Key question: are there UX moves from medical/restaurant booking that beat Fresha-pattern for our pet-grooming case?

**Decisions to lock:**
- Adopt or reject any cross-vertical patterns identified
- Specifically: Doctolib's 3-click booking flow — does it apply to grooming?

---

### 0.16 · Empty states + edge cases (~30 min)

**Goal:** Document edge-case UX — no groomers in search radius, cancellation flow, reschedule flow, no-show policy display, payment-failed UX, groomer-cancels-on-you flow.

**Subagent dispatches** (2 parallel agents, mostly research-based):

1. **Agent A — Fresha + Groomit help-docs scrape**:
   > Visit fresha.com/help + groomit.me/help. Find articles on cancellation, reschedule, no-show, payment failures. Document policy + UX. Output: `_audits/edge-cases/fresha-groomit-policies.md`.

2. **Agent B — Empty-state UX patterns**:
   > Search for empty-state UX libraries (e.g. emptystat.es). Find pet/grooming-domain examples. Document the patterns. Output: `_audits/edge-cases/empty-states-library.md`.

**Output:** `_audits/empty-states-edge-cases.md` with edge-case spec for Phase 4.

**Decisions to lock:**
- No-show policy (fee? ban after N? warning?)
- Cancellation window + fee
- Reschedule cap (max 2 reschedules per booking?)
- Payment-failed retry UX

---

## 🟢 TIER 3 — Low-impact (defer or skip)

### 0.17 · SEO patterns for pet grooming (~30 min)

**Goal:** URL structure, meta tags, Schema.org PetService markup, local SEO (Google Maps integration).

**Subagent dispatches** (2 parallel):

1. **Agent A**: Inspect PetSmart + Petco URL structure + meta tags + Schema.org markup. Output: `_audits/seo/us-chains-seo.md`.
2. **Agent B**: Inspect Tipaw.com + cutnlove.ch + petwashbasel.ch URL + meta + JSON-LD. Document CH local SEO patterns. Output: `_audits/seo/ch-seo.md`.

**Output:** `_audits/seo-patterns.md` with Solen SEO recommendations for Phase 5.

**Decisions to lock:**
- URL pattern: `/dog-grooming/basel` vs `/groomer/[slug]` vs `/basel/dog-grooming/[slug]`?
- Schema.org markup: LocalBusiness + PetService + AggregateRating
- City-specific landing pages (Phase 5)?

---

### 0.18 · B2B groomer-side UX — Phase 6 prep (~45 min)

**Goal:** How do platforms onboard + serve groomers? What does the dashboard look like (from public-facing materials)?

**Subagent dispatches** (3 parallel agents):

1. **Agent A — Fresha for Business**:
   > Visit fresha.com/business or partners.fresha.com. Document the salon-onboarding pitch, dashboard preview screenshots, feature list, pricing. Output: `_audits/b2b/fresha-business.md`.

2. **Agent B — Groomit Salon Partnership Program**:
   > groomit.me/salon-partnership. Same. Output: `_audits/b2b/groomit-partners.md`.

3. **Agent C — Booksy Biz + Doctolib Pro**:
   > booksy.com/biz + doctolib.de/pro. Compare patterns. Output: `_audits/b2b/booksy-doctolib-biz.md`.

**Output:** `_audits/b2b-groomer-side.md` with Phase 6 requirements draft. Note: actual Phase 6 build is deferred per master plan.

**Decisions to lock (Phase 6 prep, not blocking):**
- Self-service groomer onboarding flow
- Pricing model for B2B (free / freemium / commission?)
- Calendar management features priority

---

### 0.19 · Photography + brand identity (~30 min)

**Goal:** How do leaders use real dog photos vs illustrations? Color treatment? Diversity in breeds shown? Lifestyle vs studio?

**Subagent dispatches** (2 parallel agents):

1. **Agent A — Photo style across 4 US platforms**:
   > Collect photo references from petsmart, petco, groomit, scenthound. Categorize: real photos vs illustration, studio vs lifestyle, breed diversity, dog-with-human vs dog-alone, color treatment (warm filter / cool / neutral). Output: `_audits/photography/us-platforms.md`.

2. **Agent B — CH + EU pet brand visuals**:
   > Tipaw, Pawshake.ch, plus Zooplus, Fressnapf for CH/EU pet brand visual references. Output: `_audits/photography/ch-eu-pet-brands.md`.

**Output:** `_audits/photography-brand-patterns.md` informing Phase 2 brand decisions.

**Decisions to lock (Phase 2):**
- Hero imagery: real photo vs illustration
- Card photography: studio (clean bg) vs lifestyle (in-context)
- Breed diversity guidelines (don't only show poodles + goldens)

---

### 0.20 · Loyalty / subscription deep-dive (~45 min)

**Goal:** Scenthound subscription, Groomit recurring, Fresha gift cards, retention plays, lifetime value modeling.

**Subagent dispatches** (3 parallel agents):

1. **Agent A — Scenthound subscription tier deep-dive**:
   > Visit scenthound.com membership/pricing page. Document each tier (Clean Start basic + paid tiers): what's included, monthly price, cancellation, upgrade path. Output: `_audits/loyalty/scenthound-tiers.md`.

2. **Agent B — Groomit recurring booking config**:
   > Visit groomit.me. Walk through setting up a recurring booking. Document cadence options (every 4 weeks? 6? 8?), savings shown, modification UX. Output: `_audits/loyalty/groomit-recurring.md`.

3. **Agent C — Fresha gift cards + loyalty**:
   > fresha.com. Document gift card flow, loyalty points system if any, referral programs. Output: `_audits/loyalty/fresha-loyalty.md`.

**Output:** `_audits/loyalty-subscription-patterns.md` with Solen Abo v2 spec draft.

**Decisions to lock (v2 prep):**
- Subscription tier names + included services
- Cadence options
- Recurring booking UX in MVP (defer? or include as basic?)

---

### 0.21 · Trust + safety mechanics (~30 min)

**Goal:** Groomer verification, insurance, vaccination enforcement, dispute resolution UX.

**Subagent dispatches** (2 parallel agents):

1. **Agent A — Groomit trust + safety**:
   > Visit groomit.me/trust-and-safety or equivalent. Document groomer verification process, insurance coverage, vaccination requirements + enforcement, dispute resolution UX. Output: `_audits/trust-safety/groomit-trust.md`.

2. **Agent B — Scenthound + PetSmart trust mechanics**:
   > Scenthound's franchise quality assurance + PetSmart's groomer training + safety standards. Output: `_audits/trust-safety/chains-trust.md`.

**Output:** `_audits/trust-safety-mechanics.md` with Solen MVP trust spec.

**Decisions to lock:**
- Groomer verification process for MVP (manual / auto / hybrid?)
- Insurance requirement (do we require Haftpflichtversicherung from groomers?)
- Vaccination enforcement (optional MVP / required v2 per Phase 0)
- Dispute resolution channel (in-app / email / phone?)

---

## 0.22 · Super-synthesis — Phase 0 v2 master doc (~45 min)

**Goal:** Combine all findings from 0.8–0.21 into an updated Phase 0 master doc that supersedes / extends `_audits/pet-grooming-scope-teardown.md`.

**Action:** Read all sub-phase output docs. Write `_audits/pet-grooming-scope-teardown-v2.md` with:
1. Original 10 sections (unchanged from v1)
2. NEW §11: Booking flow detailed spec
3. NEW §12: Mobile UX recommendations
4. NEW §13: Reviews + photos UX spec
5. NEW §14: Pricing strategy
6. NEW §15: Search + filter recommendations
7. NEW §16: Onboarding flow spec
8. NEW §17: Notification + reminder spec
9. NEW §18: Adjacent platform inspiration
10. NEW §19: Edge cases catalog
11. NEW §20: SEO recommendations (Phase 5 prep)
12. NEW §21: B2B requirements (Phase 6 prep)
13. NEW §22: Photography brand guidelines (Phase 2 input)
14. NEW §23: Loyalty + subscription v2 spec
15. NEW §24: Trust + safety mechanics
16. NEW §25: Final lockdown — full MVP feature spec + Phase 1 prereqs supplements

Output deliverable: `_audits/pet-grooming-scope-teardown-v2.md` (~3000-4000 lines if all 14 sub-phases ran).

---

## 0.23 · Phase 0 extensions close + V2-D58.0.1 entry (~10 min)

**Goal:** Lock the extended Phase 0 findings as `V2-D58.0.1` in `_tasks/V2_REBUILD_LOG.md`.

**Format:**
```
**2026-05-13 (V2-D58.0.1 — Phase 0 extensions complete)** — 14 new
sub-phases (0.8-0.21) shipped after user requested deeper coverage:
booking flow deep-dive, mobile UX, reviews/photos UX, pricing
presentation, search/filter UX, onboarding, notifications, adjacent
platforms, edge cases, SEO, B2B prep, photography, loyalty, trust.
Output: 14 sub-phase docs + super-synthesis at
_audits/pet-grooming-scope-teardown-v2.md. Phase 1 (codebase audit)
remains unblocked but now executes against a much richer scope spec.
Estimated savings on Phase 4 build budget: 3-5 hrs (reduced UX
discovery during implementation). ·
```

Plus commit + push.

---

## Subagent dispatch strategy (the "alot of subagents" bit)

For each 🔴 HIGH sub-phase (0.8–0.11): 3-4 parallel general-purpose agents per sub-phase.
For each 🟡 MEDIUM sub-phase (0.12–0.16): 2-3 parallel agents.
For each 🟢 LOW sub-phase (0.17–0.21): 2 parallel agents.

**Total parallel agent dispatches if all 14 sub-phases run:** ~38 agent runs.

**Why parallel:** sub-phases are independent (Fresha booking flow doesn't depend on Mobile UX patterns). Running in parallel saves wall-clock time. Each agent gets a self-contained prompt (per the agent dispatch specs above).

**Synthesis happens AFTER agents complete:** I read all agent outputs + write the per-sub-phase synthesis. Agents are research workers; synthesis is mine.

---

## Risks per sub-phase tier

| Tier | Risk | Mitigation |
|---|---|---|
| 🔴 HIGH | Agent dispatches may hit rate limits or be blocked on geo-restricted sites (Petco) | Document blocks + work around (use Wayback Machine snapshots if blocked) |
| 🔴 HIGH | Booking flows may require auth → agent can't complete the trace | Document up-to-auth + note "completes flow behind auth" with public-info inference |
| 🟡 MEDIUM | Notification + reminder research is third-hand (no live sign-up) — accuracy may be lower | Mark inferred patterns as "inferred from N user reports" |
| 🟢 LOW | B2B Phase 6 prep is "draft only" — not blocking; over-investment risk | Time-box 0.18 hard to 45 min |
| ALL | Scope creep — each sub-phase could expand indefinitely | 30-60 min hard caps per sub-phase, agent prompts have word/screenshot limits |
| 0.22 | Super-synthesis may grow to 5000+ lines and become unreadable | Hard cap at 200 lines per new section; reference sub-phase docs for detail |

---

## What approves Phase 0 extensions to execute

User picks a tier scope:

- **(A) Full execution** — all 14 sub-phases (0.8–0.21) + 0.22 + 0.23. ~7.5 hrs total.
- **(B) HIGH tier only** — 0.8–0.11 + 0.22 super-synth + 0.23 close. ~4 hrs.
- **(C) HIGH + MEDIUM tier** — 0.8–0.16 + 0.22 + 0.23. ~5.5 hrs.
- **(D) Selective** — user names which sub-phases. Time scales linearly.
- **(E) Skip extensions, run Phase 1 now** — accept Phase 0 v1 as locked, move on. This option exists because Phase 1 isn't blocked.

My recommendation: **(B) HIGH tier only.** The 4 HIGH sub-phases (booking deep-dive + mobile UX + reviews-photos + pricing) deliver ~80% of the implementation-quality lift. Phase 4 build saves 3-5 hours. MEDIUM and LOW tiers are interesting but lower ROI per hour.

If user says "alot of stuff" should override → **(A) Full execution** is the path. Just budget 7.5 hours.

User says scope + I execute.
