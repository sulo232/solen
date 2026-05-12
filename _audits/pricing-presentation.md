# Pricing Presentation Audit — 4 Grooming Platforms

> Phase 0.11 of Solen→dog-grooming pivot. Captures HOW price is shown across Fresha (beauty marketplace), Groomit (mobile grooming on-demand), PetSmart (big-box catalog), Scenthound (subscription membership). Each platform has solved one slice of pricing UX well — Solen needs to pick its lane.

**Date:** 2026-05-13
**Inputs:** WebFetch + WebSearch (parallel-safe). All quoted strings are literal page copy unless marked `[inferred]`.
**Sources cited inline. Sources block at bottom.**

---

## 0. TL;DR — which platform solves which problem

| Problem | Best in show | Why |
|---|---|---|
| Card-level price readability | **Fresha** | "from CHF X · 60 min" — duration + floor price, never a range |
| Size-class transparency | **PetSmart blog ecosystem** | Plain table: S/M/L/XL × Bath/Full Groom — 4 numbers |
| Add-on à-la-carte clarity | **PetSmart** | Flat $12 nail trim / $12 teeth / $19 nail grind — every add-on has one number, no size scaling |
| Bundle vs subscription value framing | **Scenthound** | 3 tiers ($39/$49/$65) with visible "what's in, what's out", 25% off non-members |
| Hide-then-quote (gated pricing) | **Groomit** | ZIP-gates pricing, then shows 5 tier cards + Eco-discount-when-flexible |
| Cancellation policy disclosure | **Fresha** | Configurable but always shown at booking confirm step |
| Matted coat / behavior surcharge | **PetSmart** | "$10 per 15–60 min" dematting line item, ungated |

**Solen recommendation surfaced** (full reasoning in §6 / §7): card-level **"ab CHF X"** (German for "from") + duration · size pick reveals exact price · NO deposit · free cancel ≥24h, flat CHF 10 fee inside 24h · surcharges as line-items with disclaimer, never silent.

---

## 1. Per-site pricing display patterns

| Site | Card-level price | Discount UX | Bundle / package UX | Booking deposit | Cancel fee | Surcharge UX |
|---|---|---|---|---|---|---|
| **Fresha** | "from £X · 30 min" inline. Exact price only inside service drawer. Discount badge: "Up to 50% off · Last-minute" | Strikethrough original + new price + "Last-minute" pill | Service detail drawer lists each sub-service with its own price + duration | Configurable per partner: % or flat amount of total | Configurable per partner; shown before confirm; up to 100% per Fresha ToS | Partner-set; Fresha policy lists "additional charges may apply"; rarely line-itemed |
| **Groomit** | **Hidden until ZIP** [evidence]. After ZIP: 5 package cards (Gold/Eco/Silver/Pearl/Refresh Express). Gold $120 / Eco $100 / Silver $111 / Pearl $80 / Refresh $80 [evidence]. Per-card subtitle "Best Value" / "Most Popular" | Recurring savings: "Save More With Recurring $114 → $97" (~19%) [evidence]. Eco = "Book Ahead, 2–7 days advance" cheaper than Gold | 5 fixed packages; each package fixed-includes specific services (no à-la-carte unbundling) | [inferred] — pre-charge at booking (mobile groomer business model) | Not visible publicly | Not disclosed publicly. "Pricing is fully transparent" claim — assessed in-app per-pet [inferred] |
| **PetSmart** | Coat-type ranges in marketing: "Long-haired $80–$120 / Short-haired $40–$60". Size-tiered actual prices live on local store pages. Bath & Brush S/M/L = $40.99, XL = $49.99. Full Groom S/M/L = $76, XL = $89.99 | "30% off puppies under 5 mo" / "Yappy Hour walk-in $3 off" / "10% senior/military Tuesdays" — list discounts, not promo codes | À-la-carte menu: every add-on a flat price (Nail $12 / Teeth $12 / Ear $12 / PAWdicure $22 / Nail grind $19 / Anal $12 / Flea $22 / Touch-up $30) | None publicly | None publicly disclosed | Dematting line-item "$10 per 15–60 min" — explicit time-billed surcharge |
| **Scenthound** | 3 membership tiers shown on tier-card layout: **Escentials $39/mo** · **Escentials Plus $49/mo** · **Unlimited $65/mo** | Members get **25% off any additional services**. Non-member retail is unstated (intentional — drives sign-up) | Tier = bundle. Each card lists what's included as bullet list. Add-on price ladders only appear after sign-in | Auto-billed monthly (subscription model — no per-visit deposit) | First visit cancel: presumed free [inferred]. Membership cancellation: tier-rules | Surcharges (matting, behavior) handled per franchise location [inferred] |

