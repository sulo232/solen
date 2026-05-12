# Reviews + Photos UX — Cross-Platform Audit (Phase 0.10)

**Date:** 2026-05-13
**Scope:** How Fresha (salon marketplace), Groomit (mobile dog-grooming marketplace), and Scenthound (US franchise wellness chain) display reviews, ratings breakdowns, photo galleries, before/after archives, owner responses, and trust badges.
**Use:** Spec input for Solen Phase 4 (reviews-and-photos surface for dog-grooming pivot).
**Method:** WebFetch on canonical URLs (homepages, reviews pages, services pages, location templates, franchise marketing pages, Fresha help-center docs) + targeted WebSearch supplements. No Playwright (other agents in flight).
**Evidence convention:** Verbatim quotes in blockquotes. `[inferred, not directly visible]` marks anything not pulled from a fetched page or a search result.

---

## 1. Review card anatomy — field-by-field comparison

| Field | Fresha (homepage carousel) | Groomit (/reviews + homepage) | Scenthound (services + location pages) |
|---|---|---|---|
| **Avatar** | Circular photo, left of name | Circular photo (often empty placeholder `user-photo-empty.jpg`) | Not used on services page; testimonial is text-only with attribution line |
| **Name format** | First name only ("Lucy") | First name + last initial ("Kazi R.", "Sandra D.", "Sylvia") | First name + last initial + location ("Bailey K. \| Scenthound Denville") |
| **Location** | "City, Country" ("London, UK") | "City, State" + service-area | Specific Scenthound franchise location |
| **Date / timestamp** | Not visible | [inferred, not directly visible] — `/reviews` page implies dates but excerpt didn't expose format | Not visible |
| **Star rating** | "5 rating" text label per card (carousel only shows 5★) | 5-star icon + numerical (e.g., "4.78", "4.9") + total count ("30 total Ratings") | Inline ★★★★★ glyphs |
| **Headline / title** | Bold lead line above body text | No separate headline — body text only, truncated at ~125 chars with `[Read More]` | No headline — single block paragraph |
| **Body text** | Short paragraph, 1-2 sentences | Capped ~125 chars in carousel; full text on `/reviews` page | One ~400-character paragraph (Bailey K. on services page) |
| **Service / category tag** | Not visible on homepage carousel | Service type chip + pet name ("Sylvia is always great with our American Eskimo, Luna!") | Implicit via location page context |
| **Pet name attribution** | N/A (human services) | Embedded in review body ("Luna", "Henry", "Louie") — not a separate field | N/A on services page; testimonial frames the dog as the speaker |
| **Photos attached** | Not visible | Not visible in fetched content | Not visible |
| **Verified badge** | None visible | Aggregate "Verified, reviewed, and ready to book" + "Reviews on GroomIt are only submitted by real customers" — no per-card badge in fetched content | None visible |
| **Owner / business response** | None visible on marketplace card | None visible in fetched content | None visible |
| **Helpful / vote count** | None | None | None |

**Verbatim sample quotes:**

> Fresha homepage carousel: "Great experience, easy to book. Paying for treatments is so convenient — no cash or cards needed!" — Lucy, London, UK

> Groomit homepage: "Sylvia is always great with our American Eskimo, Luna! She has a magic touch, that's for sure!"

> Groomit homepage: "Rasul was top notch! He was patient with Henry, who is not a fan of the grooming process."

> Scenthound services page: "I smelled so good and fresh! I noticed my mom loved snuggling up to me every minute when we came back from scenthound! They were so nice to me at Scenthound and Mom said she will take me back every month so I always smell clean and fresh!" — Bailey K. \| Scenthound Denville (★★★★★)

**Pattern reads:**

1. **Fresha:** marketplace carousel is curated 5★-only. Designed as social proof, not exploration. No path to "see all reviews" from the homepage carousel — that lives on the salon detail page.
2. **Groomit:** the per-card field set is the busiest (avatar + name + rating + service type + pet name + truncated body + Read-More). Pet-name-in-body is the single most distinctive pattern — turns a generic review into a story you can map onto your own dog.
3. **Scenthound:** testimonial is voiced AS the dog ("I smelled so good"). Distinctive franchise-marketing trick. Doesn't scale to a real review surface — you can't ask 200 customers to write in dog-voice — but it's a strong hero-testimonial pattern.

