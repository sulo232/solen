# Pet Grooming Scope Teardown · Phase 0

> Captured 2026-05-13 for Solen → dog-grooming pivot (Basel-first).
> References in `_audits/pet-refs/`: fresha-homepage, rover-homepage,
> pawshake-homepage, tipaw-homepage, cutnlove-homepage, petwashbasel-homepage.
> Validates the pivot premise: no CH-localized dog grooming marketplace
> exists; existing groomers run dated single-site UX or prefer WhatsApp.

---

## §1 · Market context (validation of pivot premise)

Searched "Hundesalon Basel online Termin buchen". Findings:

| Player | Type | Online booking? | Notes |
|---|---|---|---|
| **Tipaw.com** | CH breeder marketplace + groomer directory | Aggregator-style listing | Primary product is **buying puppies** ("Einen Hund von einem verantwortungsvollen Züchter finden"); grooming is a side directory. Not a dedicated grooming platform. |
| **Pawshake.ch** | CH pet-sitter marketplace | Yes (sitter booking) | NO grooming. Sitting / boarding only. |
| **Rover.com/ch/** | International pet care, CH-localized | Yes (sitter booking) | NO grooming. Sitting / walking / Pension / Tagesbetreuung. Confirmed Swiss localization exists for pet care but not grooming. |
| **Fresha.com** | Human beauty marketplace | Yes (top-tier UX) | Universal salon platform but no pet vertical. |
| **cutnlove.ch** (Allschwil/Basel) | Individual groomer | Yes (Wix-style form) | Single salon, basic template, contact form for booking. |
| **petwashbasel.ch** | Individual groomer | "Online" but prefers WhatsApp | Explicit banner: "TERMINE BITTE VORZUGSWEISE PER WHATSAPP ODER SMS". |
| **hundesalon-schnauz.ch** | Individual groomer | Telefonisch + online | Single salon. |
| **hundesalon-mara.ch / mocca.ch / che-bello.ch / fridolin.ch** | Individual groomers | Phone/email-led | Static informational sites. |

**Verdict:** zero CH-localized dog-grooming **marketplace**. Aggregator opportunity is wide open. Existing groomer sites are either single-salon basic templates or push WhatsApp/phone — no real-time availability, no consolidated discovery.

---

## §2 · Fresha UX patterns we steal

Measured `https://www.fresha.com/` at 1440px desktop:

| Dimension | Fresha value | Why steal |
|---|---|---|
| Font system | Single-font (RoobertPRO) | Simpler than Fluz 3-font; tight identity |
| Type scale | 13/14/16/19/22/24/28/40/64/68/96px | Wide-range — hero 64-68px, stat moments 96px |
| Hero h1 | 64px / 68px line-height / weight 700 | Strong but readable (vs Fluz 132px which oversteers) |
| Section h2 | 40px-68px / 700 | Conversational scale — not stadium-billboard |
| Card radius | **16px** | Consumer-marketplace standard |
| Pill / CTA radius | **999px** | Full-pill (matches our Fluz lock) |
| Primary text | `#0D0D0D` warm dark | Not pure black |
| Star yellow | `#FFC00A` | Universal rating cue, 1645+656 uses across page |
| Muted gray | `#767676` | Body secondary |
| Subtle bg | `#F2F2F2` | Light gray sections without strong color |
| Shadows | 1px-inset `#E5E5E5` border-shadows | Soft definition without lift; NOT floating elevation |
| Motion | `cubic-bezier(0.85, 0, 0.15, 1)` 0.1-0.3s | Designer-picked in-out curve |
| Page height | 5654px | Long-form vertical marketing |

**Fresha takeaway**: ONE font family + 16px cards + 999px pills + warm-dark text + yellow stars + custom Bézier curves. Set Fresha as the **structural reference** for our marketplace UX. Don't copy Fluz density (too brutalist for pet-grooming warmth).

---

## §3 · Pet platform competitor analysis

| Aspect | Rover.com/ch | Pawshake.ch | Notes |
|---|---|---|---|
| H1 font | **Bogart-Semibold** (serif) 32px/40px | (DM Sans-like, sans) | Rover uses a **warm playful serif** for the brand h1 — signals trust + premium. |
| Body font | Averta sans 16px | Sans 16px | Both default to friendly sans for body. |
| Primary accent | **Blue `#2E67D1`** | **Sky-blue `#00AFED`** | Both pet platforms use BLUE as primary action color (trust/sky semantics). NOT green. |
| Yellow | `#FFD76A` (badges) | — | Trust badge color, NOT primary action. |
| Card radius | 4px (small!) | 8-12px | Smaller than Fresha's 16px — informational feel, not consumer-marketplace polish. |
| Services | Hundesitter / Tagesbetreuung / Gassi-Service / House Sitting / Pension | "pet sitter" only | NEITHER does grooming. |
| Page height | 4556px | 1097px | Rover marketing-long; Pawshake minimal. |

**Pet platform conventions** (cross-referenced):
- **Blue accent** is the pet-platform default (trust + sky vibes). Solen's emerald is unusual for the category — could be a differentiator OR a discordance.
- **Serif h1** (Bogart-style) signals warmth + premium for pet services. Different from Fluz's heavy condensed sans.
- **Real photography is mandatory** — pet platforms lean heavily on dog/pet photos. No flat illustrations.
- **NO grooming on either** — open lane confirmed.

---

## §4 · CH dog grooming baseline (the "old UI" we displace)

Surveyed 2 representative Basel/Baselland groomer sites:

### cutnlove.ch (Allschwil, near Basel)
- Wix/Squarespace template — "Slide title" leftover placeholders visible in h2s
- H1: "Ihr Hundesalon mit Herz" — warm, personal voice
- Page structure: hero → services → contact (~4641px tall)
- Has online booking, but tucked into "Kontakt" page
- No real-time availability
- No prices visible on homepage

### petwashbasel.ch (Basel)
- Custom website with explicit banner: **"TERMINE BITTE VORZUGSWEISE PER WHATSAPP ODER SMS"**
- Sections: Salon / Leistungen / Preise / Fotos
- Services listed with prices: CHF 30 (small service) → CHF 150 (premium)
- "Pflege / Pfotenpflege / Striegeln / Zahnpflege / Fellpflege / Bad / Stripping"
- Prefers messaging over web booking
- Static page, no calendar

**Common patterns of the "old UI"** (the experience we displace):
1. Single-salon websites (no discovery / comparison)
2. Booking via phone or WhatsApp, no real-time slots
3. Pricing buried or absent from landing
4. No before/after gallery (most don't show portfolio)
5. No groomer ratings or reviews aggregated
6. No pet-profile system — owner manually re-describes pet each visit
7. Wix/Squarespace or hand-coded HTML aesthetic (2015-era UX)

**Our marketplace differentiator** (any 3 of these = clear win):
- Discover multiple groomers in Basel (vs single-site silos)
- Real-time availability (vs WhatsApp tag)
- Transparent pricing on every salon card
- Pet profile saved across bookings
- Aggregated reviews / ratings
- Before/after photo galleries per groomer

---

## §5 · Pet-specific data model requirements

Fields a dog grooming platform needs that human beauty booking doesn't:

| Category | Field | MVP-required? | Notes |
|---|---|---|---|
| **Pet identity** | Name | ✅ required | "Bello", "Luna" — owner refers to by name |
| | Species (dog initially) | ✅ required | Single enum value `dog` in MVP. Cat / rabbit later. |
| | Breed | ✅ required | Affects grooming difficulty / pricing |
| | Age (years) | 🟡 optional | Some groomers care; can drop in MVP |
| | Weight / size class | ✅ required | XS (≤5kg) / S (5-10) / M (10-25) / L (25-45) / XL (45+) — drives pricing tiers |
| | Color | 🟡 optional | Trivia; defer |
| **Coat** | Type | ✅ required | short / long / double / curly / wire — drives grooming type + price |
| | Coat condition / matting | 🟡 optional | Surcharge trigger; defer to v2 |
| **Behavioral** | Temperament | 🟡 optional | "anxious / friendly / aggressive" — groomers need to know; could be free-text in MVP |
| | Prior trauma | ⛔ v2 | Free-text notes only, deferred |
| **Health** | Vaccinations (Rabies / DHPP) + dates | 🟡 **optional in MVP** | Required by some groomers; defer mandatory enforcement to v2. Free-text "current on vaccinations: yes/no" suffices for MVP. |
| | Allergies | 🟡 optional | Free-text notes |
| | Conditions | 🟡 optional | Free-text notes |
| | Last grooming date | ⛔ v2 | Auto-derived from bookings once we have data |
| **Logistics** | Drop-off duration tolerance | ⛔ v2 | Some groomers do 2-3hr full grooms; MVP shows total duration upfront |
| | Mobile groomer vs salon | ⛔ v2 | Salon-only in MVP. Mobile (kommt zu dir) is a later expansion. |
| | Multi-pet | ⛔ v2 | Single pet per booking in MVP. Multi-pet is a later expansion. |
| **Photos** | Pet portrait | 🟡 optional | Owner-uploaded; non-blocking |
| | Before/after archive | ⛔ v2 | Groomer-uploaded; deferred |

**MVP pet profile = 5 required fields** (name, species, breed, size, coat type) + 4 optional (temperament, age, allergies, vaccinations) + 1 photo (optional).

**v2 expansions:** multi-pet, vaccination upload enforcement, mobile groomer, drop-off duration, before/after archive.

---

## §6 · Service catalog MVP (8-10 services)

Catalog drawn from petwashbasel.ch + standard CH groomer services + Tierfreund.ch listings:

| MVP? | Service | DE term | CH price band | Duration | Notes |
|---|---|---|---|---|---|
| ✅ | Bath only | Bad | CHF 30-60 | 30 min | Entry service |
| ✅ | Brush-out / strip | Bürsten / Striegeln | CHF 20-40 | 20-30 min | Often add-on |
| ✅ | Full groom | Vollverwöhnpaket | CHF 80-150 | 1.5-3 hrs | Breed-priced (size class drives) |
| ✅ | Haircut / trim | Schnitt | CHF 40-90 | 30-90 min | Without bath |
| ✅ | Nail clipping | Krallenkürzen | CHF 15-30 | 15 min | Quick service |
| ✅ | Paw care | Pfotenpflege | CHF 20-40 | 20 min | Fur trim + pad balm |
| ✅ | Ear cleaning | Ohrenreinigung | CHF 15-25 | 10 min | Add-on |
| ✅ | Teeth brushing | Zahnpflege | CHF 15-30 | 10-15 min | Add-on |
| 🟡 | De-shedding | Unterwollentfernung | CHF 50-90 | 60 min | Breed-specific; add to MVP if 5+ groomers offer |
| ⛔ v2 | Anti-flea bath | Anti-Floh-Bad | CHF 40-70 | 45 min | Specialty; defer |
| ⛔ v2 | Hand stripping | Stripping | CHF 80-150 | 90 min | Terrier-breeds only; defer |

**Locked MVP catalog: 8 services** (Bad, Bürsten, Vollverwöhnpaket, Schnitt, Krallenkürzen, Pfotenpflege, Ohrenreinigung, Zahnpflege). Add Unterwollentfernung if 5+ Basel groomers offer it during seeding.

**Pricing model:** size-class-dependent for Vollverwöhnpaket / Schnitt / De-shedding. Other services flat-price.

---

## §7 · Booking flow spec

Standard pet-grooming consumer flow (validated against Fresha + adapted for pet domain):

```
1. Homepage → search bar (location + service + date OR "find groomers near me")
2. Results page → groomer cards (photo / name / city / rating / price-from / services)
3. Groomer detail → photos + services list + reviews + about + location map
4. Pick service(s) → expand to size selector (drives final price)
5. Pick pet → either existing profile OR "add new pet" inline form
6. Pick time slot → calendar with available slots (groomer's availability)
7. Confirm → checkout (deposit OR pay-at-salon; defer Stripe deposit to phase 4)
8. Confirmation → email + add to calendar + reminder schedule
```

**Differences from human beauty booking:**
- Step 5 (pet selection) is NEW — requires pet profile to exist OR inline pet creation
- Step 4 — size class drives final price (humans don't have size-class pricing)
- Step 3 — groomer detail must show **breed specialties** if listed (Westie / Poodle / etc.)
- Step 8 — confirmation includes "what to bring" content (collar, vaccination record if applicable)

---

## §8 · MVP feature scope

### In MVP
- Discovery: search by location (Basel + nearby) + service + date
- Groomer profile: photo gallery, services list, about, location, reviews
- Pet profile: 5 required fields (name, species, breed, size, coat type), 4 optional (temperament, age, allergies, vaccinations free-text), optional photo
- Booking flow: pick service → pick pet → pick slot → confirm
- Reviews: post-booking, star rating + text (Fresha pattern)
- Pricing: transparent on every card, size-class-dependent where applicable
- 8-service catalog (§6)
- Single pet per booking
- Salon-only (no mobile groomers)
- Basel + surrounding municipalities (5-10km radius)

### Out of MVP (deferred to v2)
- Multi-pet booking
- Mobile groomers (kommt zu dir)
- Vaccination upload enforcement
- Before/after photo archive
- Drop-off duration matching
- Specialty services (Anti-Floh, Stripping)
- Pet behavioral notes structured
- Cats / rabbits / other species
- B2B groomer tools (admin dashboard) — Phase 6 from master plan

### Geographic launch
- **Basel-only first.** ~5-10 groomers seeded manually.
- Zürich expansion after Basel reaches 100+ bookings.

---

## §9 · Open decisions for Phase 2 (brand)

The teardown reveals brand-design open questions for Phase 2:

1. **Typography direction:** Fresha = single-font sans (RoobertPRO). Rover = serif h1 (Bogart) + sans body. Pet brands lean playful + warm — leaning toward **rounder display** (retire Anton condensed) + warm serif option OR keep Peace Sans (rounded sans, V3 lock).
2. **Color accent:** Pet platforms default to **blue** (Rover #2E67D1, Pawshake #00AFED). Solen V3 is **emerald** — could be a differentiator (warm green = nature/calm) OR feel discordant. Phase 2 decision.
3. **Name:** Solen-rebrand vs keep. Pet sector has zero brand recognition for ALL players → either choice starts at zero. Cost calculus: keep Solen = preserve V3 work investment; rebrand = clean genre fit.
4. **Visual mood:** Fluz-density (brutalist, confident) vs Fresha-warm (consumer-marketplace, approachable) vs Rover-playful (serif, friendly). For pet grooming → **Fresha-warm or Rover-playful**. Drop the Fluz-density direction (wrong genre).

---

## §10 · Phase 1 prerequisites (codebase audit informed by this scope)

Phase 1 (codebase pivot audit) needs to address these specific renames based on the MVP scope:

| Concept | Beauty term | Grooming term | Code location |
|---|---|---|---|
| Provider entity | `salons` table | `groomers` table OR keep `salons` and alias | `supabase/migrations/014_new_schema.sql` |
| Provider category | `SalonCategory` enum (6 cats) | `GroomerService` enum (8 services from §6) | `lib/types.ts:11-17` |
| Profile.hair_type | hair_type (straight/wavy/curly/coily) | DROP from `profiles`, add `pets` table with coat_type | `lib/types.ts:34` + new migration |
| Service.suitable_gender | suitable_gender (m/f) | DROP — replace with `suitable_size_class` (XS/S/M/L/XL) | `supabase/migrations/061_service_gender.sql` |
| Staff.specialties | beauty terms (balayage, etc.) | breed-specialty terms (Westie, Poodle, etc.) | Existing field — content swap only |
| Category landing pages | `/coiffeur`, `/barbershop`, `/nails`, `/spa`, `/makeup`, `/waxing` | Delete; replace with single `/groomers` listing | `app/[locale]/{coiffeur,barbershop,nails,spa,makeup,waxing}/` |
| Beauty components | `components-legacy/{nail,barber,coiffeur,spa}/` | Delete | ~25 files |

**New entity needed** (not in current schema):
- `pets` table: id, owner_id (FK profiles), name, species, breed, size_class, coat_type, age, allergies (text), vaccinations_current (bool), photo_url
- `bookings.pet_id` (FK pets) — new column

**Migration plan for Phase 3:**
- Add: `pets` table + `bookings.pet_id` column
- Rename: `salons` table → keep (alias); rename `salons.category` enum values
- Drop: `profiles.hair_type`, `services.suitable_gender`

---

## Phase 0 closing summary

**Validated:**
- ✅ No CH-localized dog grooming marketplace exists
- ✅ Existing groomers: WhatsApp-led, Wix-template UX
- ✅ Pet platforms (Rover/Pawshake) don't do grooming
- ✅ Tipaw aggregator exists but breeder-focused, not grooming-marketplace
- ✅ Open lane for "Fresha for dog grooming, Basel-first"

**Locked for Phase 1+ (defaults, override if user redirects):**
- MVP catalog: 8 services (Bad, Bürsten, Vollverwöhnpaket, Schnitt, Krallenkürzen, Pfotenpflege, Ohrenreinigung, Zahnpflege)
- Pet profile: 5 required + 4 optional + 1 photo
- Geographic launch: Basel + 5-10km radius
- Single-pet booking, salon-only, B2C-first
- Vaccination tracking: optional free-text in MVP, structured upload in v2
- Mobile groomer (kommt zu dir): deferred to v2
- Brand direction reference: Fresha (warm consumer-marketplace) > Rover (playful serif) > Fluz (brutalist — REJECT for pet)
- Accent color decision: Phase 2 (keep emerald vs adopt pet-platform blue)
- Name decision: Phase 2 (keep Solen vs rebrand)

**Risks identified:**
- R0.1: Tipaw could pivot to grooming-first if our marketplace gains traction. Mitigation: Basel-density advantage + Fresha-quality UX hard to copy fast.
- R0.2: Groomer supply-side onboarding is the actual hard part. Need B2B tools earlier than Phase 6 may suggest. Revisit at Phase 4 completion.
- R0.3: Pet vaccination liability — if we don't enforce uploads, who's liable if dog has rabies? Legal review needed before launch (post-Phase 5).

**Ready for Phase 1** (codebase pivot audit) — informed by §10 prerequisites table.