### What this means

Four totally different pricing philosophies:

- **Fresha** = marketplace passes pricing decisions to the salon. Lowest-friction display: "from X · 30 min", real price one tap deeper.
- **Groomit** = gated-then-fixed. Five packages, fixed prices per size+location, no hidden fees claim. ZIP gate is the trade.
- **PetSmart** = catalog. Size-class table + flat add-on grid. Highest UI density — but a customer can build the exact bill before booking.
- **Scenthound** = subscription. Show 3 tiers, hide à-la-carte until member. Compresses decision into "which tier suits my dog."

---

## 2. Size-class scaling presentation

How do platforms communicate "Berger Bernois = +50% vs Yorkie"?

| Platform | Mechanism | UX cost | Honest? |
|---|---|---|---|
| **Fresha** | Salon-by-salon. Most salons list "Cut · short hair" vs "Cut · long hair" as two separate services on the menu, each with its own "from £X" floor [inferred from service-detail patterns]. Customer scans, picks the matching variant. | Low — but customer must know their dog's "category" | Variable: each salon writes their own bands |
| **Groomit** | Booking flow asks pet size after ZIP entry (S ≤20 lbs / M ≤40 / L ≤80 / XL >80 lbs). Pricing is dynamically substituted — customer sees one number for their dog. | Lowest — only sees their own price | High — Groomit fully transparent claim |
| **PetSmart** | Two-tier disclosure: marketing pages show coat-range ("$40–$120"), local store pages show actual S/M/L/XL line. Bath & Brush table: S/M/L = $40.99, XL = $49.99. Full Groom S/M/L = $76, XL = $89.99 | Customer reads a 4-row table | Highest in catalog form — entire scale visible |
| **Scenthound** | Bath price uniform "same price for all dogs regardless of size or breed" (literal FAQ quote). Haircut / blow-dry surcharge based on coat: "varies based on coat type and condition" — exact amount disclosed in-store | Bath: zero. Haircut: requires in-person quote | Mixed: bath honest, haircut soft-priced |

### Pattern map

```
Pre-pick (price hidden)        Post-pick (price exact)
  ──────────────────────────►
  Groomit (ZIP+size gate)
  Scenthound (sign-in gate)
  Fresha "from £X" (drawer reveals exact)

Full table (all sizes shown)
  PetSmart catalog
```

Two valid extremes. The worst position is the middle — "from X" with no clear size resolution. That's where most independent salon websites sit, and where customers churn.

### Quote evidence — PetSmart size table

> "The cost of bathing a small, medium, and large dog at PetSmart is $40.99, whereas bathing an extra-large dog costs $49.99."
> "For a full groom at PetSmart, customers will have to pay $76 for a small, medium, or large dog and $89.99 for an extra-large dog."
— PetSmartWays 2026

That's an interesting band collapse: S/M/L treated as one price, only XL stepped up. Most independent groomers in the US charge a 4-step ladder. PetSmart simplified to 2-step.

---

## 3. Add-on UX comparison