---

## 2. Rating breakdown UX

| Element | Fresha | Groomit | Scenthound |
|---|---|---|---|
| **Aggregate score** | Per salon (not on homepage). "More than 480 five-star rated businesses" surfaced at city-level. | **"4.8 Excellent"** big aggregate badge + **"45K+ Reviews"** + **"181K+ Pets groomed"** | "91 overall satisfaction rating" (franchise marketing page only) |
| **5★ / 4★ / 3★ / 2★ / 1★ histogram** | [inferred — likely shown on salon detail page, not in fetched content] | **Yes, explicit on `/reviews`**: 5.0★ 90.01% \| 4.0★ 4.94% \| 3.0★ 1.81% \| 2.0★ 1.20% \| 1.0★ 2.03% | None |
| **Sort options** | Not on homepage; [inferred on salon detail page] | "With Comments / Without Comments" toggle + Reset; sort options referenced but not fully exposed in fetched content | N/A |
| **Filter by service / staff** | [inferred — Service Portfolio feature implies service-tagged surfaces] | Implied via groomer profile pages | N/A |
| **Aggregate-vs-distribution placement** | Aggregate at top of salon profile [inferred] | Aggregate at the top of `/reviews` page, histogram below | Single number only |

**Groomit's histogram is the killer detail.** Showing 90.01% / 4.94% / 1.81% / 1.20% / 2.03% in a percentage breakdown (not just bar lengths) is more transparent than the standard horizontal-bar treatment. It tells the user "we're not hiding the low-star reviews." Worth copying.

**Sort options absent from Fresha homepage but expected on salon detail page** — search results confirm Fresha lets businesses "manage customer reviews made on the Fresha marketplace" but the marketplace-side sort UI wasn't surfaced. Standard Fresha pattern is "Newest first" with no toggle [inferred from marketplace conventions].

---

## 3. Photo gallery patterns

| Pattern | Fresha | Groomit | Scenthound |
|---|---|---|---|
| **Salon / business gallery** | Marketplace image gallery is the salon profile photo set. "Your venue images are typically the first thing clients see on the Fresha marketplace." Service Portfolio is a "living, shoppable gallery" where each image is tagged to a service. | Homepage has groomer headshots only — no photo gallery. Customer photos live on blog. | One hero dog photo per page; no gallery. Trial offer image + service-icon set. |
| **Layout** | [inferred — grid that opens to lightbox / carousel; standard marketplace pattern] | Static groomer-headshot card grid | Hero image, no gallery treatment |
| **Service-tagged photos** | **Service Portfolio** is the killer pattern: "tag each image with the service shown so clients can book the look they love, in just a few taps." Each photo links to a bookable service. | Not implemented | Not implemented |
| **Reviewer-attached photos** | Not visible on homepage / docs; [inferred — Fresha does support review photos via mobile app but not exposed on the surfaces fetched] | Not visible | Not applicable |
| **Lightbox / fullscreen** | [inferred from convention] | [inferred from convention] | N/A |
| **Lazy-load / infinite scroll** | [inferred] | Likely on `/reviews` ("Load More Reviews") — same pattern applies to photos [inferred] | N/A |
| **Mobile treatment** | [inferred — single-column carousel] | [inferred] | Static |

**Photography requirements (Fresha):**

> "Your venue images are typically the first thing clients see on the Fresha marketplace, and they give clients a preview of your salon or venue before they book."

> "Service portfolio is a visual extension of your business, showcasing high-quality images that highlight your work and treatment results."

Specific aspect-ratio / pixel-dimension requirements live in two separate Fresha help articles ("Marketplace venue photography guidelines" + "Service portfolio photography guidelines") that weren't in the fetched content.

**Pattern reads:**

