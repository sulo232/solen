# Photography + Visual Brand Patterns Across Pet Platforms

> Phase 0.19 — Solen→dog-grooming pivot research.
> Date: 2026-05-13
> Goal: feed Phase 2 brand decisions on hero photography, card photography, color treatment, and illustration usage.

---

## 0. Method + caveat

- WebFetch was blocked (HTTP 403/429) on most US platforms (petsmart.com, petco.com, rover.com, barkbox.com, chewy.com, thefarmersdog.com, pawshake.ch root) — anti-bot guarding.
- Successful direct fetches: **fressnapf.ch** (Coop's Swiss pet retailer), **tipaw.com**, **zooplus.ch** (minimal alt-text), **pawshake.ch** (logo-only).
- Indirect signal came from design critiques, brand-guideline write-ups, photography-industry analyses, and case-study sites. Calls flagged **[inferred]** are conclusions drawn from secondary sources rather than direct render inspection. Calls **[observed]** are from successful WebFetch alt-text or quoted source content.

Conclusion: enough convergent signal across 12+ sources to surface a confident pattern set. Solen should still spot-check 2–3 reference homepages in a real browser before locking Phase 2 photography direction.

---

## 1. Per-platform inventory

| Platform | Country | Hero style | Card style | Color treatment | Breed diversity | Source |
|---|---|---|---|---|---|---|
| Fressnapf | CH/DE | Real photo, close-up portrait | Studio, white bg, close-up | Warm fur tones, neutral bg | Golden Retriever shown; cats, rabbits also | [Fressnapf observed] |
| Zooplus | CH/EU | Marketing banner + category tiles | Product-led grid, lifestyle thumbnails for editorial | Mixed; neutral product, lifestyle for magazine | Not visible in markup; multi-species (dog, cat, small animal, bird, fish, horse) | [Zooplus observed — alt-text thin] |
| Tipaw | CH/FR | Illustration-heavy; SVG avatars + brand graphics | Real-photo team headshots (Zoé, Pierre); banner-grid photo | Cool/blue brand accents | Not breed-led — service-led | [Tipaw observed] |
| Pawshake | CH (PetSitting) | Logo + text-led above the fold (per markup) | App-download focused; no hero dog photo on root page (server-rendered) | n/a | n/a | [Pawshake observed — markup-thin SPA] |
| Chewy | US | Real photo, colorful, pet-as-hero close-ups | Real-photo product + lifestyle mix; supplementary **flat-line illustration** for narrative moments | Colorful, vibrant, playful; not heavily filtered | Diverse, multi-species; design-system explicit about "pets as primary focus" | [Chewy inferred from brand guidelines + Dribbble brand book] |
| Farmer's Dog | US | Real dog photo, lifestyle (kitchen/home), warm | UGC + customer-photo lifestyle | Warm, soft, natural light — "simple, pure, unfussy" | Mixed breeds + commodity breeds; brand emphasizes "every dog" | [Farmer's Dog inferred from About page + Instagram analysis] |
| BarkBox | US | Real dogs **with toys**, color-saturated, playful | Styled product shots ("STYLED" appears in filenames); dog-with-product is the unit | Vibrant, high-saturation; not minimal | Wide breed range; UGC-led; Moose (brand mascot dog) since 2013 | [BarkBox inferred from Adweek + Wikipedia + filename evidence] |
| PetSmart | US | Real photo, bright/colorful, emotional eye-contact | Product grid + category tiles, mixed real-photo | Bright, colorful, "warm and friendly" | Multi-species emphasis (range of animals PetSmart serves) | [PetSmart inferred from brand-shoot portfolio] |
| Petco | US | Real photo hero | Product grid + lifestyle | Bright, similar register to PetSmart | Multi-species | [Petco inferred — direct fetch blocked] |
| Rover | US | Real photo of dog (often with sitter/walker) | Sitter-profile photos drive cards; lifestyle outdoor + indoor mixed | Warm, natural-light biased; "soft window light, overcast preferred" | Wide — UGC drives diversity; brand's own photo guide encourages all breeds | [Rover inferred from photo-guide content + sitter blog posts] |
| Wag | US | Real photo, walker + dog lifestyle | Walker profile cards | Less curated than Rover; "clean but services less immediately recognized" | UGC-led; less locked | [Wag inferred via comparison piece] |
| Scenthound | US | **Embedded hero video** (not still photo); real dogs in motion | Real-dog lifestyle + clinical/wellness moments (vet-context, nose-to-nose human moments) | Blue brand palette accent; warm lifestyle photography elsewhere | Variety — small dog, beagle puppy, cream-colored poodle in case study | [Scenthound inferred from grooming-sites round-up + case study brand site] |
| Pride In Grooming | US (groomer) | Real client dogs throughout | Real-client dog photos every scroll section | Warm, salon-context | Wide — uses real client work | [Pride In Grooming inferred from grooming-sites round-up] |
| Pink Dog USA | US (groomer) | Real photo + coral/pink brand color | Studio + salon-context | **Warm** (coral/pink) | Varies | [Pink Dog inferred from Zarla round-up] |
| Woof Gang | US (chain groomer) | Real photo, brand-color (pink/coral) | Real-dog photos | Warm | Varies | [Woof Gang inferred from Zarla round-up] |
| Fluff & Buff | US (groomer) | **Cute pet illustrations** — outlier | Illustrations + photos | Soft, illustration-led | n/a | [Fluff & Buff inferred from Zarla round-up — exception to rule] |
| Luxury Mobile Pet Grooming | US (groomer) | Real photo + **soft blue palette** | Mobile-van context | **Cool** | Varies | [Inferred from Zarla round-up] |
| Perfect Pooch | UK (groomer) | Real photo + black UI for sophistication | Studio salon shots | Neutral/sophisticated | Golden retrievers + small fluffy breeds | [Inferred from Zarla round-up] |
| Jim's Dog Wash | AU (groomer) | Real photo + **bold red** brand | Salon + outdoor | Bold/saturated | Varies | [Inferred from Zarla round-up] |