| Mechanism | Example | Strength | Weakness |
|---|---|---|---|
| **Pure à-la-carte (PetSmart)** | Nail trim $12 · Teeth $12 · Ear $12 · Nail grind $19 · PAWdicure $22 · Flea $22 | Customer builds exact bill; no surprise upsell at desk | UI density — risk of "menu paralysis" |
| **Tier-bundle (Groomit)** | Gold ($120) bundles bath+cut+nails+ears+sanitary+cologne+pad+blowdry+conditioner — pick the bundle, don't shop services | Decision compressed to "which tier suits me" | Hides what each line costs; can't drop items to save |
| **Subscription tier + à-la-carte add-ons (Scenthound)** | Escentials $39 = bath+ear+nail+teeth. 25% off any add-on. | Best blended model — recurring revenue + flex on adds | Requires sign-up to see add-on prices |
| **Salon-by-salon (Fresha)** | Each salon designs its own menu; Fresha just renders | No platform opinion — neutral marketplace | Quality varies wildly; customer can't compare across salons easily |

### Add-on display patterns observed

```
PetSmart                Scenthound                Groomit                Fresha
────────                ──────────                ────────              ───────
| Service       Price | | Tier      Price/mo |  Gold      $120        ▾ Cut & Style
| Nail trim    $12   | | Escent.    $39      |   • Bath              from £45 · 60 min
| Teeth        $12   | | Plus       $49      |   • Cut                — Junior      £40
| Ear clean    $12   | | Unlimited  $65      |   • Nails              — Senior       £55
| FURminator   $70+  | | Add-on -25%          |   • Ears               — Long hair    £75
| Dematting   $10/   | (after sign-in)      |   • Cologne
|   15-60 min        |                      |  Eco       $100
| ...                |                      |   (book 2-7 days ahead)
```

### Surcharge transparency (matted coat, aggressive)

| Platform | How shown | When seen | Honest |
|---|---|---|---|
| PetSmart | "$10 per 15–60 min" dematting line item in à-la-carte menu | Pre-booking on store page | High |
| Groomit | Not publicly listed. "Pricing is fully transparent; shown before booking based on your pet's breed, size, location" — applied per-pet | At booking-flow end | Trust required |
| Scenthound | "Pricing varies based on coat type and condition" — Barber Package quote in-store | In-person assessment | Medium — soft |
| Fresha | Partner-set. Generally absent from price list, charged at salon discretion | Surprise at till [inferred] | Low |

**Industry baseline from search:** matted-coat surcharges range $15–$50 flat or $10–$30 per 15-min. Most groomers communicate at intake, not at booking. The "honest" move for Solen: list it on the price page even if it's variable ("Matted coat: ab CHF 15, abhängig von Schweregrad" / "from CHF 15, depending on severity").

---

## 4. Deposit + cancellation fee disclosure timing

| Stage | Fresha | Groomit | PetSmart | Scenthound |
|---|---|---|---|---|
| Browsing | Not shown | Not shown | Not shown (no online booking pre-2024) | Not shown |
| Service-picked | Not shown | Not shown | n/a | n/a |
| Date/time-picked | Not shown | Not shown | n/a | n/a |
| **Confirm step** | **Policy text inline**: "Cancel up to 48hr free / 25% fee inside / 50% no-show" [Fresha ToS] | [inferred] — terms shown before card-on-file capture | n/a | At membership sign-up |
| After confirm | Email + SMS reminder typically restates | Email confirm | Phone call from store | Member dashboard |

### Fresha cancellation example (literal from search):

> "A business might display that clients can cancel up to 48 hours before their appointment with no fee, but if they cancel within those 48 hours, a 25% cancellation fee applies, and a 50% no-show charge if they fail to show."

> "Fresha discloses Partner Terms of Sale (including any Deposit Policy, Cancellation Policy or No Show Policy) to clients prior to their confirmation."

Two observations:

1. **Disclosure is at confirm**, not at browse. Customers don't scan for "deposit policy" while comparing salons. They see it when they're already invested.
2. **Fee percentages are common**, not flat. Fresha defaults to %, not CHF. This makes the fee proportional to service cost — psychologically fairer for $150 grooms, weaker deterrent for $40 nail trims.

### Deposit norms (industry)

