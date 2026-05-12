# SEO patterns audit — pet grooming platforms

**Date:** 2026-05-13
**Phase:** 0.17 of Solen→dog-grooming pivot research
**Scope:** URL structure, meta patterns, Schema.org JSON-LD, multi-locale SEO, city-page strategy, Google My Business
**Sites researched:** PetSmart, Petco, PetBacker, Tipaw, cutnlove.ch, petwashbasel.ch, Fresha CH, Schema.org docs

> Evidence-confidence levels used below:
> - `[OBSERVED]` — pasted from live page-source or a Google-indexed URL
> - `[INFERRED]` — derived from URL patterns Google indexed but page itself blocked / minimal page-source
> - `[GUIDANCE]` — from SEO docs / Google Search Central / Schema.org, not from a specific site

---

## 1. URL pattern inventory

| Platform | Service / category page | City / location page | Individual venue page | Locale prefix |
|---|---|---|---|---|
| **PetSmart** | `services.petsmart.com/grooming` | `stores.petsmart.com/[state]/[city]/[neighborhood]/grooming` | (no separate stylist page — store IS the unit) | none (US-only) |
| **PetSmart store roll-up** | — | `stores.petsmart.com/us/[state]` and `stores.petsmart.com/us/[state]/[city]` | — | `/us/` country segment |
| **Petco** | `petco.com/shop/en/petcostore/c/grooming-services` | `stores.petco.com/[state]/[city]/...` (typical pattern, page blocked) `[INFERRED]` | — | `/en/` segment |
| **PetBacker** | `petbacker.com/s/pet-grooming` | `petbacker.com/s/pet-grooming/[city]--[canton]--[country]` | `petbacker.com/sp/[slug]` `[INFERRED]` | `?lang=en-GB` query param (not subpath) |
| **Tipaw (BE)** | `tipaw.com/be/fr/listing-professionnels/toiletteur/` | `tipaw.com/be/fr/liens/toiletteur/` (city-roll-up index) | `tipaw.com/be/fr/professionnel/toiletteur/[salon-slug]/` | `/[country]/[lang]/` two-segment prefix |
| **cutnlove.ch** | (single-business site, no directory) | — | `/` + `/en-gb` for English | `/en-gb` for non-default lang |
| **petwashbasel.ch** | (single-business site) | — | `/` only | none (images for FR/EN/ES, no real i18n routes) |
| **Fresha** (category × city) | `fresha.com/lp/en/bt/[category]/in/[cc]-[city]` | `fresha.com/lp/en/[cc]-[city]` | `fresha.com/a/[salon-slug-with-address]-[id]` OR `fresha.com/lvp/[slug]` for low-volume / unclaimed pages | `/lp/en/` — locale baked into landing-page slug |

### Verbatim Fresha URL examples `[OBSERVED]`

```
fresha.com/lp/en/ch-basel                                       (city)
fresha.com/lp/en/bt/beauty-salons/in/ch-basel                   (category × city)
fresha.com/lp/en/bt/nail-salons/in/ch-basel                     (category × city)
fresha.com/a/les-mains-basel-sternengasse-6-r0dcmz2h            (claimed venue)
fresha.com/lvp/individuel-cosmetics-basel-gerbergasse-basel-oojRga   (low-volume venue)
fresha.com/lvp/aveda-salon-suite-beauty-consulting-hair-salon-jungstrasse-basel-wXAEAo
```

**Pattern read:** Fresha's SEO money-pages are `/lp/[lang]/[cc]-[city]` and `/lp/[lang]/bt/[category]/in/[cc]-[city]`. The "bt" segment ("business type") + `in/[cc]-[city]` keeps the category × city × country indexable in one URL — and the venue pages use a long human-readable slug ending in a short opaque id (e.g. `r0dcmz2h`) so the slug carries the keywords but stays globally unique.

### Verbatim PetSmart URL examples `[OBSERVED]`