1. **Fresha's Service Portfolio is the most relevant pattern for Solen.** Tag a before/after photo to a specific service ("Deluxe groom — Cavalier King Charles Spaniel"), and the photo becomes a one-tap booking entry. That's the single highest-leverage gallery pattern in the audit.
2. **Groomit treats the gallery as a separate blog property** — not embedded in the booking flow. That's a missed opportunity from a marketplace-UX standpoint but a defensible content-marketing choice (SEO surface).
3. **Scenthound doesn't use a gallery surface at all** — the brand promise is "wellness check" not "transformation," so the photographic case isn't where they spend pixels. They lean on copy + iconography.

---

## 4. Before/after archive treatment

| Aspect | Fresha | Groomit | Scenthound |
|---|---|---|---|
| **Dedicated surface** | Service Portfolio per-salon (not a global B/A gallery) | **`blog.groomit.me/2020/05/26/groomit-before-after/` — a single blog post w/ 10 pairs** | None visible |
| **Layout** | [inferred — grid] | Stacked gallery, 1024×1024 square crops, 10 image pairs | N/A |
| **Slider (drag-to-reveal)** | [inferred — not visible] | No — static pairs | N/A |
| **Side-by-side** | [inferred — yes via tagged photos] | [inferred — yes; URL list suggests separate before / after images displayed in sequence, not overlaid] | N/A |
| **Captions / attribution** | [inferred via service-tag] | "We love to share our work, please check out some of our Before and After photos" — no per-pair pet names or groomer attribution | N/A |
| **Navigation** | [inferred — lightbox / swipe] | Click-through gallery [inferred] | N/A |
| **Pet-name tie-back** | N/A | Absent — anonymous transformation gallery, missed opportunity given how heavily Groomit names pets elsewhere | N/A |

**Web-search evidence on B/A patterns industry-wide:**

> "Before-and-after galleries are the most engaging visual element on any grooming site. Most dog grooming websites built on platforms like Squarespace, WordPress, or Wix share a common structure: a visual homepage with grooming photos, a services page broken down by breed size or coat type, an integrated scheduling system, and a gallery showing before-and-after results."

Common implementation libraries:

- Drag-to-reveal slider widget (CommonNinja, Elfsight, Wix App Market) — single image with a draggable vertical divider, before on left / after on right
- Side-by-side static pairs in a grid
- Stacked vertical (before on top, after on bottom — best for mobile)

**Decision recommendation for Solen:** drag-to-reveal slider for hero pet-by-pet showcases on the salon detail page (the wow moment), side-by-side static for the "see all transformations" archive grid. Mobile fallback is stacked.

---

## 5. Salon / groomer response UX

| Aspect | Fresha | Groomit | Scenthound |
|---|---|---|---|
| **In-line reply visible to public** | None visible on marketplace surfaces. [inferred — Fresha business dashboard lets owners "manage" reviews; whether reply text appears under the review on the marketplace is not exposed in the fetched help-center doc.] | None visible | N/A (no reviews surface) |
| **Threaded vs flat** | [inferred — flat with owner response inline below the original review, indented or labeled "Response from [Salon Name]". This is the conventional marketplace pattern (Yelp, Google, TripAdvisor).] | [inferred — same pattern] | N/A |
| **Separate moderation page** | Fresha business dashboard ("manage customer reviews") | [inferred — Groomit admin / groomer-side dashboard] | N/A |
| **Response prompts / templates** | [inferred — not visible] | [inferred — not visible] | N/A |

**Industry pattern (from marketplace UX research):**

> "Both sellers and buyers should send and get messages within the marketplace app. This feature will improve customer support quality."

> "The three highest-impact trust signals in marketplace UI are verified seller badges, aggregated review scores displayed at the listing level (not just the profile page), and visible dispute resolution policies."

**Pattern read:** owner-response UX is **table stakes** for any marketplace claiming to support both sides of the transaction, but **none of the three audit subjects expose it prominently on the customer-facing surfaces we fetched**. That's not because it doesn't exist — it's because the marketing surfaces hide it. The actual review page on a Fresha salon profile almost certainly shows it [inferred].