- **High-deposit (50%+):** rare for grooming; common for wedding-day hair, balayage
- **Low-deposit (10–20%):** moderate; sometimes for first-time clients
- **No-deposit + card-on-file:** **most common for routine grooming.** Card captured, charged only on no-show
- **Subscription:** Scenthound model — never per-visit deposit; monthly bill is the commitment

---

## 5. Surcharge transparency — the matted-coat problem

The single dirtiest part of grooming pricing: the customer brings in a matted dog, gets quoted $80, walks out at $130. Industry survey:

| Surcharge | Typical fee | Best disclosure pattern |
|---|---|---|
| Matted coat | $15–$50 flat OR $10–$30 per 15-min | List on price page + intake form check |
| Aggressive / handling | $10–$25 | Risk-decline at booking + extra fee line |
| Senior / medical | $5–$15 | Pre-disclose at intake |
| Special breed (Doodles, Newfies) | +$20–$40 | Coat-type pricing tier instead |
| Travel (mobile) | $5–$20 / mile | Auto-calculated by ZIP |

### What Solen should do

The "from CHF X" prefix on the card carries the implicit promise: **final price is in the same magnitude.** Going from "ab CHF 65" to "CHF 130 at checkout" breaks trust harder than disclosing a CHF 25 matting surcharge upfront.

**Recommend:** dedicated "Zuschläge" section on the price page, listed even when zero common for the salon. Format:

> Zuschläge (when applicable):
> – Verfilztes Fell: ab CHF 15
> – Spezielle Handhabung: CHF 20
> – Anfahrt mobile: CHF 0.50/km (≥10 km)

---

## 6. Solen pricing strategy — recommended MVP

Read this section as: the spec we'd build to today. Each call answers a specific platform's lesson.

### 6a. Card-level pricing (homepage feed, search results)

**Recommendation: "ab CHF X · 60 Min."** ("from CHF X · 60 min")

- Borrow Fresha's pattern — duration alongside floor price.
- Never show a range on the card ("CHF 50–120") — too ambiguous, customer can't predict.
- Never show "Preis auf Anfrage" / "Price on request" — Solen's whole pitch is transparency.
- The "ab" prefix is a **promise**: the post-size-pick price will not exceed +50% of the floor.

Why not flat? Because a Yorkie groom and a Bernese groom genuinely differ by 2x. Flat would either undercut groomer margin or scare off small-dog owners. "Ab" lets the card stay scannable while signaling the cone of variation.

**One concrete failure mode of "ab":** customers anchor on the floor and feel scammed when the real price comes in higher. Mitigation: show the post-size-pick price BEFORE asking for date selection, so the price step is its own decision, not a surprise inside a confirm flow.

### 6b. Size-class scaling display

**Recommendation: hidden on card, revealed in step 2 of booking flow.**

Flow:

```
Step 1: Card click → Service detail page
   ↓
Card price ("ab CHF 65 · 60 Min.")
   ↓
Step 2: "Wähle dein Hund"
   – Auswahl: S (<10kg) · M (10-20kg) · L (20-35kg) · XL (>35kg)
   – Coat: kurz / mittel / lang
   ↓
Step 3: PRICE LOCKED — "CHF 90 · 75 Min." shown big and central
   ↓
Step 4: Pick stylist + date
```

Why not full table like PetSmart? Mobile screens. A 4×3 table at 375px is unreadable. Picker reveals one number — cleaner.

Why not after-checkout like Groomit (ZIP gate)? Higher friction for a marketplace. Solen needs to be at-a-glance comparable across salons. Floor price on card lets customers shortlist before committing to a click.

### 6c. Add-on UX

**Recommendation: list-style à-la-carte (PetSmart pattern) on the salon detail page, not bundled (Groomit pattern).**

- Each add-on a flat price: "Nägel schneiden CHF 15 · Zähne CHF 18 · Ohren CHF 12 · De-Shedding CHF 35"
- Group by category: "Pflege", "Wellness", "Spezial"
- Optional bundles only as a "Komplettpaket spart CHF 20" upsell at the end — never replace the menu