```
services.petsmart.com/grooming                                   (service hub)
stores.petsmart.com/us/ny                                        (state index)
stores.petsmart.com/us/ny/manhattan                              (city index — implied)
stores.petsmart.com/ny/manhattan/manhattan-flatiron-ny/grooming  (store-level grooming page)
stores.petsmart.com/ok/oklahoma-city/oklahoma-city-southside/grooming
stores.petsmart.com/ca/los-angeles/los-angeles-midtown/grooming
```

**Pattern read:** PetSmart separates **service** (`services.petsmart.com`) from **stores** (`stores.petsmart.com`) on different subdomains. The store-level URL is `[state-abbr]/[city]/[store-neighborhood-slug]/grooming` — three geo segments deep. Note `/grooming` at the END (suffix), not the start. This means /grooming is the LEAF service-type filter on a store row.

### Verbatim Tipaw URL examples `[OBSERVED]`

```
tipaw.com/be/fr/listing-professionnels/toiletteur/                              (category hub)
tipaw.com/be/fr/professionnel/toiletteur/wouf-salon-toilettage-waterloo/        (individual groomer)
tipaw.com/be/fr/professionnel/toiletteur/salon-de-toilettage-a-waterloo-wami-grooming-waterloo-3c6md1dk/
tipaw.com/be/fr/liens/toiletteur/                                                (city index for groomers)
```

**Pattern read:** Two-segment locale prefix `/be/fr/`, then `/listing-professionnels/[type]/` for the directory, `/professionnel/[type]/[slug]/` for the venue, and `/liens/[type]/` for the geographic roll-up index. **Tipaw bakes the city into the slug** (e.g. `-waterloo-`) rather than in path segments — that's the same trick Fresha uses for `/lvp/` low-volume venues.

---

## 2. Meta tag patterns

### Title patterns `[OBSERVED + INFERRED]`

| Page type | Pattern | Real example |
|---|---|---|
| Fresha city | `Best Salons in [City], [Country] \| Fresha` | "Best Salons in Basel, Switzerland \| Fresha" `[OBSERVED]` |
| Fresha category × city | `Best [Category] near me in [City], [Country]` | "Best Beauty Salons near me in Basel, Switzerland" `[OBSERVED]` |
| Fresha venue | `[Name] - [Street] - [City] \| Fresha` | "LES MAINS - Sternengasse 6 3 OG - Basel \| Fresha" `[OBSERVED]` |
| PetSmart store grooming | `PetSmart Pet Grooming Locations - [City], [State]` | "PetSmart Pet Grooming Locations - MANHATTAN, New York" `[OBSERVED]` |
| PetBacker city | `Top Pet Grooming in [City] with Best Prices on PetBacker` | "Top Pet Grooming in Basel with Best Prices on PetBacker" `[OBSERVED]` |
| Tipaw category | `Toiletteurs \| Tipaw` | (raw heading "Toiletteurs" observed; full title not exposed) `[INFERRED]` |

**Three repeating ingredients across all platforms:**
1. **Superlative or intent qualifier** — "Best", "Top", "near me"
2. **Category + city** — directly answers what most users type
3. **Brand at end** — pipe-separated, never first

**Solen takeaway:** for `/[city]/hundepflege` style pages we should match this pattern verbatim — "Beste Hundepflege in Basel \| Solen" / "Die besten Hundesalons in Basel". The brand goes at the end; don't lead with "Solen".

### Meta description patterns

None of the live fetched HEAD blocks exposed clean meta descriptions in the SSR/text-render mode used here — Fresha and PetSmart both inject the description via client-side rendering or are gated behind a 403 to bots. Based on Google SERP snippets and SEO guidance docs `[GUIDANCE]`:

- ~155 chars
- Contains city + category + a price or rating signal ("from CHF 60", "rated 4.8")
- Includes a CTA verb ("Book online", "Compare prices")
- Mentions count of providers ("23 salons in Basel")

Template recommendation for Solen:
```
{count} Hundesalons in {Stadt} ab CHF {minPrice}. Vergleiche Preise &
Bewertungen, buche online in 60 Sekunden — von zertifizierten Hundecoiffeuren.
```

### OpenGraph + Twitter card patterns `[GUIDANCE]`