**Decision for Solen MVP:** **defer owner-response to v2.** Reasons:
1. Capturing 200+ reviews matters more than 5 owner replies.
2. Forces salon partners into "respond to reviews" workflow before they've onboarded — wrong order.
3. Pet-grooming is more story-driven (before/after photos) and less complaint-driven (vs hairdressing where bad cuts dominate complaints) — owner replies are less critical [inferred from category sentiment].

---

## 6. Trust badges + verified-pro signals

| Trust signal | Fresha | Groomit | Scenthound |
|---|---|---|---|
| **Aggregate review count** | "957,853 reviews across 2,347 venues in London" (city-level) | "**45K+ Reviews**" + "**181K+ Pets groomed**" (homepage hero) | None visible on customer site; "91 overall satisfaction rating" on franchise site |
| **Aggregate star rating** | "Average rating of 4 stars across nearby businesses" (city-level), "more than 480 five-star rated businesses" | "**4.8 Excellent**" headline badge | None |
| **Verified reviewer** | None visible | "Reviews on GroomIt are only submitted by real customers" — all reviews tied to **completed bookings** | N/A |
| **Background check** | N/A (salon profile is the business, not staff) | **"Every professional completes identity and criminal background checks"** | Implicit (franchise standard) |
| **Insurance** | [inferred — covered at the platform level] | **"Every Groomit service is covered by platform-level insurance"** | Implicit |
| **Certification / training** | None visible | "Verified, reviewed, and ready to book" + groomer experience years on card | Vet endorsement: Dr. Jim MacLean, DVM |
| **Membership / association** | None | None | International Franchise Association logo, "Award-Winning Pet Franchise" |
| **Award / press** | None visible on homepage | None visible on homepage | "Award-Winning Pet Franchise" (no specific awards named on the surface fetched) |
| **Years in business / staff tenure** | None visible | **"Texas • 14+ yrs experience"** on individual groomer cards | None |
| **Money-back guarantee** | None visible | [inferred — "100% Satisfaction Guarantee" common to Groomit per industry knowledge] | Trial offer present |

**Placement comparison:**

- **Fresha:** trust = aggregate metrics at the city / category level. No business-card-level verified badge.
- **Groomit:** trust = **stacked on the homepage hero** ("America's Most Reviewed", "4.8 Excellent", "45K+ Reviews", "181K+ Pets groomed") + per-card years-of-experience + platform-level promises in a dedicated trust strip.
- **Scenthound:** trust = clinical / vet endorsement + franchise-standard implication.

**Pattern read:** Groomit wins on trust-badge density and is the right model for Solen. Specifically:

1. **Hero stat band** — pets groomed + reviews + aggregate rating, all on the front door
2. **Per-pro badges on cards** — experience years + service-type + availability
3. **Platform promise strip** — insurance + background check + verified bookings — these are universal-truth claims that don't need per-pro variance
4. **A dedicated "trust" section in the salon profile** [inferred best practice] with the same three pillars

---

## 7. Solen reviews-section spec for Phase 4

Working name: **"Wagging tails"** section. Drop-in for `app/[locale]/salon/[slug]/page.tsx`.

### 7.1 Salon detail page — reviews block anatomy

**Layout (mobile-first, V3 cream substrate):**

