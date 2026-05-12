# Pet Grooming Scope Teardown · v2 (Phase 0 + Phase 0 Extensions)

> Locked 2026-05-13. Master synthesis combining original Phase 0 (V2-D58.0)
> + 14 extension sub-phases (V2-D58.0.1, executed by 14 parallel research
> agents). This doc is the **decision index** — detail lives in 14
> per-sub-phase docs linked from each section.
>
> Original Phase 0 v1 at `_audits/pet-grooming-scope-teardown.md` (preserved).
> US-leaders feature audit at `_audits/2026-05-13-us-pet-grooming-leaders-audit.md`.
>
> If you need the "what / why / how" detail: read the linked sub-phase doc.
> If you need the "what decided + ready to build" answer: this doc.

---

## §1-§10 — Original Phase 0 (preserved from v1)

Sections 1-10 in `_audits/pet-grooming-scope-teardown.md` stand:

1. Market context (validation of pivot premise)
2. Fresha UX patterns we steal
3. Pet-platform competitor analysis
4. CH dog grooming baseline (the "old UI" we displace)
5. Pet-specific data requirements
6. Service catalog MVP (8 services)
7. Booking flow spec (high-level)
8. MVP feature scope (in / out / deferred)
9. Open decisions for Phase 2 (brand)
10. Phase 1 prerequisites

Plus US-leaders supplements: MVP service count 8 → 9 (add Quick Wash), Mixed Breed checkbox, phone backup, wellness > spa positioning, "Solen Versprechen" branded promise, schema-aware subscription support.

**Below are the 14 NEW sections from Phase 0 extensions.**

---

## §11 · Booking flow detailed spec

📄 Detail: `_audits/booking-flows.md` (booking-flow audit across Fresha, Groomit, 3 Swiss groomers)

**Headline:** Fresha = 8-step / pet-info-deferred-to-profile / per-business deposit policy. Groomit = 11-step / pet-first 4-step wizard / full prepay. Swiss baseline = WhatsApp/SMS, post-inspection pricing, zero online pet metadata.

**Solen MVP flow locked (8 steps, collapses to 5-6 for returning users):**

```
1. Home → search (location + service + date)
2. Results → groomer cards (photo / name / rating / price-from / distance)
3. Groomer detail → photos / services / reviews / about / map / phone CTA
4. Service pick(s) → multi-select base + add-ons; size class drives price reveal
5. Pet pick → existing profile OR inline "add new pet" wizard (5 required + 4 optional fields)
6. Time slot → groomer's available slots, calendar w/ morning/afternoon/evening groupings
7. Confirm → CHF 20 platform-default deposit OR pay-at-salon (groomer-configurable);
   24h free-cancel window stated; Twint mandatory + Stripe Card; deposit transfers on reschedule
8. Confirmation → email + add-to-calendar + 24hr SMS reminder scheduled
```

**Returning user flow** (collapses 5-6 steps): saved pet pre-selected, payment-on-file, single-page confirm.

**Locked decisions:**
- Deposit: **CHF 20 platform-default**, groomer can override; deposit **transfers on reschedule** (no double-charge)
- Cancellation: **24h free** window, then 50% fee inside 24h, 100% no-show
- Reschedule cap: **2 per booking** (soft cap, support contact for 3rd)
- Guest booking: **YES** — first-time users can book without account creation, magic-link claim later
- Pet profile timing: **deferred to first booking** (inline 4-step wizard during step 5)
- WhatsApp fallback: groomer-opt-in; if enabled, "Per WhatsApp anfragen" link surfaces next to Book button
- Twint: **mandatory** at launch (CH expectation); Stripe Card as parallel option
- Recurring booking: **deferred to v2** (Solen Abo)

**Open question pulled forward to Phase 4:** breed-dropdown UX — Groomit's "Mixed Breed?" checkbox + free-text fallback is the locked pattern, but combobox + autosuggest from a curated breed list TBD.

---

## §12 · Mobile UX patterns

📄 Detail: `_audits/mobile-ux-patterns.md` + screenshots in `_audits/pet-refs/mobile/`

**Headline:** Across 8 platforms scanned at 375×812. Header consensus = 60-72px single-bar sticky transparent (Fresha 72px, Rover 62px). Scenthound's 146px 2-bar = outlier. Hamburger top-right wins 6:1. Only marketplaces (Fresha, Rover) put search in the hero. Only 2/8 ship sticky-bottom CTA.

**Locked decisions for Phase 4 (mobile-first build):**