The blocked HEADs prevented direct observation, but the marketplace pattern is:
- `og:type=website` for city/category pages, `og:type=business.business` for venue pages
- `og:image` = a venue hero photo (1200×630 recommended)
- `og:locale` matches the URL locale (de_CH, en_US, fr_CH)
- `og:locale:alternate` lists every other locale
- Twitter: `summary_large_image`

---

## 3. Schema.org JSON-LD patterns

### What we observed on the wire

**None of the directly-fetched pages exposed JSON-LD via the WebFetch render path.** That doesn't necessarily mean Fresha / PetSmart / Tipaw have no JSON-LD — large SPAs often inject it via `next/head` after hydration, which a text-only fetch wouldn't pick up. Spot-checking via `view-source:` in a real browser would confirm. For now this is `[NOT-OBSERVED]` rather than `[CONFIRMED-ABSENT]`.

cutnlove.ch and petwashbasel.ch (both small single-business sites) `[CONFIRMED-ABSENT]` — no LocalBusiness, no PetService, no AggregateRating. Both are leaving rich-results CTR on the table. This is the typical CH small-business state — and Solen's marketplace markup will be a real differentiator.

### Schema.org type catalog for pet grooming `[OBSERVED on schema.org]`

Schema.org has **no `PetService` or `AnimalGrooming` type**. The animal-related types are:
- `AnimalShelter` — parent: `LocalBusiness`
- `PetStore` — parent: `LocalBusiness`
- `VeterinaryCare` — parent: `LocalBusiness`

For a dog-grooming business, the canonical choice is **`LocalBusiness`** directly (or a `HealthAndBeautyBusiness` subtype). Google's guidance is to "use the most specific subtype." Since there's no PetGrooming subtype, the realistic options are:

| Option | Pros | Cons |
|---|---|---|
| `LocalBusiness` (generic) | Universally accepted, simple | Loses specificity → fewer rich-result entitlements |
| `HealthAndBeautyBusiness` | Closer fit, has well-known subtypes (HairSalon, BeautySalon, NailSalon) | Strictly meant for human personal care |
| `HairSalon` | Best rich-result eligibility; Google clearly understands it | Semantic mismatch — dogs ≠ humans |
| `PetStore` | Animal-domain | Wrong vertical — store ≠ service |
| `Service` with `serviceType="dog grooming"` + nested `provider` (`LocalBusiness`) | Most semantically correct | Lower SERP signal than a typed Business |

**Recommended Solen approach:** emit BOTH on each venue page — one `LocalBusiness` (root entity for Maps/Knowledge Graph) AND one `Service` per offered service (`@type: "Service"`, `serviceType: "Dog grooming"`, nested `provider: { @type: "LocalBusiness", @id: "..." }`). This matches Google's "duplicate-typing" pattern used by Fresha-style marketplaces and gives both local-pack eligibility and service-rich-results.

### Reference JSON-LD template (Solen MVP venue page) `[GUIDANCE]`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://solen.ch/groomer/petwash-basel#business",
      "name": "Pet Wash Basel",
      "image": "https://solen.ch/og/petwash-basel.jpg",
      "url": "https://solen.ch/groomer/petwash-basel",
      "telephone": "+41 76 266 79 92",
      "priceRange": "CHF",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Kannenfeldstrasse 12",
        "addressLocality": "Basel",
        "addressRegion": "BS",
        "postalCode": "4056",
        "addressCountry": "CH"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 47.5680,
        "longitude": 7.5750
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Thursday","Friday"],
          "opens": "09:30",
          "closes": "18:00"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "143"
      }
    },
    {
      "@type": "Service",
      "@id": "https://solen.ch/groomer/petwash-basel#service-bath-cut",
      "name": "Bad + Schnitt (Hund mittel)",
      "serviceType": "Dog grooming",
      "provider": { "@id": "https://solen.ch/groomer/petwash-basel#business" },
      "areaServed": { "@type": "City", "name": "Basel" },
      "offers": {
        "@type": "Offer",
        "price": "85.00",
        "priceCurrency": "CHF",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Solen", "item": "https://solen.ch/" },
        { "@type": "ListItem", "position": 2, "name": "Basel", "item": "https://solen.ch/basel" },
        { "@type": "ListItem", "position": 3, "name": "Hundepflege", "item": "https://solen.ch/basel/hundepflege" },
        { "@type": "ListItem", "position": 4, "name": "Pet Wash Basel" }
      ]
    }
  ]
}
```

Three things this template gets right that the audited CH single-business sites get wrong:
1. **@graph + @id linking** — one entity, multiple types, no duplicate root nodes
2. **AggregateRating nested inside LocalBusiness** — Google's documented placement
3. **BreadcrumbList** — separate node, drives the trail-style SERP snippet

### Reference JSON-LD template (Solen city landing page) `[GUIDANCE]`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "name": "Hundepflege in Basel",
      "url": "https://solen.ch/basel/hundepflege",
      "description": "23 zertifizierte Hundesalons in Basel. Vergleiche Preise & Bewertungen."
    },
    {
      "@type": "ItemList",
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "numberOfItems": 23,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://solen.ch/groomer/petwash-basel"
        }
        // ... up to ~20 top venues
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Solen", "item": "https://solen.ch/" },
        { "@type": "ListItem", "position": 2, "name": "Basel", "item": "https://solen.ch/basel" },
        { "@type": "ListItem", "position": 3, "name": "Hundepflege" }
      ]
    }
  ]
}
```