```
[Section eyebrow + heading]
  Eyebrow: "Customer Reviews"  (emerald, micro-caps)
  H2: "Loved by 247 dogs in Zurich"  (Peace Sans display)

[Rating summary card] — full-width on mobile, side-by-side w/ histogram on tablet+
  ┌─────────────────────────────────────────────┐
  │  4.9  ★★★★★    Excellent                    │
  │  Based on 247 reviews                       │
  │  ─────────────────────────────────────────  │
  │  5★ ████████████████████████ 92%            │
  │  4★ ████ 5%                                 │
  │  3★ █ 1%                                    │
  │  2★ █ 1%                                    │
  │  1★ █ 1%                                    │
  └─────────────────────────────────────────────┘

[Trust strip] — emerald icon row, single line on desktop, 2-row stack on mobile
  [check] All reviews verified from completed bookings
  [shield] Salon insured + groomers background-checked
  [paw] 1,432 dogs groomed at this salon

[Sort + filter row]
  [Sort: Newest ▼]    [☐ With photos]    [☐ With owner response]
  No service-tag filter for MVP — defer

[Review cards] — 5 visible, "Load more" button
  Each card:
  ┌────────────────────────────────────────────────────────┐
  │ [pet-avatar 40×40]  Marco F.   ★★★★★    3 days ago    │
  │                     w/ Luna (Border Collie, 4 yrs)     │
  │                                                        │
  │ "Mira gave Luna the best summer cut. She was patient   │
  │  with the brushing because Luna hates having her tail  │
  │  done. Came back smelling great and looking fresh."    │
  │                                                        │
  │ [photo 1] [photo 2] [photo 3]  ← thumbs, opens lightbox│
  │                                                        │
  │ ┌──Response from Salon Coiffeur Zürich────────────────┐│
  │ │ Thanks Marco! Luna was an angel. See you in 6 weeks.││
  │ │ — Mira, 2 days ago                                  ││
  │ └─────────────────────────────────────────────────────┘│
  │                                                        │
  │ Service: Deluxe Wash + Cut (95 CHF)                    │
  └────────────────────────────────────────────────────────┘

[See all reviews link / modal] — opens dedicated /salon/[slug]/reviews
```

### 7.2 Field set per review card (locked)

| Field | Display | Source |
|---|---|---|
| **Avatar** | 40×40 circular — owner's pet photo if uploaded, else first letter on emerald-pale chip | Booking + pet profile |
| **Reviewer name** | First name + last initial ("Marco F.") | Account |
| **Pet attribution** | "w/ [Pet name] ([Breed], [Age])" — **pet-as-attribution is the killer pet-specific tweak** | Booking |
| **Star rating** | ★★★★★ glyphs, emerald-fill, half-star supported | Review |
| **Date** | Relative ("3 days ago") for <30d, absolute ("Mar 14") older | Review |
| **Body** | Up to 280 chars, "Read more" expands inline | Review |
| **Photos** | Up to 4 thumbs in row, opens lightbox on tap, lightbox has swipe + counter | Review |
| **Service tag** | "Service: [name] ([price])" at card bottom | Booking link |
| **Owner response** | Indented, emerald-subtle bg, "Response from [Salon Name]" header, "— [Staff name], [date]" footer. **v2 — defer for MVP.** | Salon dashboard |
| **Helpful vote / report** | NOT IN MVP | — |

### 7.3 Rating breakdown card

- Aggregate score in display type (Peace Sans 64px)
- Star glyphs at 24px
- "Excellent" / "Very Good" / "Good" / "Mixed" verbal qualifier next to score (Booking.com pattern)
- Total count: "Based on 247 reviews"
- 5-bar histogram with **percentage labels**, not just bars (Groomit pattern — most transparent)
- Bars: emerald-pale fill, emerald label, cream gap

### 7.4 Photo gallery — salon-level

| Surface | Layout | Behavior |
|---|---|---|
| **Salon hero gallery** | 1 large + 4 thumbs (Airbnb pattern), or full-bleed carousel on mobile | Tap → fullscreen lightbox, swipe, counter, close-X |
| **Before/after archive (dedicated)** | Grid of drag-to-reveal sliders, 1-up mobile / 2-up tablet / 3-up desktop | Each pair has pet name + breed + service caption. Tap → lightbox with same slider mechanic at large size. |
| **Reviewer-attached photos** | Inline thumbs in review card (max 4 visible, "+N more" if over) | Tap → same lightbox as salon hero, but with review attribution shown in lightbox caption |
| **Service-tagged portfolio** | Filter chip row on top (Wash / Cut / Stripping / Cat groom / Puppy first-cut) + masonry grid | Each photo links to the bookable service (Fresha Service Portfolio pattern) |