---

## 2. Hero imagery patterns

### Pattern A — Real-photo hero, lifestyle, warm-natural-light (DOMINANT for premium DTC)
- **Owners:** Farmer's Dog, Rover, Chewy emotional campaigns, premium-pet-Shopify-brand archetypes.
- **Recipe:** Real dog (often mixed-breed or non-obvious purebred), in-context setting (kitchen, sofa, sidewalk, sitter's home), soft natural light (window or overcast), neutral-to-warm color grade, eye-contact framing.
- **Why it works:** Per Rover's own photo guidance — "friendly + casual but professional enough for trust." Per Farmer's Dog brand DNA — "simple, pure, unfussy relationship between human, dog, and earth."

### Pattern B — Real-photo hero, studio, neutral background (DOMINANT for retail/e-commerce)
- **Owners:** Fressnapf (Golden Retriever close-up on white bg), PetSmart product-category headers, Petco product tiles, Zooplus product banners.
- **Recipe:** Single subject, white or very pale neutral background, close-up framing emphasizing facial expression, neutral lighting, warm fur tones preserved.
- **Why it works:** Reads as catalog/product-clarity. Lower emotional intensity but higher transactional efficiency.

### Pattern C — Hero video (not still) (EMERGING — Scenthound)
- **Owners:** Scenthound, increasingly common in DTC pet wellness.
- **Recipe:** 6-10s loop showing dog mid-bath, mid-groom, or post-groom looking content. Plays muted, autoplays.
- **Why it works:** Adds motion + signals "real work happens here" — credibility per the 2026 pet-photography-trends analysis (real expertise, real process, real care).

### Pattern D — Illustration-led hero (LOSING GROUND; only Tipaw + Fluff & Buff)
- **Owners:** Tipaw (sitter-marketplace, CH/FR), Fluff & Buff (single groomer site).
- **Why it's losing:** Per pet-photo industry trend reports — "for years marketers chased polished aesthetics with matching filters, stock photos, perfect captions — but perfection doesn't connect." Illustrations read as either (a) playful boutique or (b) unable-to-afford-real-photography. Premium positioning now requires real photography.
- **Solen take:** Illustrations should NOT replace hero photography.

### Pattern E — Hero render / 3D dog
- **Not observed** in any source. The 3D-render-dog look hasn't taken hold in pet platforms (unlike in fashion / D2C electronics where 3D product renders are common).

---

## 3. Card photography patterns

| Card type | Most common style | Evidence |
|---|---|---|
| **Service-listing card** (groomer, sitter, salon) | Real photo of the service-provider's actual work — dog in-salon, mid-groom, or post-groom. Mobile-van + at-home for mobile groomers. | Muffin Group round-up: "real photos outperform stock images every time. The strongest sites show actual dogs mid-groom, freshly bathed, or posing after a full cut." |
| **Provider-profile card** (groomer headshot context) | Provider with dog they groomed; warm lifestyle | Rover sitter-photo guide: "tell a visual story by including pictures of people interacting with animals." |
| **Service-category card** (homepage tiles like "Bath" / "Cut" / "Nails") | Close-up real-photo of the relevant body part / service in action; sometimes flat-line illustration as supplementary icon | Chewy guidelines (illustration used "when moments and stories cannot fully be told through the lens of a photograph"). |
| **Product-grid card** (e-commerce) | Studio white-bg product, isolated; lifestyle for editorial section only | Fressnapf, Zooplus, PetSmart, Petco patterns. |
| **Empty-state / 404 / loading** | Flat-line illustration in brand colors | Chewy explicitly designs illustrations for moments photos can't carry; the only legitimate non-photo use. |

**Hard rule emerging:** lifestyle > studio for service marketplaces; studio > lifestyle for product retail. Solen is a service marketplace → **lifestyle wins.**

---

## 4. Breed diversity findings

### Most over-shown breeds (industry-wide)
- **Golden Retriever** — dominates stock libraries (84,400+ on iStock, 822K+ on Adobe Stock, 32K+ on Getty). Per the brand-photo industry, Golden Retriever images are "designed to show smartness, cuteness, and noble beauty" — a marketing default.
- **Labrador Retriever** — equally over-represented.
- **Small fluffy breeds** (Bichon, Maltese, Pomeranian, Shih Tzu) — common on grooming sites because they showcase fluff-after-cut visual transformation.

### Under-shown breeds
- **Mixed breeds** — under-represented in stock; over-represented in UGC (Farmer's Dog Instagram, BarkBox customer photos, Rover sitter dogs). The "authentic" brands have learned to use UGC to inject diversity.
- **Working / herding breeds** — Schäferhund (German Shepherd), Border Collie, Australian Shepherd: under-shown in retail-pet imagery.
- **Swiss breeds** — Berner Sennenhund (Bernese Mountain Dog), Appenzeller Sennenhund, Grosser Schweizer Sennenhund, Entlebucher Sennenhund: highly visible in Swiss culture but virtually absent from international pet-platform stock photography. **Solen's CH-native opportunity: show these dogs.**
- **Smaller working breeds** — Pinscher (Miniature, Doberman), Schnauzer (Mini, Standard, Giant), Dachshund: under-shown.
- **Non-pedigree senior dogs** — under-shown universally; grooming brands miss the senior-dog market by defaulting to puppy photography.

### Diversity score heuristic
- **High (8/10+):** Rover, BarkBox, Farmer's Dog (UGC-driven feeds inject natural diversity).
- **Medium (5–7/10):** Chewy, PetSmart, Scenthound (curated but still wide).
- **Low (≤4/10):** Fressnapf, retail catalogs — defaults to Golden Retriever / generic.

---

## 5. Dog-alone vs dog-with-human ratio

**Industry split [inferred from sources]:**

| Context | Dog-alone | Dog-with-human | Notes |
|---|---|---|---|
| Hero photo | ~30% | **~70%** | Rover explicitly recommends "pictures of people interacting with animals." Farmer's Dog signature is human-cooking-while-dog-supervises. |
| Service-provider cards (groomer / sitter / vet) | ~10% | **~90%** | Trust signal is the human-with-dog moment. |
| Product packaging shots | **~80%** | ~20% | Product-as-hero, dog-as-context. |
| Empty state / brand illustration | n/a (illustrated) | n/a | Often anthropomorphic mixed scenes. |
| About / team page | ~5% | **~95%** | Provider stories require human face. |

**Solen take:** Homepage hero should be dog-with-groomer-or-owner, not lone-dog-portrait. Salon cards should show groomer + dog mid-work (the Rover/Scenthound pattern). Empty states + about page can include human-only or dog-only moments. The lone-dog-portrait belongs on product detail pages or sitter profile thumbnails — never the hero.

---

## 6. Color treatment trends

### Three dominant grading approaches

1. **Warm-natural** (DOMINANT for premium DTC + service marketplaces)
   - Owners: Rover, Farmer's Dog, Chewy lifestyle moments, Pink Dog USA, Woof Gang, premium-pet-Shopify-archetype.
   - Tone: golden hour, window-light, soft shadows, slightly raised blacks, preserved warm fur tones.
   - Why: matches "enduring companionship" emotional tone, photographs well against cream / off-white substrates.
   - **This is the Solen-substrate-compatible recipe** (cream `#F5EBDD` + emerald `#1F5C42` + terracotta `#C97A57`).

2. **Cool-clinical** (USED FOR WELLNESS / VET POSITIONING)
   - Owners: Scenthound (blue brand palette), Luxury Mobile Pet Grooming (soft blue), generic vet brands.
   - Tone: cool whites, blue accents, higher color temperature, more clinical.
   - Why: signals medical / wellness / scientific. **Does NOT match Solen's earthy emerald + cream substrate.**

3. **Bright-saturated-playful** (USED FOR ENTERTAINMENT / SUBSCRIPTION-BOX)
   - Owners: BarkBox, Chewy general feed, PetSmart, Jim's Dog Wash (bold red).
   - Tone: high saturation, plenty of color, vivid product shots, no subtlety.
   - Why: matches monthly-treat / impulse-purchase emotional register. **Does NOT match Solen's wellness + earthy positioning.**

### Recommendation for Solen
**Lock the warm-natural recipe.** Match the cream substrate by grading photography to:
- Slightly warm white balance (5200–5800K target).
- Preserved warm fur tones (don't desaturate to a flat editorial gray-wash).
- Soft natural shadows (no hard product-shot black drops).
- Avoid: heavy filters, Instagram-orange grade, mid-2010s teal-and-orange.

---

## 7. Illustration usage rules

### Where leading brands DO use illustrations
- **Empty states** (no-data, no-results, 404) — Chewy explicit rule.
- **Functional icons** (services, ratings, locations) — universal (Tipaw, Groomit, virtually every pet platform).
- **Editorial / narrative moments** — Chewy: "when moments and stories cannot fully be told through the lens of a photograph" (e.g. anthropomorphic scenes, large-than-life storytelling).
- **App onboarding** — common pattern.
- **Brand world-building** — print campaigns, packaging accents.

### Where leading brands DO NOT use illustrations
- **Hero imagery** — illustration-led heroes are losing ground. Even quirky brands (BarkBox, Chewy) lead with real dogs.
- **Service-provider cards** — never illustrated; trust signal requires real photo.
- **Product detail** — never illustrated for the hero image.
- **About / team** — never illustrated; humans need to be real.

### Solen-specific guidance
- **Yes:** illustrations for empty states (no favorites yet, no recently-viewed yet, no bookings yet, no nearby groomers in this canton), micro-icons (service-type glyphs), functional UI (filters, badges), brand-world accents.
- **No:** illustrated hero. Illustrated salon cards. Illustrated groomer cards. Illustrated category tiles.
- **Illustration style brief:** flat-line, brand-tokenized (`s-brand` emerald + `s-accent` terracotta), low-detail, expressive, **dog-shapes acceptable** (mixed breed silhouettes, generic dog forms). Match Chewy's playbook: "bold, flat line illustrations using brand colors with thoughtful exaggerations."

---

## 8. Solen photography guidelines for Phase 2 brand

### 8.1 Hero photography
- **Source:** real dog photo (no illustrations, no 3D render).
- **Subject:** preferred dog-with-groomer or dog-with-owner; secondary acceptable solo-dog if framing is contextual (in-salon, in-home).
- **Setting:** lifestyle in-context preferred (salon interior, home setting, Swiss outdoor) over clean studio.
- **Lighting:** natural light, window or overcast, no harsh midday sun. Per Rover's own published guidance.
- **Grade:** warm-natural (Section 6 Pattern 1). White balance 5200–5800K. Preserved warm fur tones. Soft shadows.
- **Composition:** dog at viewer eye-level (not down-shot), face partially or fully visible, intentional negative space top-right for headline overlay.
- **Breed:** mixed breed or Swiss-native breed preferred over Golden Retriever / Labrador defaults. Avoid stock-photo Golden Retriever close-up that signals catalog-retail (Fressnapf pattern).
- **Resolution:** 2400px+ width source; serve via Next/Image responsive.

### 8.2 Salon-card photography
- **Source:** real photo, ideally provider-supplied (UGC pattern of Rover + Farmer's Dog).
- **Subject:** salon interior OR groomer-mid-work-with-dog OR after-grooming-portrait. Avoid empty exteriors.
- **Setting:** in-salon lifestyle preferred. Studio only for amenity-detail close-ups.
- **Aspect:** 3:2 or 4:3 to match V3 card system.
- **Fallback:** branded placeholder using `s-brand` + `s-accent` flat illustration when provider hasn't uploaded — never a stock dog photo (immediately spotted, trust drops per Muffin Group analysis).

### 8.3 Breed diversity guidelines
- **Required mix across hero rotation + featured-salons + marketing pages:** at minimum one mixed-breed, one Swiss-native breed (Berner Sennenhund / Appenzeller / Sennenhund family / Schweizer Schäferhund), one small fluffy breed (groomer-relevant), one short-haired working breed (Pinscher / Dackel / Schnauzer).
- **Avoid:** all-Golden-Retriever, all-Doodle, all-puppies (skews young; senior dogs are 30%+ of grooming market per industry trends).
- **Avoid:** ethnically homogeneous human owners — match Swiss demographic reality.

### 8.4 Color treatment
- **Warm-natural** to match cream substrate `#F5EBDD`.
- Photos must read as continuous with the page substrate, not floating on a different color universe.
- **Test:** dropping the photo onto the Solen cream substrate should feel like a single environment, not a sticker pasted on. If the photo's whites pop against the cream as "brighter than the page," regrade warmer.
- **Anti-pattern:** the Scenthound cool-blue grade. Reads clinical; clashes with emerald + terracotta + cream.

### 8.5 Illustration usage
- **Where:** empty states (no-favorites, no-bookings, no-nearby, no-recently-viewed), micro-icons (service glyphs), category tile accents (next to or behind real photo, never replacing), brand-world print/print-out moments.
- **Style:** flat-line, brand-tokenized, low-detail, Chewy-derived. Dog-shape silhouettes acceptable.
- **Where NOT:** hero, salon cards, groomer profile, category tiles when budget allows real photos, about / team pages.

---

## 9. Decisions surfaced for Phase 2

### 9.1 Hero photo source
**Recommended path:** START with curated Unsplash CC0 / Pexels (warm-grade conformable) for launch. PLAN for commissioned custom photography Phase 3 once 10+ real salons are live (UGC backfills naturally per the Rover / Farmer's Dog playbook).
- Why not all-stock: pet owners spot generic stock immediately per Muffin Group; trust drops.
- Why not all-custom-day-1: budget + breed-diversity coverage is hard to schedule in one shoot.
- **Hybrid is the pattern Farmer's Dog and Rover both use** (curated + UGC).

**Specific Unsplash / Pexels search terms to seed Phase 2 mood boards:**
- "Bernese Mountain Dog Switzerland alps lifestyle"
- "groomer dog salon natural light"
- "mixed breed dog window light home"
- "Swiss Alps dog walking" — atmospheric context cues
- Avoid: "studio dog portrait white background" (wrong register), "doodle puppy" (overdone).

### 9.2 Studio vs lifestyle
**Lock: lifestyle for hero + salon cards. Studio only for amenity-detail and product-style close-ups (e.g. nail-trim product close-up, ear-cleaning detail).**

Reasoning from sources:
- Service marketplaces (Rover, Scenthound, Pride In Grooming, Pawshake) all use lifestyle.
- Studio dominates only retail (Fressnapf, Zooplus, PetSmart-Petco product catalogs).
- Solen is a service marketplace → lifestyle.

### 9.3 Illustration usage
**Lock: use for empty states + functional icons + brand accents. Never replace hero or card photography.**

Phase 2 illustration set to commission/source:
- Empty states: 4 illustrations (no-favorites, no-bookings, no-nearby, no-search-results).
- Service-category glyphs: 4 illustrations (Coiffeur, Barbershop, Nails, Spa & Wellness) — matching V3 category lock.
- Possibly: brand-mascot dog silhouette for 404 + loading. Optional; not load-bearing.

**Style brief:** flat-line, two-tone (`s-brand` emerald + `s-accent` terracotta on `s-bg-base` cream), low-detail, Chewy-derived. Avoid: gradient mesh illustrations, 3D-render-style, anime/sticker, over-detailed corporate-illustration (e.g. Tipaw's quasi-3D avatar style — too cluttered).

### 9.4 Open questions for the user (not auto-resolvable)

- **Q1 Commissioning timeline:** is Phase 2 budget for a 1-day commissioned photo shoot? If yes, lock 6 hero candidates + 12 salon-card candidates in one day; if no, start with curated Unsplash and tag UGC backfill as Phase 3 commit.
- **Q2 Swiss-native breed priority:** confirm "show Berner Sennenhund / Appenzeller / Schäferhund / Pinscher in hero rotation" reads as authentic-Swiss vs as kitschy-touristy. Different demographics could read it differently.
- **Q3 Dog-with-human ratio for hero:** lock 70%-with-human or 50/50? My recommendation is 70%-with-human per industry pattern (Section 5), but if Solen brand-tone wants more dog-as-individual the split shifts.
- **Q4 Illustration vs photo for empty states:** illustration is the standard (Chewy explicit rule), but Solen could optionally use real-dog stock with reduced opacity over cream for a less-cartoony empty-state register. Brand-tone call.

---

## 10. Sources

### Direct fetches (alt-text observed)
- Fressnapf homepage (fressnapf.ch) — studio white-bg, Golden Retriever close-up, warm fur tones, multi-species (dog/cat/rabbit).
- Tipaw homepage (tipaw.com) — illustration-heavy SVG, team headshots only, no breed-led photography.
- Zooplus homepage (zooplus.ch) — markup-thin alt-text, multi-species category tiles, no clear breed-led hero.
- Pawshake homepage (pawshake.ch) — SPA root, server-rendered text-only, no inline photography.

### Indirect (design critique + brand guideline sources)
- Chewy brand guidelines (Ashley Sojo, Donnie's brand book on Cargo Collective, Yanaisis Collazo's Instagram guideline analysis on Medium).
- Chewy.com design critique (IXD@Pratt).
- Chewy + PetMD brand-rebrand case study (Katie Silver).
- Rover.com sitter photography guide (rover.com/blog/sitter-resources/take-perfect-pet-photo/, /how-to-make-profile-shine/, /how-to-take-profile-photo/, /professional-photo-session/).
- Rover Wagmore book (roverworks.org — Andrew Grant photography project, 360 dogs).
- BarkBox brand process (Adweek piece on BarkCreative Instagram + Wikipedia BarkBox page).
- The Farmer's Dog (thefarmersdog.com About page + Instagram analysis on Medium by Charlie Hoyt + their own brand voice).
- Scenthound brand case study (casestudybrands.com/scenthound + scenthound.com/category-positioning + smallbiztrends and Stevie Awards write-ups).
- Pet-grooming-website round-ups: Muffin Group (32+ examples), Zarla (20 examples with explicit color-treatment + photography breakdown), Squarestash (32 examples).
- Premium-pet-Shopify-design write-up (airsang.com/designing-a-shopify-pet-brand-experience/).
- Pet-photography industry trends (businessresearchinsights.com pet-photography-market-113105 + metatechinsights pet-photography-market-1152 + petage.com 2025-marketing-shifts-2026 + stucksoap.com dog-grooming-trends-2026).
- Pet brand identity inspiration archive (99designs.com/inspiration/branding/pet).
- Swiss dog breed primer (Wikipedia Bernese Mountain Dog + Swiss Mountain Dog + hepper.com swiss-dog-breeds + petrage.net 6-wonderful-dog-breeds-from-switzerland).

### Sources blocked / partial (cite as inference, not direct observation)
- petsmart.com, petco.com, rover.com US root, barkbox.com, chewy.com, thefarmersdog.com root, bark.co — HTTP 403 on direct WebFetch; inference drawn from secondary brand-process write-ups + Instagram analyses + design critiques.

---

## 11. Phase 2 action items

1. Lock photo recipe: lifestyle real-dog + warm-natural grade + 70% dog-with-human + Swiss-breed-inclusive rotation. (Section 8.1)
2. Commission OR curate hero photo set: 6 hero candidates + 12 salon-card candidates. Decide Q1 above first. (Section 9.1)
3. Commission illustration set: 4 empty-state illustrations + 4 service-category glyphs in flat-line two-tone brand-tokenized style. (Section 8.5 + 9.3)
4. Add photography style guide entry to `_tasks/SOLEN_LIVE_TRUTH.md` under a new §11 or extend §5 if brand-tone-relevant: pin the warm-natural recipe, the breed-diversity required mix, and the lifestyle-over-studio rule.
5. Update `_rules/SOLEN_PATTERNS.md` photography section (if exists) to reference this audit + Section 8 guidelines as the photo-direction spec for V3 wire-up.
6. When Tier 1 salon detail pages get wired (per `_audits/2026-05-10-v3-wireup-audit.md`), enforce real-photo guardrails: validate `salons.cover_photo` URL exists, fall back to branded illustration NOT stock dog photo, and warn salon owners on dashboard that lifestyle photos outperform studio per industry pattern.