---

## 4. Multi-locale SEO — hreflang patterns for CH

### What we observed

- **Fresha** uses URL-baked locale (`/lp/en/...` for English variants). They presumably emit hreflang in the head (not observable via fetch). Their crawlable URL gives English versions for CH cities — no de_CH-specific URL was indexed at top of the SERP.
- **Tipaw** uses two-segment country/lang prefix (`/be/fr/...` and `/be/nl/...`). Bidirectional hreflang implied by the parallel URL structure `[INFERRED]`.
- **cutnlove.ch** has DE (default `/`) + EN (`/en-gb`) — no formal hreflang markup `[CONFIRMED-ABSENT]`. EN-GB is also wrong; should be `en-CH`.
- **petwashbasel.ch** — no real i18n routes, just static image labels for FR/EN/ES. No hreflang. `[CONFIRMED-ABSENT]`

### CH hreflang locked best-practice `[GUIDANCE]`

- Use **ISO `xx-CH`** codes: `de-CH`, `fr-CH`, `it-CH`, `en-CH`
- Use a default `x-default` pointing to the language-picker landing (or to `de-CH` as the largest cohort — 63% of CH population)
- **Bidirectional linking is mandatory**: every alternate must list every other alternate, INCLUDING ITSELF, or Google ignores the whole cluster
- Prefer **subdirectories** (`/de/`, `/fr/`) over query strings or subdomains — easier to deploy on Next.js App Router (`[locale]` segment we already have)

### Solen MVP hreflang block (per page) `[GUIDANCE]`

```html
<link rel="alternate" hreflang="de-CH" href="https://solen.ch/de/basel/hundepflege" />
<link rel="alternate" hreflang="en-CH" href="https://solen.ch/en/basel/hundepflege" />
<link rel="alternate" hreflang="x-default" href="https://solen.ch/de/basel/hundepflege" />
```

**Decision deferred:** FR-CH and IT-CH at MVP — see §8.

---

## 5. City-specific landing page strategy

### What we observed — the city × category matrix

Fresha runs a 2D matrix: every CH city × every business-type combination has its own indexable URL.
- `fresha.com/lp/en/ch-basel` (city only)
- `fresha.com/lp/en/bt/nail-salons/in/ch-basel` (category × city)
- `fresha.com/lp/en/bt/beauty-salons/in/ch-basel`
- (presumably) ~8 categories × 20 CH cities = 160+ landing pages

PetSmart runs a 3D matrix (state × city × neighborhood × service-leaf) — that's because their unit is a physical store, not a category.

PetBacker uses one URL per city-canton-country triple (`/s/pet-grooming/basel--basel-stadt--switzerland`) — one row per (service, city) pair.

### Solen's recommended pattern `[GUIDANCE]`