| Decision | Lock |
|---|---|
| Header structure | 1-bar **64px sticky**, transparent-on-scroll-up / solid-on-scroll-down |
| Logo position | left (Solen wordmark + terracotta dot) |
| Hamburger | **top-right 40×40** (matches 6/8 platforms) |
| Search bar | **Hero pill**, `radius: 20px`, font 14px; on tap → fullscreen takeover (already in V3 V2-D51) |
| Sticky bottom CTA on homepage | **NO** (avoids visual noise) |
| Sticky bottom CTA on groomer detail | **YES** — "Termin buchen" emerald gradient pill |
| Card grid | **2-col 165px wide** (matches Fresha pattern); 1-col below 360px viewport |
| Category tiles | **1-col 343px** stacked (matches Pawshake pattern) |
| Form input min-height | **16px font / 44px touch-target** (Apple HIG) |
| Bottom-sheet for filters | YES (covered in §15) |

**Outstanding from §0.9 agent:** results-page filter UX needs separate mobile scan once results page exists (Phase 4).

---

## §13 · Reviews + photos UX

📄 Detail: `_audits/reviews-photos-ux.md`

**Headline:** Groomit's `/reviews` histogram (% per star tier) is the most transparent pattern — copy. Fresha's "Service Portfolio" (tag each photo to a bookable service) is the best gallery-to-conversion lever — copy. Groomit's pet-name-in-review-attribution ("Sylvia is always great with our American Eskimo, Luna") is the story-grade detail that turns generic reviews into mappable ones — make it a structured field.

**Locked decisions for Phase 4:**

| Decision | Lock |
|---|---|
| Review card anatomy | Avatar (pet photo OR owner photo) + name + date + 5★ row + text + pet metadata chip (breed × age) + photos (optional) |
| **Pet-name-as-avatar** | **YES** — pet owners identify with their dog. Falls back to owner photo, falls back to initial-color avatar. |
| Rating breakdown bars | YES — show all 5★/4★/3★/2★/1★ with % per tier (Groomit pattern). On hover/tap → filter reviews by star tier. |
| Sort options | **Newest** (default) + Highest + Lowest |
| Photo gallery | **Lightbox modal** with prev/next + ESC close (matches V2-D53.3 SalonLightbox already built) |
| Before/after archive | **Tag-on-photo** (Fresha pattern: each photo tagged to a service). Display as service-filterable grid. |
| Owner response UX | **Deferred to v2** — not visible on any of 3 platforms researched at customer level; defer |
| Verified pro badge | **Hand-verified manual at MVP** (Basel only). Show "Solen Geprüft" pill on profile + cards. Automate v2. |
| Star color | **TBD** — Fresha = yellow `#FFC00A`, Solen V3 = emerald accent / terracotta heartbeat. Phase 2 brand decides. |

**Open question:** is the V3 emerald-on-everything rule violated by yellow stars? Phase 2 brand call. Both `#FFC00A` (Fresha standard) and `#C97A57` (V3 terracotta) are options.

---

## §14 · Pricing presentation strategy

📄 Detail: `_audits/pricing-presentation.md`

**Headline:** Fresha = neutral marketplace "from £X · 30 min" on cards. Groomit = ZIP-gated then 5 fixed package tiers (Gold $120 / Eco $100 / Silver $111 / Pearl $80 / Refresh $80). PetSmart = catalog model with collapsed S/M/L = $40.99 bath / $76 full groom, XL stepped up; flat add-ons. Scenthound = 3 membership tiers + 25% non-member surcharge.

**Locked Solen MVP pricing strategy:**

| Decision | Lock |
|---|---|
| Card-level pricing | **"ab CHF X · 60 Min."** (German "from"). Always show duration alongside price. |
| Size-class scaling reveal | After service-pick, before time-pick — modal shows "S CHF 40 / M CHF 50 / L CHF 65 / XL CHF 85" with size selector |
| Add-on UX | **À la carte list** (PetSmart pattern), NOT Groomit bundle. User picks base service + checkbox add-ons. |
| Deposit | **CHF 20 platform-default**, groomer-overridable. Card-on-file required even if deposit is CHF 0. |
| Cancellation policy display | At step 7 confirm, BOTH summary card AND checkout footer. Plain language: "Stornierung 24h vorher kostenlos · später 50% · No-show 100%". |
| Surcharges (matted coat, aggressive dog) | **Line-item with floor price**: "Verfilztes Fell-Zuschlag: ab CHF 20 (Groomer schätzt vor Ort)". Never silent. |
| Subscription / Solen Abo | **Deferred to v2.** Schema-aware in Phase 3 (subscriptions table + bookings.subscription_id). |
| Gift cards | **Deferred to v2.** |
| Member discounts | **Deferred to v2** (no membership exists in MVP). |

**Pushback notes** from agent on #4 (deposit) + #5 (cancellation) + #6 (surcharges): less confident on these — user should review and override if CH market signals different.

---

## §15 · Search + filter UX

📄 Detail: `_audits/search-filter-ux.md`

**Headline:** Cross-platform convergence — inline chip-row (top 3-5 filters) + drawer/bottom-sheet for everything else + active-filter chip row below results. Default sort = "Recommended" never distance-first (surfaces nearest-not-best). URL query string persistence is non-negotiable for shareable searches.