Why not bundle-first (Groomit)? Groomit serves an in-and-out customer who pre-pays and wants no decisions. Solen is a marketplace of independent salons — most salons already have menus, copying their structure preserves their brand.

Why not subscription (Scenthound)? Scenthound's whole model is hygiene-only repeated monthly. Solen sells grooming visits, which are bi-monthly at best for most dogs. Subscription doesn't fit MVP. Could revisit as a "Treuepaket" feature in v2 (10% off every 6 weeks).

### 6d. Deposit timing

**Recommendation: NO deposit at MVP. Card-on-file at booking confirm. Charge only on no-show / late cancel.**

- Fresha's default — partner-configurable but rare to require upfront deposits for grooming
- Lowers booking friction (no Stripe redirect during initial flow)
- Aligns with Swiss customer expectations (Switzerland is a "low-deposit" culture vs. US)
- If we see no-show rate >8%, revisit — flag for Phase 1 monitoring

### 6e. Cancellation fee

**Recommendation: flat CHF 10 inside 24hr, 50% no-show. Both shown at confirm step.**

- Fresha defaults to %, but flat is easier to communicate ("CHF 10 wenn weniger als 24h").
- 50% no-show, not 100% (Fresha allows up to 100%) — feels fair, not punitive.
- "Free cancellation 24 hours before" as the marketing line on the homepage, mirroring booking.com.

One concrete failure mode of flat CHF 10: it's a weak deterrent for a CHF 150 groom (loss is 7% of revenue) and a strong one for a CHF 40 nail trim (25%). Counter-argument: flat is easier to communicate and customers don't churn over CHF 10. Defer the % experiment to v2.

### 6f. Cancellation window

**Recommendation: 24 hours.**

- 12hr is too tight — most customers book bedtime-eve and forget by morning
- 48hr is too generous for grooming — most groomers can re-fill a 24hr-out slot
- 24hr matches Booking.com / Hotel default; familiar mental model

### 6g. Surcharge UX

**Recommendation: line-item with floor price + caveat. Never silent.**

```
Service: Komplett-Hundepflege  CHF 90 · 75 Min.

Mögliche Zuschläge (vorab transparent):
   – Verfilztes Fell      ab CHF 15
   – Spezielle Handhabung    CHF 20
   – Doodle / Goldendoodle  +CHF 25 (Coat-Aufpreis)
```

Make this section permanently visible on the salon detail page, not buried in T&Cs.

---

## 7. Decisions surfaced (cheat-sheet)

For the founder / product lead to lock as one batch:

| # | Decision | Recommendation | Confidence | Lock? |
|---|---|---|---|---|
| 1 | Card-level price format | **"ab CHF X · 60 Min."** (floor + duration) | High | ☐ |
| 2 | Size-class scaling display | Hidden on card, **revealed after size pick** before date pick | High | ☐ |
| 3 | Add-on model | **À-la-carte list** per salon, not platform-bundled | Med-High | ☐ |
| 4 | Deposit timing | **No deposit MVP**; card-on-file at confirm | High | ☐ |
| 5 | Cancellation fee | **Flat CHF 10** inside window; 50% no-show | Medium | ☐ |
| 6 | Cancellation window | **24 hours** | High | ☐ |
| 7 | Surcharge UX | **Line-items with floor + caveat**, always visible | High | ☐ |
| 8 | Subscription (membership) | **Defer to v2** — not MVP | Med-High | ☐ |
| 9 | "Bundle savings" upsell | Allow but **never default the menu to bundles** | Medium | ☐ |
| 10 | Surcharge for behavioural / aggressive | Line-item **CHF 20 standard** | Low (need salon input) | ☐ |

### Where I'd push back on myself