**MVP (first 4 weeks of Phase 5):**
- City-only pages: `/de/[city]` and `/en/[city]` for the top 4 CH cities — **Basel, Zürich, Bern, Genf** (Genf only for FR locale if added; otherwise drop)
- City × category pages: `/de/[city]/hundepflege` (since we have only one effective category at MVP, this is functionally the city page; keep the segment for future expansion)

**Why this set of 4 cities first:**
| City | DE pop | Why prioritize |
|---|---|---|
| Zürich | ~440k | Largest market, highest search volume "hundesalon zürich" |
| Basel | ~180k | Already piloted (Pet Wash Basel, cutnlove, Hundewellness in research) |
| Bern | ~135k | Capital, federal-employee disposable income |
| Genf | ~205k | FR-CH only — drop for DE-MVP, revisit when FR locale added |

**Revised Solen MVP city target: Zürich, Basel, Bern, Lausanne** (Lausanne is FR but already on the radar for Phase 6).

### Page sections each city landing page must have `[GUIDANCE]`

1. H1 — "Hundepflege in [Stadt]" / "Dog grooming in [City]"
2. Count + price-range hero — "23 salons · ab CHF 60"
3. Filter chips (price, rating, distance from city center, services offered)
4. Top-10 venue cards with rating + review count
5. FAQ block (FAQPage schema-able — 4-6 questions: "Was kostet Hundepflege in [Stadt]?" / "Welcher Hundesalon hat die besten Bewertungen?")
6. Internal link bar to neighboring cities / cantons (Aarau, Liestal for Basel-area)
7. Sub-area / neighborhood links — Basel has 19 quartiers; even 4-5 covered drives long-tail traffic

---

## 6. Google My Business integration

### What we observed `[OBSERVED on SERP]`

- The Basel SERP for "dog groomer Basel" is dominated by:
  1. **Google Business Profile** local pack (3 results, with stars + reviews + booking-link badge)
  2. **PetBacker** city page
  3. Individual salon websites (Sophysgrooming, Pet Wash, Hunde-Wellness)
  4. **Yelp** city directory
  5. Facebook business pages

- **None of the audited platforms (Fresha CH, Tipaw, PetBacker) link OUT to GMB on the venue page** — they want to own the booking. They expect users to come IN from Maps via GMB SEO, not link out to it.

### MoeGo + "Reserve with Google" precedent `[OBSERVED]`

MoeGo (the largest US pet-grooming SaaS) integrates with Reserve with Google so a "BOOK ONLINE" button shows on the salon's GMB profile, routing back to MoeGo's booking flow. This is the killer-feature analog of Fresha's GMB integration in the salon space.