**Image specs:** 4:3 aspect ratio for portfolio (mobile-friendly), 1:1 for before/after pairs (Groomit pattern), full-bleed 16:9 hero with safe-area crop.

### 7.5 Trust badges

Three-tier hierarchy:

1. **Platform-promise strip** (universal, same on every salon):
   - "All reviews from completed bookings"
   - "Salons insured via Solen platform"
   - "Background-checked staff"
   
2. **Salon-level stats** (varies per salon):
   - "1,432 dogs groomed here"
   - "Member since 2023"
   - "Avg. response time: 2 hours"

3. **Per-review badges**:
   - "Verified booking" — small emerald check next to date
   - "Photo upload" — small camera icon if review has photos
   - **No per-review owner-response badge needed in MVP** (response appears inline)

### 7.6 Card visual treatment (Solen V3 LIVE_TRUTH alignment)

- **Card bg:** white on cream substrate, 1px terracotta-faded border (per V2-D49j locked color rule)
- **Border radius:** 16px (matches salon cards)
- **Avatar:** circular, emerald-pale ring when verified
- **Star glyphs:** emerald (`#1F5C42`), NOT terracotta (color rule: emerald = action affordance, stars are positive signal = emerald) — but flag this with user since star-rating-as-gold is the universal convention. Recommendation: emerald to stay on-brand, but **state the option**.
- **Owner response bg:** `s-bg-subtle` cream-tint, indented 16px from left
- **Photos:** 1px white border, 8px rounded corners

---

## 8. Decisions surfaced (for user sign-off)

| # | Decision | Recommendation | Alternative | Why |
|---|---|---|---|---|
| 1 | **Sort options for MVP** | "Newest first" + "Highest rated" only. Defer "with photos" filter to v1.1. | Add "with photos" toggle from day 1 (Groomit pattern). | Most users sort by newest anyway. Filter chips bloat the UI for a feature that's only valuable once you have >100 reviews per salon. |
| 2 | **Star color: emerald vs gold** | **Emerald** — keeps the locked V3 brand discipline. Stars are positive signal, emerald is the positive-signal color. | Gold/amber for stars only (universal-convention exception, like heart-red). | LIVE_TRUTH §5h locks emerald as the only action-affordance color. Stars are arguably an action signal (filter by). But gold-stars is so canonical that violating it might cost trust. **Flag to user — this is a taste call, not a logic call.** |
| 3 | **Owner response in MVP** | **Defer to v2.** | Ship from day 1. | Salons need to be onboarded into the "respond to reviews" workflow. Capturing reviews matters more for v1. |
| 4 | **Lightbox vs in-page photo expand** | **Lightbox.** Reviewer-photos open in fullscreen modal with swipe + counter + close. | Inline expand (photo grows in-card, pushing layout). | Lightbox is the universal pattern; inline expand breaks the card list layout on mobile. |
| 5 | **Before/after pattern** | **Drag-to-reveal slider** on salon detail (hero feature) + side-by-side static grid on dedicated archive page. | All drag-sliders (Elfsight pattern) | Slider is the wow moment, but a page of 30 sliders is overwhelming and slow. Hybrid wins. |
| 6 | **Pet attribution placement** | **Under reviewer name** ("Marco F. w/ Luna (Border Collie, 4 yrs)") | In review body only (Groomit pattern) | Solen has explicit pet profiles tied to bookings — surface them as a metadata field, not as in-body text. Differentiator vs Groomit. |
| 7 | **Verified-badge threshold** | **All reviews verified by default.** Reviews only submitted by accounts with completed bookings — same as Groomit. No "verified" badge needed if 100% are verified; instead a single platform-promise strip says "All reviews from completed bookings." | Allow non-verified reviews + show badge on verified ones. | Lower trust noise. If a user has to scan each card for a verified badge, that means SOME aren't verified — implying noise. Better to make it a platform-level guarantee. |
| 8 | **Histogram: percentages vs bars-only** | **Percentages displayed next to bars** (Groomit pattern) | Bars only (Airbnb / Yelp / Fresha pattern) | Groomit's transparency is unusual and signals honesty. Pet owners are anxious — surface the numbers. |
| 9 | **Dedicated reviews page or modal only** | **Both.** Inline 5 reviews on salon detail page + "See all 247" CTA → dedicated `/salon/[slug]/reviews` route (full sort + filter). | Modal-only (faster, single SPA-style flow) | Dedicated route = better SEO + shareable + handles "long-tail" review browsing without modal-fatigue. |
| 10 | **Pet photo as avatar (not human photo)** | **Pet photo first; human-name initial fallback.** | Human photo (Groomit pattern). | Pet-photo-as-avatar is the single most distinctive Solen tweak. Pet owners identify with their dog, not themselves, on a pet-services site. Tiny detail, huge brand voice. |