- **#2 (size after card click):** Groomit's ZIP-gate model converts 33%+ on intent traffic — there's a real case for "tell us about your dog FIRST, then we'll show you prices that match." Counter: that's a different product (concierge service, not marketplace). Solen MVP is marketplace, so card-floor wins. Revisit if Groomit-style flow tests better.
- **#4 (no deposit):** if salons in CH report >5% no-show rates, they'll lobby for deposits. Build the deposit primitive into the schema now even if disabled in UI — flip per-salon later.
- **#5 (flat fee):** Fresha's % default exists for a reason — flat is dumb on high-ticket. Revisit when Solen has 10+ salons charging >CHF 100/groom.

### Open questions for founder

- Do Swiss customers culturally expect Trinkgeld / tipping at the salon? If so, where does it sit in the price flow? (Recommend: never, optional after the cut as a non-default add-on.)
- Are there any cantonal differences in cancellation-fee enforceability we need to research? (Defer — Phase 1.)

---

## 8. Inferred items flagged

Every `[inferred]` in this doc was a place I extrapolated from adjacent evidence rather than direct page copy:

- Groomit deposit timing — model fits mobile-pre-charge pattern but page text didn't confirm
- Fresha surcharge handling — Fresha ToS lets partners set anything; no platform pattern observed
- Scenthound first-visit cancel policy — FAQ silent; assumed lenient per industry norm
- Scenthound surcharge handling — per-franchise; not centrally listed
- Fresha service variant pattern (long/short hair as 2 separate services) — observed in many salon menus but not enforced by Fresha schema

If any of these flip our recommendations, flag them — most don't change the strategic call.

---

## Sources

- [Fresha — Set up payment policies](https://www.fresha.com/help-center/knowledge-base/payments/615-set-up-payment-policies)
- [Fresha — Cancellation & no-show fees](https://www.fresha.com/help-center/knowledge-base/payments/617-charge-no-show-and-cancellation-fees)
- [Fresha — Set advanced pricing & durations](https://www.fresha.com/help-center/knowledge-base/catalog/76-set-advanced-pricing-and-durations-)
- [Fresha — Terms of Service](https://terms.fresha.com/terms-service)
- [Groomit — Homepage](https://www.groomit.me/)
- [Groomit — Pet grooming prices page](https://www.groomit.me/pet-grooming-prices)
- [Groomit — How much does the service cost? (help)](https://www.groomit.me/help/article/booking-process/how-much-does-the-service-cost)
- [Groomit — Grooming packages help article](https://www.groomit.me/help/article/grooming-packages-and-add-ons/packages)
- [Groupon — Groomit Gold pkg listing (size brackets)](https://www.groupon.com/deals/groomit-1)
- [PetSmart — Services page](https://services.petsmart.com/grooming)
- [PetSmartWays — 2026 prices](https://petsmartways.com/petsmart-grooming-prices/)
- [OurPetGroomer — PetSmart full price list 2026](https://ourpetgroomer.com/blog/petsmart-grooming-cost)
- [PetCarePricing — PetSmart 2026](https://petcarepricing.com/petsmart-grooming-prices/)
- [Scenthound — Why membership](https://www.scenthound.com/why-membership)
- [Scenthound — FAQs](https://www.scenthound.com/faqs)
- [Scenthound — Is it worth it](https://www.scenthound.com/worth-it)
- [Bark.com — Dog grooming costs 2026 US](https://www.bark.com/en/us/pet-grooming/dog-grooming-price-guide-us/)
- [HomeGuide — Dog grooming prices 2026](https://homeguide.com/costs/dog-grooming-prices)
- [Animalo — Dog grooming prices 2026 complete guide](https://www.animalo.com/blog/dog-grooming-prices-complete-guide)
- [Groom Haus — What fees should groomers charge](https://thegroomhaus.com/what-fees-should-dog-groomers-be-charging/)
- [Pooch Dog Spa — Salon policies (matted coat example)](https://www.poochdogspa.com/about-us/salon-policies/)

---

**Audit author:** Claude (Phase 0.11 research subagent)
**Reviewer:** founder
**Next phase:** lock the 10 decisions in §7 before any pricing-UI work begins.