**Locked Solen MVP filter set (5 chips):**

| # | Filter | UI |
|---|---|---|
| 1 | **Distance** | Slider 1-50km, default = 10km |
| 2 | **Price** | Range slider or 3 buckets (€ / €€ / €€€) |
| 3 | **Rating** | Binary toggle "4★+" |
| 4 | **Availability** | Date-picker (matches step 1 of booking flow) |
| 5 | **Service / Specialty** | Multi-select from MVP 9 service catalog |

**Deferred to v1.5** (Phase 4 extension): Dog-size filter (groomer-side accepts S/M/L/XL?) + Breed-specialty (Westie / Poodle / mixed-breed-expert). Reason: zero-result filters are dead ends (Baymard rule) — need groomer profile schema first.

**UI patterns locked:**

- Desktop: inline chip row + right-side 380px drawer
- Mobile: inline chip row + bottom-sheet drawer with sticky "X Groomer anzeigen" CTA + `Filters (N)` count badge
- Active-filter chip row below results (each chip = X to remove)
- URL persistence: `?distance=10&price=2&rating=4&date=2026-05-20&services=bad,schnitt`
- Default sort: **Recommended** (blend rating × distance × availability × profile completeness)

**Open questions** (Phase 4 build):
- Groomer profile schema for size/breed-specialty (needed before §15.1 v1.5 filter)
- Pricing model normalization (€ buckets — what defines them?)
- Availability semantics (next 24h / next 7 days / specific date?)
- Map view (ship vs defer to v2)
- Geolocation prompt UX

---

## §16 · Onboarding / first-time user flow

📄 Detail: `_audits/onboarding-flow.md`

**Headline:** Fresha = OAuth-light marketplace (Google + Facebook + Apple + email fallback), email verification gates booking not browsing. Groomit = best Solen analogue — open browsing, account required at booking, pet inline DURING booking. Scenthound = $25 trial visit anchor, no online pet profile.

**Locked Solen MVP onboarding:**

| Decision | Lock |
|---|---|
| Auth | **Email/password + Google OAuth + Apple OAuth** (skip Facebook — pet-owner demographics) |
| Account creation timing | **Required at first booking** (or guest-then-magic-link claim per §11) — NOT at first browse |
| Email verification | **Required to book**, not to browse. Magic-link email immediate. |
| Pet profile creation | **Deferred to first booking** (inline 4-step wizard at step 5 of booking flow) |
| First-booking incentive | **CHF 10 off first booking**, auto-applied (no code), 30-day expiry |
| Welcome email | Sent within 5 min of signup. Single CTA: "Salons in Basel entdecken". DE + EN templates locked. |
| Empty home state (returning user no bookings) | Behave as discovery surface — nearby groomers + last-minute + popular this week. NO "you have no bookings" copy. NO sad-dog illustration. |
| First-time empty state on logged-in home (account created but no booking yet) | Same as empty home state above, with subtle "Erster Termin? CHF 10 Rabatt automatisch beim Check-out" banner |