---

## 9. Quick-reference: what to copy from each platform

| Pattern | Source | Why copy |
|---|---|---|
| **5★/4★/3★/2★/1★ histogram with explicit percentages** | Groomit `/reviews` | Highest-transparency rating breakdown in the audit |
| **Pet-name-in-review attribution** | Groomit | Story-grade signal, makes reviews feel less generic |
| **Hero stat band (X pets groomed, Y reviews, Z aggregate rating)** | Groomit homepage | Stacked trust on first paint |
| **Service-tagged photos (gallery → booking)** | Fresha Service Portfolio | One-tap from inspiration to booking — biggest gallery leverage |
| **Drag-to-reveal before/after slider** | Industry standard (Elfsight et al.) | Highest engagement visual on grooming sites |
| **Owner response visible to public** | Standard marketplace (defer to v2) | Trust signal; not MVP |
| **Verbal qualifier next to score ("Excellent")** | Booking.com (industry) | Makes the number land emotionally |
| **Background-check + insurance promise strip** | Groomit | Pet-specific anxiety reducer — must-have |

## 10. What to NOT copy

| Anti-pattern | Source | Why skip |
|---|---|---|
| **Curated 5★-only carousel as primary review surface** | Fresha homepage | Reads as marketing not as honest review system |
| **Reviews-in-the-voice-of-the-dog** | Scenthound | Doesn't scale; one charming testimonial → 200 robotic copies |
| **B/A gallery as separate blog (disconnected from booking)** | Groomit blog | SEO win but conversion loss |
| **Empty-placeholder avatar with first-name only** | Groomit `/reviews` | Looks low-effort; pet-avatar fallback is better |
| **Hidden moderation / no response UX visible** | Fresha + Groomit | Defer for MVP but plan for v2 — pet-grooming complaints are real |

---

## Sources

- [Fresha homepage](https://www.fresha.com/)
- [Groomit homepage](https://www.groomit.me/)
- [Groomit reviews page](https://www.groomit.me/reviews)
- [Groomit before/after blog](https://blog.groomit.me/2020/05/26/groomit-before-after/)
- [Groomit choose-groomer help article](https://www.groomit.me/help/article/groomers/i-am-booking-an-appointment-for-the-first-time-can-i-pick-my-pet-groomer)
- [Scenthound homepage](https://scenthound.com/)
- [Scenthound services page](https://www.scenthound.com/grooming-services)
- [Scenthound Plantation location page](https://www.scenthound.com/plantation)
- [Scenthound franchising site](https://scenthoundfranchising.com/)
- [Fresha marketplace image gallery help](https://www.fresha.com/help-center/knowledge-base/online-profile/100667-marketplace-image-gallery-overview)
- [Fresha London city page (marketplace volumes)](https://www.fresha.com/lp/en/gb-london)
- [UXPin review card design guide](https://www.uxpin.com/studio/blog/review-card/)
- [Excited.agency marketplace UX best practices](https://excited.agency/blog/marketplace-ux-design)
- [Rigby marketplace UX feature-by-feature guide](https://www.rigbyjs.com/blog/marketplace-ux)
- [Muffin Group dog-grooming website inspiration](https://muffingroup.com/blog/dog-grooming-websites/)
- [Elfsight before/after slider examples](https://elfsight.com/before-and-after-slider-widget/)
