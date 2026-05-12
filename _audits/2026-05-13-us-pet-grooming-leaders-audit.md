# US Pet Grooming Market Leaders — Feature Audit

> Captured 2026-05-13. Comparative feature scan of the 4 largest / most-mature
> US dog grooming platforms to inform Solen pivot (dog grooming, Basel-first).
> Reference screenshots in `_audits/pet-refs/`:
> petsmart-grooming-home.jpeg, petco-grooming-home.jpeg, groomit-home.jpeg,
> scenthound-home.jpeg. Focus is on **features, categories, buttons,
> components** — not visual design tokens (that's the Phase 0 teardown).

---

## §0 · The 4 players surveyed

| Player | Model | Scale | Pet types | Why include |
|---|---|---|---|---|
| **PetSmart Grooming** | Retail-chain in-store grooming salons | ~1,650 locations US/CA | Dogs + cats | Largest US grooming operator; full catalog visibility |
| **Petco Grooming** | Retail-chain in-store grooming | ~1,500 locations US | Dogs + cats | Direct PetSmart competitor (geo-blocked our scan; ecosystem confirmed via nav) |
| **Groomit** | Mobile + in-home + salon-partner network | Nationwide US, marketplace | Dogs + cats | Premium-mobile model with B2B Salon Partnership program |
| **Scenthound** | Subscription / membership franchise | 100+ US franchise locations | Dogs only | Subscription-based wellness positioning |

**Two distinct models confirmed:**
- **Marketplace / chain** (PetSmart, Petco, Groomit) — pay-per-visit
- **Subscription / membership** (Scenthound) — recurring monthly hygiene fee

Both models valid. Hybrid (Solen could do both) is possible but adds complexity to MVP.

---

## §1 · Service catalog comparison (THE BIG TABLE)

PetSmart's full grooming menu, with Groomit and Scenthound noted where they offer parallel:

| # | Service | PetSmart | Groomit | Scenthound | MVP for Solen? |
|---|---|---|---|---|---|
| 1 | **Bath & Brush** (base) | ✅ | ✅ | ✅ (Monthly Hygiene) | ✅ |
| 2 | **Bath & Brush with FURminator®** (deshed premium) | ✅ | ✅ "Luxury Bath" | — | ✅ (call it Unterwollentfernung) |
| 3 | **Bath & Full Haircut** | ✅ | ✅ | — | ✅ (Vollverwöhnpaket) |
| 4 | **Bath & Full Haircut with FURminator®** | ✅ | ✅ | — | 🟡 v2 (premium tier) |
| 5 | **Quick Wash** (express service) | ✅ | — | ✅ | 🟡 add to MVP if Basel groomers offer |
| 6 | **Puppy Bath & Brush** (≤16 weeks) | ✅ | ✅ | — | 🟡 v2 (age-tier complicates MVP) |
| 7 | **Puppy Bath & Trim** | ✅ | — | — | 🟡 v2 |
| 8 | **Puppy Bath & Full Haircut** | ✅ | — | — | 🟡 v2 |
| 9 | **Teeth Brushing** | ✅ | — | ✅ | ✅ (Zahnpflege) |
| 10 | **Teeth Brushing & Breath Freshener** | ✅ | — | — | 🟡 v2 (combo upsell) |
| 11 | **Nail Trim** | ✅ | ✅ | ✅ | ✅ (Krallenkürzen) |
| 12 | **Nail Grind + Trim** (premium) | ✅ | — | — | 🟡 v2 (nail-care upsell) |
| 13 | **Nail Trim Plus** | ✅ | — | — | 🟡 v2 |
| 14 | **Nail Polish** (cosmetic add-on) | ✅ | — | — | ⛔ skip (cosmetic, low demand CH) |
| 15 | **Ear Cleaning** | ✅ | ✅ | ✅ | ✅ (Ohrenreinigung) |
| 16 | **Touch-up Package** (between-visit maintenance) | ✅ | — | — | 🟡 v2 (smart retention play) |
| 17 | **Paw / Pad Care** | (often inline) | ✅ | ✅ | ✅ (Pfotenpflege) |
| 18 | **Anal Gland Expression** | (often inline / on-request) | ✅ | ✅ | 🟡 v2 (medical-adjacent; liability) |
| 19 | **De-shed / Unterwollentfernung** | inline w/ FURminator | ✅ | — | 🟡 add to MVP if 5+ Basel groomers offer |
| 20 | **Skin & Coat Treatment** | inline | ✅ | ✅ | 🟡 v2 (specialty / medicated) |

**Solen MVP recommended expansion** based on this audit: keep the original 8, ADD a "Quick Wash" express service (matches PetSmart + Scenthound). The 9-service MVP:
1. Bad (Bath)
2. Quick Wash (express, 20 min, half-price of full bath) — **NEW based on audit**
3. Bürsten / Striegeln (Brush-out)
4. Vollverwöhnpaket (Full groom)
5. Schnitt (Haircut)
6. Krallenkürzen (Nail Trim)
7. Pfotenpflege (Paw care)
8. Ohrenreinigung (Ear cleaning)
9. Zahnpflege (Teeth brushing)

**v2 expansion roadmap** (from the audit):
- Premium tiers: FURminator-style deshed upsell, Nail Grind+Trim, Teeth + Breath
- Age tiers: Puppy variants (different pricing/duration)
- Maintenance: Touch-up Package (retention)
- Medical-adjacent: Anal Glands, Skin & Coat treatments
- Subscription: monthly hygiene membership (Scenthound-style)

---

## §2 · Pet ecosystem expansion (where grooming sits in their wider product)

PetSmart and Petco both treat grooming as ONE vertical within a broader pet ecosystem. Listed in their primary nav:

| Vertical | PetSmart | Petco | Notes |
|---|---|---|---|
| Grooming | ✅ | ✅ | Our core MVP |
| Pet Hotel / Boarding | ✅ (PetsHotel) | (3rd party Rover integration) | Overnight care |
| Doggie Day Camp / Daycare | ✅ | — | Day-only care |
| Training | ✅ | ✅ (Positive Dog Training) | Obedience, agility, puppy class |
| Vet Care | ✅ (Banfield in-store) | ✅ (Vetco mobile + in-store) | Medical |
| Pet Pharmacy / Rx | — | ✅ | Prescription delivery |
| Pet Insurance | — | ✅ | Underwriting partnership |
| Pet Adoption | ✅ | ✅ | Charity-tier |

**Implication for Solen v2-v4:** dog grooming is the **wedge**, but the natural expansion is:
1. → Mobile groomers (kommt zu dir) — Groomit model
2. → Dog walking (Pawshake / Rover-style) — pet sitting that already exists in CH
3. → Daycare / Hundetagesbetreuung — Rover CH already lists this
4. → Vet integration — long-tail, post-traction

The grooming-first wedge is well-validated. **Don't dilute MVP** — but Phase 6+ should plan for cross-service expansion.

---

## §3 · Service modes (where the grooming happens)

| Mode | Operators | When it wins |
|---|---|---|
| **In-salon (you drop off the dog)** | PetSmart, Petco, Scenthound, traditional CH groomers | Standard. Owner free for 1-3 hrs. |
| **Mobile spa (van comes to you)** | Groomit Mobile, regional independents | Premium urban, anxious dogs, no-car owners |
| **In-home (groomer with portable kit)** | Groomit In-home | Anxious dogs, multi-pet households |
| **Self-serve wash station** | Petco Self-Serve, some indie groomers | Cost-conscious owners |

**Solen MVP locked** (per Phase 0 §8): salon-only. **v2 expansion:** mobile groomers (Groomit-validated business model with premium pricing).

**Self-serve wash** is interesting — PetSmart and Petco both offer DIY stations at $15-25 in their retail stores. Could be a unique Solen feature later (partner with pet stores) but NOT in scope yet.

---

## §4 · Booking flow patterns

Synthesized from all 4 platforms:

### Standard flow (matches Phase 0 §7)
```
1. Home/grooming landing → location selector / find store
2. Service selector (drives price + duration)
3. Pet selector (existing or add new — pet profile)
4. Date + time slot (calendar)
5. Confirm → checkout (deposit or pay-after)
6. Confirmation → email + add-to-calendar + reminders
```

### Pet profile fields seen across platforms (cross-reference)

| Field | PetSmart | Groomit | Scenthound | MVP for Solen? |
|---|---|---|---|---|
| Pet name | ✅ | ✅ | ✅ | ✅ required |
| Species | (dog default) | dog + cat | dog only | ✅ required (`dog` MVP, `cat` v2) |
| Breed | ✅ from list | ✅ from list + Mixed Breed option | ✅ | ✅ required + **"Mixed Breed?" checkbox** (Groomit pattern) |
| Size class | ✅ S/M/L | ✅ S/M/L/XL | ✅ | ✅ required (drives price) |
| Weight (specific) | ✅ | ✅ | ✅ | 🟡 optional (size class is enough) |
| Age | ✅ | ✅ (puppy detection) | ✅ | 🟡 optional |
| Coat type | (asked at salon) | ✅ | ✅ | ✅ required |
| Coat condition / matting | — | ✅ "Matted?" flag | — | 🟡 v2 (surcharge trigger) |
| Vaccinations on file | ✅ required document | ✅ required upload | ✅ required | 🟡 **optional in MVP** (free-text "current: yes/no"), enforced in v2 |
| Behavioral notes | ✅ structured: anxious / aggressive / fearful | ✅ free-text | ✅ structured | 🟡 optional free-text in MVP, structured v2 |
| Allergies | ✅ free-text | ✅ free-text | ✅ free-text | 🟡 optional free-text |
| Medical conditions | ✅ free-text | ✅ free-text | ✅ free-text | 🟡 optional free-text |
| Last groom date | ✅ auto from history | ✅ auto from history | ✅ auto | ⛔ v2 (auto-derived once we have bookings) |
| Pet photo | ✅ optional upload | ✅ optional upload | ✅ optional | ✅ optional in MVP |

**New pattern caught:** **"Mixed Breed?" checkbox** — Groomit explicitly offers this because mixed breeds don't fit the breed dropdown. Add to MVP pet form.

---

## §5 · Buttons / CTA patterns

| Platform | Primary CTA | Style | Radius | Secondary |
|---|---|---|---|---|
| **PetSmart** | "Book Now" | Light gray-white `#F7F7F7`, dark text | 4px (small radius) | "Find a store near you" |
| **Groomit** | "Book Now" | **Red `#FF314A`**, white text | 10px | "Recurring Booking", "Call to Book +1-..." (phone fallback) |
| **Scenthound** | "Book Now" | **Yellow `#FFE73F`**, dark text | **300px (full pill)** | "Find a Location", "Clean Start" |
| **PetSmart secondary** | "Schedule appointment", "Find a salon" | underlined link / outline | — | — |

**Cross-pattern observations:**
- Every platform has a **"Book Now"** primary — that's the universal pet-grooming verb (vs Fluz's "Sign up", vs Fresha's "Reserve")
- **Phone backup is normal** — Groomit prominently lists their phone number. Older owners + anxious pet owners want voice. Solen MVP should keep a phone CTA on every groomer detail page.
- **Location-find pattern** is dominant — "Find a Location" / "Find a store near you" — geo-search comes BEFORE booking. (Matches Fresha's location-first search bar.)
- **Recurring Booking** is a Groomit primary affordance — appears as its own CTA, not hidden in settings. Subscription = revenue lever Solen should consider for v2.
- **CTA colors vary wildly** — red (Groomit), yellow (Scenthound), gray (PetSmart). No category convention. Solen's emerald is fine.

---

## §6 · Trust signals / value props

What each platform leads with to justify "why book here":

| Platform | Trust signal | Visibility |
|---|---|---|
| **PetSmart** | "Why PetSmart Grooming?" section + state-licensed-groomers messaging | h3 on landing |
| **Scenthound** | **"6-Point Wellness Check"** — branded process every visit | h2 on landing, repeated |
| **Scenthound** | "Love a Clean, Healthy Dog" — wellness positioning | h1 |
| **Groomit** | **"America's Most Reviewed Pet Grooming Service"** — review-count flex | h2 |
| **Groomit** | **Choose-your-groomer** — named groomers (Luna, Milo, George, etc.) | Hero gallery |
| **Groomit** | **"Service Available Nationwide"** — coverage flex | h2 |
| **PetSmart/Petco** | National retail brand recognition | Implicit, ubiquitous |
| **Scenthound** | **#DogsAreFamily** — emotional positioning | Section header |

**Patterns Solen MVP should adopt:**
1. **"Über X Bewertungen"** (review count flex) — once we have ≥100 reviews, surface aggregate count on landing (Groomit pattern)
2. **Named groomers with photos** — make groomers feel like people, not businesses (Groomit-style)
3. **A branded process/promise** like "Solen Promise" or "Geprüfte Salons" — signal trust. Scenthound's 6-Point Wellness Check is the gold standard here.
4. **Wellness vs glamour positioning** — Scenthound deliberately positions as "clean healthy dog" not "luxury spa." For Basel market starting from zero, **wellness/trust positioning beats luxury/spa positioning**. Spa is more crowded conceptually.

---

## §7 · Subscription / membership model (Scenthound deep-dive)

Scenthound is the most-developed subscription model in US dog grooming:

| Feature | Scenthound implementation |
|---|---|
| **Tier name** | "Monthly Hygiene" (basic) + paid up-tiers |
| **Value prop** | "Only Pay for What You Need" + 6-Point Wellness Check |
| **Cadence** | Monthly visits, recurring billing |
| **Coverage** | Basic hygiene (bath, ears, nails, teeth) — no full grooming |
| **Add-ons** | Haircuts available à-la-carte on top of monthly |
| **Lock-in** | Implicit (month-to-month cancellable) |

**Why this matters for Solen:**
- Recurring revenue is gold for any platform
- Dogs need grooming every 4-8 weeks — natural cadence for subscription
- Subscription pre-commits owner + groomer time (no churn from forgotten appointments)
- Scenthound built a 100+ franchise network on this model

**Recommendation:** consider a **"Solen Abo"** v2 feature — monthly basic hygiene at fixed price, full grooms à-la-carte. Don't put in MVP (single-flow first), but design schema with subscription in mind.

---

## §8 · B2B / Groomer-side features (Groomit deep-dive)

Groomit has a "Salon Partnership Program" — they bring tech to existing salons:

| Salon partner gets from Groomit | Use case for Solen |
|---|---|
| Booking calendar + management | Phase 6 groomer dashboard |
| Customer acquisition (Groomit drives bookings) | Solen's marketplace value prop |
| Payment processing | Stripe Connect (already in Solen stack) |
| Subscription billing for clients | Solen "Abo" feature |
| Service standardization (Groomit-approved services) | Optional — could let groomers define own services |
| Marketing materials / branded vans | Out of MVP scope |

**Key insight:** Groomit is **both consumer marketplace AND B2B SaaS for salons**. PetSmart/Petco are 1st-party operators. Solen is closer to Groomit's hybrid model — we own consumer demand + give groomers booking tools.

**Phase 6 (B2B) needs:**
- Groomer onboarding flow (claim listing OR add new salon)
- Calendar management (drag-drop slot edit, set availability rules)
- Service catalog editing (which services this groomer offers, custom pricing)
- Photo upload (portfolio + groomer-with-dog hero photo)
- Reviews moderation (respond to reviews)
- Payout dashboard (Stripe Connect)
- Subscription management (if Solen Abo ships)
- Analytics (bookings/week, no-show rate, avg rating)

---

## §9 · Component / pattern inventory

Reusable component patterns observed across the 4 platforms:

### Cards & lists
- **Service package card** — name + price + duration + brief description + "Book Now" CTA (PetSmart's grooming services list)
- **Groomer card** — photo + name + rating + distance + service tags + Book button (Groomit "Choose your groomer")
- **Location finder card** — address + distance + hours + "Set as my location" (PetSmart, Scenthound)
- **Membership tier card** — name + monthly price + included services list + "Join" CTA (Scenthound)

### Forms
- **Pet profile form** — Name / Species / Breed (with Mixed checkbox) / Size / Coat / Behavior notes / Vaccinations / Photo (all 4 platforms)
- **Date+time picker** — calendar + time-slot grid grouped by morning/afternoon/evening (Fresha pattern)
- **Service selector** — checkbox/radio with price + duration shown, multi-select for add-ons (PetSmart)

### Modals / sheets
- **Service detail sheet** — opens from card, full description + photos + reviews + Book CTA (Fresha pattern)
- **Pet add/edit modal** — quick inline pet creation during booking (Groomit, PetSmart)
- **Location picker modal** — map + list + zip code entry (PetSmart)

### Filters
- **Pet size filter** — XS / S / M / L / XL (Groomit, all sized-price platforms)
- **Service type filter** — categories grid (Bath / Haircut / Nails / Teeth) for browsing the catalog (PetSmart)
- **Sort** — price low-high, distance, rating (Fresha pattern)

### Trust elements
- **Star rating + review count** — `4.9 (3,983)` on every salon/groomer card (Fresha pattern, applies universally)
- **Branded promise badge** — "6-Point Wellness Check", "FURminator Certified", "State-Licensed Groomers" (Scenthound, PetSmart)
- **Photo galleries** — before/after grids, salon interior, groomer-with-dog (all platforms)

### Navigation patterns
- **Service categories grid** — landing-page tiles for each service type
- **Sticky bottom bar (mobile)** — book button always accessible during scroll
- **Location sticky header** — current city/zip shows + tap to change

---

## §10 · What this means for Solen Phase 1-6

### Phase 1 (codebase audit) — refine the rename map

Beyond the Phase 0 §10 prereqs, add:
- **`pets.coat_condition` field** (matted/normal/clean) for v2 surcharge logic
- **`pets.mixed_breed` boolean** (Groomit pattern, separate from breed enum)
- **`pets.vaccination_record_url`** (file upload, v2)
- **`pets.behavior_notes`** (structured enum in v2: friendly / anxious / aggressive / fearful)
- **`services.is_addon` boolean** (vs main service) — for upsells like Polish, Breath
- **`services.is_express` boolean** — for Quick Wash type fast services
- **`services.age_tier` enum** — puppy / adult / senior (v2)

### Phase 2 (brand) — locked decisions informed by this audit

- **CTA style:** "Book Now" verb (universal). Solen V3 emerald + 999px pill is consistent with the category — keep.
- **Trust positioning:** **Wellness > Luxury**. Don't position as "Swiss premium spa for dogs" — position as "Geprüfte Hundepflege in deiner Nähe." Scenthound's "Clean Healthy Dog" energy.
- **Branded promise:** consider a "Solen Versprechen" — 3-5 things every groomer on Solen guarantees (e.g., "Geprüfte Hygiene · Tierfreundlich · Faire Preise · 100% Stornierung").

### Phase 4 (consumer flow) — feature checklist informed by this audit

MUST-HAVE in MVP consumer flow:
- ✅ Location-first search (Find groomer in Basel)
- ✅ Pet selector with Mixed Breed checkbox
- ✅ Size class drives price
- ✅ Date + time picker (morning/afternoon/evening groupings)
- ✅ Service add-ons (multi-select on top of base service)
- ✅ Phone number prominent on every groomer detail page
- ✅ Star rating + review count on every card
- ✅ Photo gallery per groomer (before/after + interior)

DEFER to v2:
- ⛔ Recurring/subscription booking
- ⛔ Mobile groomer (kommt zu dir)
- ⛔ Cat grooming
- ⛔ Vaccination upload enforcement
- ⛔ Branded promise badges (need ≥10 groomers first)
- ⛔ Choose-specific-groomer (vs choose-salon)

### Phase 5 (marketing surfaces)

- **Trust page** modeled on Scenthound's "Why Scenthound" — show the Solen Versprechen
- **How it works** page — 3 steps (Find → Book → Done), Fresha-style
- **Pricing page** — show service catalog with size-class price ranges (transparency = differentiator vs WhatsApp groomers)
- **FAQ** — modeled on Groomit's "Questions, Answered" section (15+ questions covering booking, cancellation, pricing, pet safety)

### Phase 6 (B2B) — informed by Groomit's model

- Self-service groomer onboarding (claim or add salon)
- Calendar management with availability rules
- Service catalog editing with custom pricing
- Photo upload + portfolio
- Review response
- Stripe Connect payouts
- Future: Solen Abo subscription management

---

## §11 · Key gaps / things to investigate further

Phase 0 + this audit have identified the MVP scope. Open questions for Phase 2-3:

1. **Cat grooming** — PetSmart, Groomit, Petco all serve cats. Scenthound dog-only. CH market signal unclear — defer to v2 unless Basel groomers say cat demand is real.
2. **Vaccination enforcement** — Liability question. US platforms require upload. CH legal framework different (Tierschutzgesetz). Need legal review before MVP if enforcement is required.
3. **Subscription/Solen Abo** — High revenue lever but adds significant complexity. Defer to v2 but design schema today.
4. **Self-serve wash stations** — Petco offers; could be a CH novelty / partnership with pet stores. Not MVP.
5. **Phone backup** — Solen MVP should keep prominent phone number on every groomer page (CH older-owner pattern).

---

## §12 · Cross-platform summary table

| Dimension | PetSmart | Petco | Groomit | Scenthound | Solen MVP plan |
|---|---|---|---|---|---|
| **Model** | Chain | Chain | Marketplace | Subscription franchise | Marketplace |
| **Services** | 16+ catalog | (similar) | 8-10 + premium | 4-5 hygiene basics | **9** (MVP-locked) |
| **Pet types** | Dogs+cats | Dogs+cats | Dogs+cats | Dogs only | **Dogs only (v1)** |
| **Mobile mode** | — | — | ✅ | — | v2 |
| **Subscription** | — | — | "Recurring Booking" | ✅ Monthly Hygiene | v2 |
| **Choose-groomer** | (assigned) | (assigned) | ✅ named groomers | (within salon) | v2 |
| **B2B program** | (own employees) | (own employees) | ✅ Salon Partnership | ✅ Franchise | Phase 6 |
| **Branded promise** | "Why PetSmart" | (implicit retail trust) | "America's most reviewed" | **6-Point Wellness Check** | **Solen Versprechen** (Phase 2 decision) |
| **CTA** | "Book Now" gray 4px | "Book Now" | "Book Now" red 10px | "Book Now" yellow 300px | "Termin buchen" emerald 999px |
| **Vaccination** | Required | Required | Required upload | Required | Optional MVP / required v2 |
| **Mixed Breed UX** | (breed dropdown only) | — | ✅ explicit checkbox | (breed dropdown) | ✅ **adopt the checkbox** |
| **Pricing transparency** | ✅ on every service | (after store select) | (after location lock) | ✅ membership tier | ✅ on every card |
| **Phone backup** | (store-specific) | (store-specific) | ✅ prominent | ✅ each location | ✅ each groomer |
| **Page height** | 5709px | (blocked) | 6502px | 3176px | TBD |

---

## §13 · Phase 0 supplements (decisions to lock now)

Based on this US-leaders audit, recommended additions to Phase 0 locked defaults:

1. **MVP service count: 8 → 9** (add "Quick Wash" express service — PetSmart + Scenthound both offer; matches "I just need a fast bath" segment)
2. **Pet form: add "Mixed Breed?" checkbox** alongside breed dropdown (Groomit pattern, real DE-CH owner pattern)
3. **Groomer detail page: phone number prominently displayed** alongside online booking (CH owner pattern + Groomit cross-reference)
4. **Trust positioning: wellness > spa** (Scenthound model). Phase 2 brand should pick "Geprüfte Hundepflege" energy, not "Luxus-Hundespa" energy.
5. **Plan for `Solen Versprechen`** — 3-5 brand promises every groomer guarantees. Design schema flag in Phase 3 (`groomers.guarantees_solen_promise boolean`).
6. **Phase 6 B2B is not optional long-term** — Groomit's salon partnership is core to their value prop. Plan for it; defer execution.
7. **Subscription (Solen Abo) — schema-aware in Phase 3, ship in v2.** Don't paint into a corner.

These are **supplements**, not overrides — Phase 0 master decisions stand.