**Open from agent §0.13:**
- Promo code vs auto-applied discount (locked: auto-applied)
- Trial visit anchor (Scenthound's $25) vs % discount (locked: CHF 10 flat)
- OAuth provider mix (locked: Google + Apple, not Facebook)

---

## §17 · Notification + reminder UX

📄 Detail: `_audits/notifications-ux.md`

**Headline:** Industry default = 24h reminder + optional 2h (25-40% no-show reduction). Channel hierarchy = email (free, rich content) + SMS (high open rate, paid). Pet-vertical unlock = pet-name in subject line ("How was Bella's groom?").

**Locked Solen MVP notification spec:**

| Event | Channels | Timing | Provider |
|---|---|---|---|
| Booking confirmation | Email only | Immediate | Resend |
| 24h reminder | Email + SMS | 24h before appointment | Email: Resend; SMS: eCall (Swiss) |
| 2h reminder | Email + SMS | 2h before, opt-in | Same |
| Post-visit review request | Email | 24h after appointment | Resend |
| Cancellation confirmation | Email + SMS | Immediate | Same |
| Reschedule confirmation | Email + SMS | Immediate | Same |
| Payment failure | Email | Immediate + retry chain | Resend |

**Provider picks:**
- **Resend** for email (Next.js DX, transactional, $20/mo for 50k emails)
- **eCall.ch** for SMS (Swiss, GDPR/DSG compliant, direct carrier interconnect, ISO 27001)

**Templates locked** (DE + EN in `_audits/notifications-ux.md`):
- Booking confirmation email
- 24h reminder email + SMS
- Post-visit review email
- Cancellation confirmation

**Push notifications:** **Deferred to v2** (requires native app OR web push consent).

**Compliance risks:**
- Swiss UCA Art 3 lit. o: STOP/opt-out required in EVERY SMS (legal)
- Transactional and marketing must be separate Resend streams (GDPR)
- Customer must opt-in to SMS reminders (not opt-out) — surface at checkout

---

## §18 · Adjacent platform inspiration

📄 Detail: `_audits/adjacent-booking-patterns.md`

**Headline:** Doctolib's "3-click booking" reputation is myth — it's 6 screens with 1 task each. **OpenTable's results-card slot-pills** = the biggest UX leap available (2-3 nearest available slots on the salon card itself, one tap = booking initiated). StyleSeat's "charge card 1 hour AFTER appointment" = strongest no-show defense without psychological friction. OpenTable's guest booking + magic-link claim = conversion-best auth model.

**Cross-vertical patterns to adopt:**

1. **OpenTable slot-pills on results cards** — show 2-3 available time slots on the groomer card itself (next 7 days), tap = pre-fills booking. Fresha doesn't do this; Solen can be first.
2. **OpenTable guest-then-claim** — guest can book with email + phone, account auto-created with magic link in SMS confirmation. Reduces signup friction.
3. **Doctolib 1-task-per-screen** — each step does ONE thing well. Makes 6 steps feel fast. Adopt this pacing for Solen mobile.
4. **StyleSeat defer-charge** — card-on-file at booking, charge 1hr after appointment (so user doesn't get charged for cancellable bookings). Alternative to CHF 20 deposit upfront.

**Patterns to reject:**
- Doctolib's insurance-card-upload step (not applicable to pet grooming)
- StyleSeat's tip-in-chair UX (CH doesn't tip)
- OpenTable's zero-payment default (pet grooming has higher no-show economics than restaurants — needs deposit OR defer-charge)

**Decision pulled forward:** **StyleSeat's defer-charge model** OR **CHF 20 upfront deposit**? Both viable. Defer-charge has better conversion; deposit has better cashflow + commitment. **Default = upfront deposit, but A/B test deferred-charge in Phase 4 if conversion is poor.**

---

## §19 · Empty states + edge cases

📄 Detail: `_audits/empty-states-edge-cases.md`

**Headline:** Groomit policy as the model (24h notice → 75% fee, 4hr → 100%, no-show → 100% + future deposit). Fresha shows policy in checkout (canon). Airbnb's AirCover provides the precedent for groomer-cancels (full refund + active rebooking + 72h credit). Stripe declines = soft/hard taxonomy + Smart Retries.

**Locked Solen MVP edge-case spec:**

| Scenario | UX + Policy |
|---|---|
| **Cancel 24h+ before** | Free. 1-click in app + email confirmation. |
| **Cancel <24h** | 50% fee. Modal warns before confirm. |
| **No-show** | 100% fee + 30-min grace period (groomer marks as no-show at appt time + 30min) |
| **Customer-initiated reschedule** | Soft 2-cap per booking. 3rd → support contact. Deposit transfers. |
| **Groomer cancels** | Airbnb-style: full refund + active rebooking (Solen surfaces 3 alternative groomers) + 72hr CHF 10 credit |
| **Payment failure at checkout** | Inline retry with **60s slot hold** (don't lose the slot) + TWINT fallback |
| **No groomers in radius** | Friendly empty state with: "Keine Groomer im Umkreis von Xkm. Weiter suchen in Bern/Zürich?" + radius expander |
| **No availability for selected date** | Show: "Kein freier Termin am [date]. Nächster freier: [next-date]. Andere Daten zeigen." |
| **No reviews yet** | Skip reviews section entirely (don't show "0 reviews" — psychologically negative) |

**Empty state illustration register:**
- **Line-art two-tone illustrations** (matches V3 Earthen Wellness Light aesthetic)
- **NO Lottie animations** (over-cute for Solen warmth)
- **NO mascots** (Solen brand is calm, not playful-Pet-startup)

**Decisions locked:**
- Cancellation window: **24h**
- Cancellation tier fee: **0% / 50% / 100%** (free / late / no-show)
- No-show grace: **30 minutes** after appointment time
- Reschedule cap: **2 per booking (soft)**
- Deposit (recap from §14): **CHF 20 platform-default**, transfers on reschedule
- Provider-cancels UX: **Airbnb-style** (full refund + 3 alternative offers + CHF 10 credit)
- Payment retry UX: **inline 60s slot hold + TWINT fallback**

**Open questions:**
- Groomer-side cancel-penalty (do groomers pay when they cancel? Suggested: CHF 25 first time / CHF 50 repeat / suspend after 3)
- TWINT processor — confirm Stripe Connect can charge TWINT to groomer's payout account

---

## §20 · SEO patterns

📄 Detail: `_audits/seo-patterns.md`

**Headline:** Fresha's `/lp/[lang]/bt/[category]/in/[cc]-[city]` is the dense indexable matrix. PetSmart uses suffix-style `/[state]/[city]/[neighborhood]/grooming`. Tipaw uses `/[country]/[lang]/...`. **No `PetService` Schema.org type exists** — use `LocalBusiness` + `Service[]` with `serviceType: "Dog grooming"` + `BreadcrumbList` + `@graph` with `@id` linking. CH single-business sites emit zero structured data — marketplace differentiation opportunity.

**Locked Solen SEO strategy** (Phase 5 execution):

| Decision | Lock |
|---|---|
| URL pattern (groomer detail) | **`/[locale]/[city]/hundepflege/[slug]`** (e.g. `/de/basel/hundepflege/atelier-pfoetli`) |
| URL pattern (city landing) | **`/[locale]/hundepflege/[city]`** (e.g. `/de/hundepflege/basel`) |
| URL pattern (service category) | **`/[locale]/[city]/hundepflege/services/[service-slug]`** |
| German URL slug term | **`hundepflege`** (over `hundecoiffeur` / `hundesalon` — more searched per Google Trends + neutral between regional dialects) |
| Schema.org markup | **LocalBusiness** + **Service[]** (with `serviceType: "Dog grooming"`) + **AggregateRating** + **BreadcrumbList** in JSON-LD, `@graph` + `@id` linked |
| Locales at MVP | **de-CH + en-CH** (FR + IT deferred to Phase 6) |
| City priority landing pages | Basel + Zürich + Bern + Luzern (4 cities × 2 locales = 8 pages MVP) |
| GMB integration | **Self-serve claim-and-sync flow Phase 6** (not Phase 5) — Reserve-with-Google after |

**Open question (pulled from §0.17):**
- D8 German slug — `hundepflege` vs `hundecoiffeur` vs `hundesalon`. **Locked default: `hundepflege`** for neutrality; user override possible.

---

## §21 · B2B groomer-side UX (Phase 6 prep, deferrable)

📄 Detail: `_audits/b2b-groomer-side.md`

**Headline:** European beauty market converged on **freemium + first-booking-only commission** (Fresha pre-2025, Treatwell). Recommended Solen Phase 6 = **Model B**: zero base fee + 18% first-booking commission + min CHF 5 + daily Stripe Connect payouts. Avoid Fresha's 2025 "blindside" — be transparent about future tier additions upfront.

**Phase 6 B2B requirements draft** (NOT MVP — deferred):

| Feature | MVP-Phase-6 | v2 |
|---|---|---|
| Self-service groomer onboarding | ✅ | — |
| Calendar mgmt + availability rules | ✅ | — |
| Service catalog + custom pricing | ✅ | — |
| Photo upload + portfolio | ✅ | — |
| Reviews moderation (respond) | ✅ | — |
| Stripe Connect payouts | ✅ | — |
| Analytics dashboard | basic | advanced |
| Subscription mgmt | — | ✅ (Solen Abo) |
| Marketing tools (boost/featured) | — | ✅ |
| Multi-staff support | — | ✅ |

**Pricing model locked for Phase 6:**
- **Zero base fee**
- **18% commission on first booking only** (matches Treatwell pattern)
- **Min commission CHF 5**
- **Repeat bookings: 0% commission** (the strongest differentiator vs Fresha 20% on all)
- **Daily Stripe Connect payouts** (groomers expect cashflow speed)

**Decisions surfaced (not blocking MVP):**
- Sales-led vs self-serve onboarding: **self-serve** primary, sales-led optional for 5+ chair salons
- Free trial: 90 days commission-free for first 50 Basel groomers (launch incentive)

---

## §22 · Photography + brand identity (Phase 2 input)

📄 Detail: `_audits/photography-brand-patterns.md`

**Headline:** Lifestyle real-photo with warm-natural light wins for service marketplaces (Rover/Farmer's Dog/Chewy pattern). Studio white-bg dominates only retail (Fressnapf/Petco/Zooplus). Illustrated heroes are losing ground. Swiss-native breeds (Berner Sennenhund, Schäferhund, Pinscher, Dackel) are **absent from international platforms** — Solen's CH-native imagery opening.

**Locked Solen photography guidelines for Phase 2 brand:**

| Element | Lock |
|---|---|
| Hero imagery | **Real-photo lifestyle**, warm-natural light grade |
| Card photography | **Lifestyle** (in-context with groomer or owner) > studio |
| Color treatment | **Warm-natural** (matches V3 Earthen Wellness Light cream substrate) |
| Dog-with-human ratio | **~70% with-human** (trust signal — agentless dog photos read sterile) |
| Breed diversity | **Swiss-native rotation required**: Berner Sennenhund + Schäferhund + Pinscher + Dackel + mixes alongside Golden/Labrador |
| Illustration usage | **Empty states + icons + brand accents only** — never replacing hero or card photos |
| Illustration style | Flat-line two-tone (matches V3 atmosphere) |
| Photo source | **Mix**: stock (Unsplash CC0 / Pexels) for hero/marketing + custom photoshoot for top-3 Basel groomers post-launch + UGC review-photos (Phase 4 user uploads) |

**Decisions surfaced:**
- Hero photo: commission custom shoot vs Unsplash mix? **Locked default: Unsplash CC0 for MVP, custom shoot post-launch for Basel hero salons**
- Studio vs lifestyle: locked **lifestyle**
- Empty state register: locked **flat-line two-tone** (no Lottie, no mascots)

---

## §23 · Loyalty / subscription deep-dive (Solen Abo v2)

📄 Detail: `_audits/loyalty-subscription-patterns.md`

**Headline:** Scenthound = 3 tiers ($39/$49/$65 USD) month-to-month, no published referrer-side incentive (gap to beat). Chewy Autoship = retention gold standard (83% of net sales, frictionless skip/pause/cancel, 35%-off first order + 5-10% recurring). Groomit refundable prepaid (up to 30% savings). Fresha sells loyalty/referral/gift-card *tools* not its own subscription. Industry churn target: 3-5%/month for committed members; 4-8 week visit cadence is industry standard.

**Locked Solen Abo v2 spec** (NOT MVP — schema-aware in Phase 3, ship v2):

| Element | Lock |
|---|---|
| Tier count | **2 tiers** (simpler than Scenthound's 3) |
| Tier 1 — "Solen Basic" | **CHF 39/mo** — monthly Bad + Krallenkürzen + Ohrenreinigung |
| Tier 2 — "Solen Plus" | **CHF 79/mo** — Tier 1 services + Vollverwöhnpaket every 2 months |
| Cadence | **4-8 weeks configurable per pet** |
| Pricing strategy | **Flat-included + 20-25% à-la-carte discount stacked** (best of Scenthound + Chewy) |
| First month | **50% off** (not free — filters intent) |
| Referral program | **CHF 10 off both sides** (referrer + new user). Dual-sided trigger timing (Fresha pattern: referee at booking, referrer at completion). |
| Cancellation | **Month-to-month**, immediate cancel via account settings (FTC Click-to-Cancel) |
| Skip / Change / Pause | **Peer radio options** — Skip this month / Change cadence / Pause 3 months / Downgrade tier / Cancel |
| Schema | `subscriptions` table + `pet_subscription_config` ship Phase 3 (schema-aware), gift cards deferred Phase 4 |

**Decisions surfaced:**
- Tier count: **2 (locked)** — fewer choices = higher conversion
- Annual prepay option: **deferred v3** (added complexity for v2)
- Multi-pet household discount: **deferred v3** (single-pet bookings in MVP)
- Franchise-flex pricing (different prices per groomer): **NO** — Solen Abo is platform-level subscription, prices flat across groomers

---

## §24 · Trust + safety mechanics

📄 Detail: `_audits/trust-safety-mechanics.md`

**Headline:** Two-tier insurance is the gold standard — groomers carry **Berufshaftpflicht ≥ CHF 1M** (MVP minimum; industry recommendation CHF 5M) + Solen carries marketplace liability on top. Vaccination NOT federally mandatory in CH for domestic-only dogs (CH rabies-free since 1999) — use "Impfungen empfohlen" not "erforderlich". Groomit's **24h satisfaction window** (re-groom-or-refund) is the proven dispute UX. CH has **no legal practitioner-license** for dog groomers (only business Bewilligung > 5 animals) — Solen can elevate by featuring only **EFZ Tierpfleger / SVBT-certified groomers** at MVP (real differentiator).

**Locked Solen MVP trust spec:**

| Decision | Lock |
|---|---|
| Groomer verification | **Hand-verified manual** at Basel launch — Solen team reviews business reg + insurance + certification. Automated badge issuance v2. |
| Insurance | **Require Berufshaftpflicht ≥ CHF 1M** at MVP. Surface "Versichert" badge on profile + cards. |
| Vaccination | **Optional MVP** — free-text "Impfungen aktuell: ja/nein" on pet profile. Structured upload v2. "Empfohlen" language, not "erforderlich". |
| Dispute resolution | **Email channel MVP** (`disputes@solen.ch`). 24h re-groom-or-refund window in AGB. In-app chat v2. |
| Background check | **Not required at MVP** (CH legal context — Strafregister sensitive). Optional voluntary submission v2. |
| Solen Versprechen (branded promise) | **5 promises locked**: "Geprüfte Hygiene · Tierfreundlich · Versichert · Faire Preise · 100% kostenlose Stornierung 24h" |
| Liability disclaimer | Terms-page + **checkout-step "Ich verstehe" checkbox** before payment |
| Featured certification | **EFZ Tierpfleger / SVBT-certified groomers** displayed prominently at launch. Other groomers can join without certification but won't get the "EFZ-Zertifiziert" badge. |

**11 legal risks flagged for pre-launch CH lawyer review** (detail in `_audits/trust-safety-mechanics.md`):
- AGB marketplace-vs-provider liability split
- FADP/nFADP for Strafregister handling (if introduced v2)
- UWG (unfair competition) trust-claim risk language
- FINMA + Stripe Connect compliance for payments
- Mehrsprachigkeit (DE/EN/FR/IT) legal language consistency
- Tierschutzgesetz platform-liability for animal welfare
- Plus 5 more enumerated in detail doc

**Decisions surfaced:**
- Groomer verification process: **hand-verified Basel-only at MVP**
- Insurance requirement amount: **CHF 1M minimum**
- Vaccination enforcement: **optional MVP / required v2** (matches earlier §0 lock)
- Solen Versprechen wording: **5 promises locked above**

---

## §25 · Consolidated MVP feature spec + Phase 1 prereqs

This is the **single source of truth** for Phase 1+ execution. Read this section to know what's locked.

### MVP catalog (9 services — bumped from 8 per US-leaders audit)

1. Bad (Bath) — CHF 30-60, 30 min
2. **Quick Wash** (express) — CHF 25, 20 min — NEW per US audit
3. Bürsten / Striegeln (Brush-out) — CHF 20-40, 20-30 min
4. Vollverwöhnpaket (Full groom) — CHF 80-150, 1.5-3 hr (size-class priced)
5. Schnitt (Haircut) — CHF 40-90, 30-90 min (size-class priced)
6. Krallenkürzen (Nail Trim) — CHF 15-30, 15 min
7. Pfotenpflege (Paw care) — CHF 20-40, 20 min
8. Ohrenreinigung (Ear cleaning) — CHF 15-25, 10 min
9. Zahnpflege (Teeth brushing) — CHF 15-30, 10-15 min

### Pet profile MVP fields

**Required (5):** name, species (`dog` enum-ready for `cat` v2), breed (with **Mixed Breed?** checkbox per US audit), size_class (XS / S / M / L / XL), coat_type (short / long / double / curly / wire)

**Optional (4):** age_years, allergies (free-text), temperament (free-text), vaccinations_current (boolean — free-text "yes/no" in MVP, structured upload v2)

**Plus:** photo_url (optional upload)

### Booking flow steps (8 first-time, 5-6 returning)

(See §11 above)

### Geographic launch

**Basel + 5-10km radius.** Zürich after 100 bookings.

### Brand direction

- **Wellness > Luxury** positioning (Scenthound model)
- **"Geprüfte Hundepflege in deiner Nähe"** voice (not "Luxus-Hundespa")
- **Real-photo lifestyle** photography (warm-natural grade, Swiss-breed rotation)
- **"Solen Versprechen"** 5-promise badge
- **Single-pet, salon-only, B2C-first** at MVP

### Phase 2 brand decisions (still open):
- Name: keep Solen vs rebrand
- Display font: retire Anton (Fluz-borrowed) for rounder/friendlier
- Accent color: keep emerald vs adopt pet-platform blue
- Hero copy: pet-specific rewrite (replace "Schöner aussehen, schneller buchen" with grooming language)

### Phase 3 schema delta (consolidated):

```sql
-- NEW TABLES
CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat')),
  breed text,
  is_mixed_breed boolean DEFAULT false,
  size_class text NOT NULL CHECK (size_class IN ('xs', 's', 'm', 'l', 'xl')),
  coat_type text CHECK (coat_type IN ('short', 'long', 'double', 'curly', 'wire')),
  coat_condition text CHECK (coat_condition IN ('clean', 'normal', 'matted')),
  age_years numeric(3, 1),
  allergies text,
  conditions text,
  behavior_notes text,
  vaccinations_current boolean,
  vaccination_record_url text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- v2 SCHEMA-READY (created in Phase 3, used in v2)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  tier text NOT NULL CHECK (tier IN ('basic', 'plus')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  cadence_weeks integer DEFAULT 6,
  next_renewal_date date,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE pet_subscription_config (
  pet_id uuid REFERENCES pets(id),
  subscription_id uuid REFERENCES subscriptions(id),
  PRIMARY KEY (pet_id, subscription_id)
);

-- ALTER EXISTING
ALTER TABLE bookings ADD COLUMN pet_id uuid REFERENCES pets(id);
ALTER TABLE bookings ADD COLUMN subscription_id uuid REFERENCES subscriptions(id);  -- nullable, used in v2
ALTER TABLE services ADD COLUMN is_addon boolean DEFAULT false;
ALTER TABLE services ADD COLUMN is_express boolean DEFAULT false;
ALTER TABLE services ADD COLUMN age_tier text CHECK (age_tier IN ('puppy', 'adult', 'senior'));
ALTER TABLE services ADD COLUMN suitable_size_class text[];
ALTER TABLE salons ADD COLUMN guarantees_solen_promise boolean DEFAULT false;
ALTER TABLE salons ADD COLUMN insurance_min_chf integer DEFAULT 1000000;  -- CHF 1M minimum
ALTER TABLE salons ADD COLUMN efz_certified boolean DEFAULT false;  -- EFZ Tierpfleger
ALTER TABLE salons ADD COLUMN svbt_certified boolean DEFAULT false;  -- SVBT Hundecoiffeur

-- DROP (deprecation period in Phase 3, hard drop Phase 4 once references gone)
ALTER TABLE profiles DROP COLUMN hair_type;
ALTER TABLE services DROP COLUMN suitable_gender;
ALTER TABLE services DROP COLUMN suitable_for;  -- age_group human enum

-- VIEW alias (avoids breaking existing queries during transition)
CREATE VIEW groomers AS SELECT * FROM salons WHERE category = 'dog_grooming';

-- ENUM update
ALTER TYPE salon_category ADD VALUE 'dog_grooming';
ALTER TYPE salon_category ADD VALUE 'cat_grooming';  -- v2-ready
ALTER TYPE salon_category ADD VALUE 'mobile_grooming';  -- v2-ready
-- Beauty enum values deprecated in Phase 4 (no hard drop — preserves existing data integrity)
```

### Phase 4 build checklist (per §13-§17 sub-phase locks)

**Components to build:**
- `PetSelector.tsx` — pick existing pet or "Add new pet" inline wizard
- `PetProfileForm.tsx` — 5 required + 4 optional fields + Mixed Breed checkbox
- `PetCard.tsx` — pet display card with photo + breed + size
- `SizeClassFilter.tsx` — XS/S/M/L/XL selector (drives pricing)
- `ServiceAddonPicker.tsx` — multi-select for add-ons on top of base service
- `BookingFlowStepper.tsx` — 1-task-per-screen pacing (Doctolib pattern)
- `SlotPillsOnCard.tsx` — OpenTable-style 2-3 available slots on groomer card
- `MagicLinkGuestClaim.tsx` — guest checkout + post-booking account claim

**Existing V3 components to rename:**
- `SalonCard.tsx` → `GroomerCard.tsx` (preserve all logic)
- `SalonDetailV3.tsx` → `GroomerDetailV3.tsx` (preserve all 17 sub-components from V2-D53.3)
- All `_components/salon/*.tsx` → `_components/groomer/*.tsx`

**Existing V3 components 1:1 reusable:**
- `BookingCalendar.tsx`, `MapView.tsx`, `ReviewForm.tsx`, `ReviewCarousel.tsx`, `SearchBar.tsx` (with category-detect.ts rewrite), `FilterBar.tsx`, entire `booking/` + `payment/` + `profile/` + `auth/` flows, V3 F2 Header (rename CATEGORIES constant only)

**Routes:**
- DELETE: `app/[locale]/{coiffeur,barbershop,nails,spa,makeup,waxing}/`
- RENAME with 301 redirects: `app/[locale]/salon/[slug]/` → `app/[locale]/groomer/[slug]/`
- ADD: `app/[locale]/groomers/` (single listing with `?service=` filter)

### Phase 5 SEO (per §20)
- URL pattern: `/[locale]/[city]/hundepflege/[slug]`
- Schema.org: LocalBusiness + Service[] + AggregateRating + BreadcrumbList
- Locales MVP: de-CH + en-CH (FR/IT v2)
- City landing pages: Basel + Zürich + Bern + Luzern × 2 locales = 8 pages

### Phase 6 B2B (per §21, deferred)
- Self-service onboarding
- Calendar + pricing + portfolio + reviews + payouts
- Pricing model: zero base fee + 18% first-booking commission only + daily payouts

### v2 expansions
- Multi-pet booking
- Cat grooming (`species = 'cat'` enum value already in MVP schema)
- Mobile groomers (kommt zu dir)
- Solen Abo subscription (schema in Phase 3)
- Vaccination upload enforcement
- Owner response to reviews
- In-app dispute chat
- Push notifications (with native app or web-push)
- FR + IT locales

### v3+ expansions
- Pet ecosystem expansion (boarding / day camp / training / vet — PetSmart-style)
- Subscription tier 3 + annual prepay
- Multi-pet household discount
- Franchise expansion to other CH cities + DACH

---

## Phase 0 v2 close

V2-D58.0.1 entry locked in `_tasks/V2_REBUILD_LOG.md` documenting:
- 14 sub-phases (0.8-0.21) executed via 7+7 parallel research agents
- Per-sub-phase locked decisions consolidated in §11-§24
- §25 consolidated MVP feature spec ready for Phase 1+ execution
- Phase 1 (codebase audit) **unblocked** — runs against this v2 doc

**Estimated savings on Phase 4 build budget:** 3-5 hrs of UX discovery during implementation deferred. Phase 4 executes against a complete spec instead of investigating mid-build.

**Estimated total Phase 0 (v1 + extensions) investment:** ~10 hrs research + 14 deliverables + 1 master synthesis doc + multiple architectural decisions locked. Worth it for a pivot of this magnitude.