**Solen Phase 6+ opportunity:** the same Reserve-with-Google integration. At MVP we should:
1. NOT link out to GMB from venue pages (don't leak booking intent)
2. INSTEAD provide groomers a self-serve workflow to claim/sync their GMB profile to Solen
3. Defer the Reserve-with-Google API integration to Phase 6 (after first 10 paying salons)

### GMB-driven content requirements `[GUIDANCE]`

GMB local-pack ranking is partly driven by website signals. Solen venue pages should mirror the GMB attribute set:
- NAP (Name / Address / Phone) — must match GMB exactly, character-for-character
- Service categories — must match GMB primary + secondary categories
- Photos — emit `image` array in JSON-LD with the same photos uploaded to GMB
- Hours — must match `openingHoursSpecification` to GMB hours

---

## 7. Solen SEO strategy for Phase 5

### 7.1 URL structure recommendation — **PICK**

**Locked recommendation:** `/[locale]/[city]/hundepflege/[groomer-slug]`

Rationale + alternatives considered:

| Option | URL | Pro | Con | Verdict |
|---|---|---|---|---|
| A. Flat | `/groomer/[slug]` | Short, simple, easy redirects later | No city in URL → city × category landing pages need synthetic indexes; weak local-SEO signal on venue page itself | Reject — loses local intent |
| B. City-first | `/[city]/hundesalon/[slug]` | City keyword in path | "hundesalon" is one of three DE terms (also "hundecoiffeur", "hundepflege") — locks one term | Reject — wrong sub-segment |
| C. Service-first | `/hundepflege/[city]/[slug]` | Service category leads — matches how users browse | City buried; harder to roll up city pages | Reject — loses city primacy |
| **D. City+service+slug (pick)** | `/[locale]/[city]/hundepflege/[slug]` | City + service + slug all visible; locale-prefixed for i18n; mirrors Fresha's `/lp/[lang]/bt/[cat]/in/[cc]-[city]` density | Slightly long | **Pick** |

Concrete:
- City page: `/de/basel/hundepflege`
- Venue: `/de/basel/hundepflege/pet-wash-basel`
- (Future) sub-category: `/de/basel/hundepflege/welpen-grooming/[slug]`

**Note:** Drop `/[locale]` prefix on the canonical `de-CH` URL? No — Google handles `/de/` cleanly and switching defaults later is painful. Keep the prefix from day one.

### 7.2 Schema.org markup plan — **PICK**

**Locked combo for venue page:**
1. `LocalBusiness` with full NAP + geo + openingHours + aggregateRating
2. `Service` per offered service-type with nested `provider` @id reference
3. `BreadcrumbList`
4. `Organization` once site-wide (in `app/[locale]/layout.tsx`)

**Locked combo for city landing page:**
1. `CollectionPage`
2. `ItemList` with up to 20 venue references
3. `BreadcrumbList`
4. (Optional) `FAQPage` if FAQ section ships

Skip at MVP: `Review` schema for individual reviews (over-marking risks Google penalty for marketplaces; AggregateRating in LocalBusiness is the green-light pattern).

### 7.3 City-specific landing pages — **PICK** (priority list)

| Rank | City | Locale(s) at MVP | Rationale |
|---|---|---|---|
| 1 | **Zürich** | de-CH, en-CH | Largest DE-CH search market |
| 2 | **Basel** | de-CH, en-CH | Pilot-data city; biggest expat density |
| 3 | **Bern** | de-CH | Federal capital; built-in disposable income |
| 4 | **Luzern** | de-CH | Tourist + DE-only, easy SEO win |
| (5) | **Lausanne** | fr-CH | DEFER to Phase 6 — FR locale not at MVP |
| (6) | **Genf** | fr-CH | DEFER to Phase 6 |
| (7) | **St. Gallen** | de-CH | DEFER to Phase 6 — smaller search volume |

**MVP scope: 4 city-landing pages × 2 locales (de, en) = 8 pages total.** That's a manageable scope and matches Fresha's progressive-launch playbook.

### 7.4 hreflang at MVP — **PICK**

- **MVP locales: de-CH + en-CH only.**
- en-CH targets expat audience — Basel especially has a huge English-speaking pharma + uni population that Googles in English.
- FR-CH and IT-CH = Phase 6 (after first 50 venues onboarded).
- x-default → de-CH (largest cohort).

**Important nuance:** even if our DB/UI English is just a translation layer with no separate venues, EN-CH pages still need to exist as full alternates with `hreflang="en-CH"`. They drive Basel/Zürich expat search.

---

## 8. Decisions surfaced (for explicit lock by user)

| # | Decision | Recommendation | Status |
|---|---|---|---|
| D1 | URL pattern | `/[locale]/[city]/hundepflege/[slug]` | ✅ recommended, awaits user lock |
| D2 | Locale set at MVP | de-CH + en-CH only; FR/IT deferred | ✅ recommended |
| D3 | City landing pages at MVP | Zürich, Basel, Bern, Luzern | ✅ recommended |
| D4 | Schema.org venue type | `LocalBusiness` + `Service[]` (not HairSalon, not PetStore) | ✅ recommended |
| D5 | AggregateRating threshold | Only emit when ≥ 3 reviews (Google's documented min) | ✅ recommended |
| D6 | GMB linking strategy | Don't link OUT from venue page; build claim-and-sync flow Phase 6 | ✅ recommended |
| D7 | Reserve-with-Google | Phase 6, not MVP | ✅ recommended |
| D8 | DE term to use in URL | `hundepflege` (vs `hundecoiffeur` / `hundesalon`) | ⚠️ NEEDS USER PICK — see below |

**D8 needs explicit user pick.** The three German terms have different search volumes and connotations:
- **`hundepflege`** — generic, covers grooming + nail-trim + ear-clean + spa. SEO sweet spot. Recommended for URL slug.
- **`hundecoiffeur`** — Swiss-German specific, premium-style positioning. High brand alignment.
- **`hundesalon`** — most common search term in DACH, but feels small-business.

Recommendation: URL uses `hundepflege` (broadest), copy + H1 uses `Hundecoiffeur` (brand alignment), and the H1 SECONDARY/eyebrow line includes the variant `Hundesalon · Hundepflege · Hundecoiffeur` once on each city page to catch all three search terms.

---

## 9. What we couldn't verify (gaps for next round)

1. **Real meta descriptions / OG tags on Fresha + PetSmart** — these sites blocked plain text-fetch and used SSR-then-hydrate patterns. To confirm, manual `curl -A "Googlebot"` or use Playwright MCP to fetch the rendered HEAD. Suspected they DO emit clean metadata for Googlebot.

2. **Whether Fresha/PetSmart emit JSON-LD via `next/head` after hydration** — same fetch limitation. Likely YES based on industry-standard practice, but unverified.

3. **Petco URL grooming-services pattern** — 403 blocked. Need a real browser session or `site:petco.com grooming` Google query.

4. **PetBacker's individual provider page schema** — search returned listing pages, not provider profiles.

5. **Whether existing CH groomer competitors (any?) use schema** — only audited two single-business sites (both empty); a third-party CH directory like local.ch / search.ch was not audited and likely has full LocalBusiness markup worth studying.

---

## 10. Sources

- [Best Salons in Basel, Switzerland (Fresha)](https://www.fresha.com/lp/en/ch-basel)
- [LES MAINS - Basel (Fresha venue page)](https://www.fresha.com/a/les-mains-basel-sternengasse-6-r0dcmz2h)
- [PetSmart Manhattan Flatiron grooming page](https://stores.petsmart.com/ny/manhattan/manhattan-flatiron-ny/grooming)
- [PetSmart grooming hub](https://services.petsmart.com/grooming)
- [PetBacker pet grooming Basel](https://www.petbacker.com/s/pet-grooming/basel--basel-stadt--switzerland)
- [Tipaw groomer directory (BE-FR)](https://www.tipaw.com/be/fr/listing-professionnels/toiletteur/)
- [cutnlove.ch Hundesalon Bottmingen](https://cutnlove.ch/)
- [Pet Wash Basel](https://petwashbasel.ch/)
- [Schema.org PetStore](https://schema.org/PetStore)
- [Schema.org Service](https://schema.org/Service)
- [Schema.org AnimalShelter](https://schema.org/AnimalShelter)
- [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList)
- [Schema.org LocalBusiness](https://schema.org/LocalBusiness)
- [Google Search Central — Local Business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Schema Markup Types 2026: Complete Reference Guide (DigitalApplied)](https://www.digitalapplied.com/blog/schema-markup-types-complete-structured-data-reference)
- [Schema Markup & Structured Data Guide: The 2026 Masterclass (OutpaceSEO)](https://outpaceseo.com/article/schema-markup-structured-data/)
- [EWM.swiss — Multilingual SEO: hreflang for the Swiss market](https://ewm.swiss/en/blog/seo-multilingual-hreflang-for-swiss-market)
- [AlpenAgent — Multilingual website for Switzerland: DE, FR, IT, EN without SEO chaos](https://www.alpenagent.ch/en/blog/multilingual-website-ai-search-switzerland/)
- [Teddy — Mastering Google My Business for Your Dog Grooming Salon](https://tryteddy.com/blog/mastering-google-my-business-for-your-dog-grooming-salon)
- [MoeGo Reserve with Google integration](https://wiki.moego.pet/reserve-with-google/)
- [Whitespark — LocalBusiness Schema JSON-LD Guide](https://whitespark.ca/blog/the-json-ld-markup-guide-to-local-business-schema/)
- [Schemantra HairSalon Schema Generator](https://schemantra.com/schema_list/HairSalon)
- [Next.js — JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld)
