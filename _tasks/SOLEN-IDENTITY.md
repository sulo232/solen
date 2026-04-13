# Solen — Design Identity

> **What Solen is NOT:** Airbnb (too cold, too minimal, too global). Fresha (too corporate, too blue, too SaaS).
> **What Solen IS:** The warm, local, personal alternative. Basel's beauty platform. Swiss intimacy at Airbnb-level quality.

> **NOTE:** This document captures brand philosophy and intent. For exact production values (hex colors, sizes, WCAG-compliant tokens), see `_rules/DESIGN_SPEC.md` — it is the source of truth for all component work and overrides specific values below where they differ.

---

## The Position

Airbnb is a **marketplace**. Cold, efficient, global. White walls, black text, red button. Photography does the talking.

Fresha is a **tool**. Blue accent, dark text, white bg. Professional. "1 billion appointments" — scale is the sell.

Solen is a **neighborhood**. You know the salon owner. The coral is warm like the light in a good salon. The cream background is the wall color of a Basel Altstadt shop. It's not searching — it's discovering your next spot around the corner.

**The feeling:** Walking into a salon you trust, not scrolling through a database.

---

## What We Keep (Solen's differentiators)

### 1. Warm palette — this IS Solen

| Token | Intent | Production value (DESIGN_SPEC) | Why it stays |
|---|---|---|---|
| Background | Warm, never cold white | `#FAFAF8` (off-white, warm tint) | Neither Airbnb nor Fresha uses warm bg. This is Solen's signature. |
| Coral | Warm accent, personal | `#E8735A` (accent), `#C05038` (buttons), `#B84A35` (text) | Warmer than Airbnb's red, more personal than Fresha's blue. Three tiers for WCAG. |
| Text | Warm black, not neutral | `#222222` (primary), `#767676` (secondary) | Warm near-black. Handmade feel. |

Airbnb is white. Fresha is white. Solen is **cream**. That's the brand. Don't apologize for it. But don't overdo it — no amber, sage, plum, yellow on the homepage. Just cream + coral + ink.

### 2. Floating nav pill — nobody else has this

The frosted glass bottom pill is genuinely premium. Airbnb has a flat tab bar. Fresha has a standard tab bar. Solen's floating glass pill feels like a native iOS app. **Keep it. It's the best thing on the page.**

### 3. "Dein" — personal language

"DEIN NÄCHSTER TERMIN WARTET" is personal. Airbnb says "Where to?" — functional. Fresha says "Book local selfcare services" — corporate. Solen says "yours." That intimacy is the brand voice.

### 4. Local identity — Basel is the character

The city section (Basel / Zürich / Bern) grounds Solen in place. Airbnb is everywhere. Fresha is everywhere. Solen is **from Basel, for the Swiss.** The dark city section works. It says: we're not trying to be global. We're your neighborhood.

---

## What We Steal (from Airbnb)

### 1. Restraint — cut the homepage in half

Airbnb: search → cards. That's it.
Solen currently: hero → pills → trust line → carousel → trust stats → carousel → carousel → mehr button → how-it-works → discover → city → testimonials → footer.

**Target: 6 sections max.**

```
Header (sticky, glass on scroll)
├── Hero (headline + search bar — NOT category pills)
├── Salon Cards (mixed categories, filterable)
├── City Section (Basel / Zürich / Bern)
├── Testimonials (only if 3+ real reviews exist)
└── Footer
```

**Kill list:**
- Trust stats banner (19 salons is not impressive — hide until 500+)
- "So funktioniert's" (users know how booking works)
- Discover/Inspiration section (cards ARE the discovery)
- "Mehr Kategorien entdecken" button (category nav handles this)
- Category pills in hero (duplicate of header nav)
- Separate carousels per category (one mixed grid, filterable)

### 2. Photography leads — bigger images

Airbnb cards: 16:10 aspect ratio, image fills 80% of card.
Solen cards: 200px fixed height, image fills ~55%.

**Change:** Switch to `aspect-[4/5]` on mobile, `aspect-[16/10]` on desktop. Let the salon photo BE the card. Less text, more image.

### 3. Shadow system — multi-layer, not warm

Airbnb shadow:
```css
rgba(0,0,0,0.02) 0px 0px 0px 1px,
rgba(0,0,0,0.04) 0px 2px 6px,
rgba(0,0,0,0.1) 0px 4px 8px
```

This is better than Solen's current single-layer warm shadows. Three layers create depth without being visible. The shadow is felt, not seen.

**Keep warm tinting** (`rgba(26,18,9,...)` instead of `rgba(0,0,0,...)`), but adopt the three-layer structure.

### 4. Hover = shadow only — no movement

Airbnb hover: shadow deepens. No translateY, no scale.
Solen hover: translateY(-1px) + shadow change.

**Change:** Drop the translateY. Just deepen the shadow. Movement on hover is 2020.

### 5. Typography scale — stop shouting

Airbnb section headings: 28px / 700.
Solen section headings: 24px Syne + Bebas Neue 56-88px hero.

Bebas Neue at 88px is fine for the hero — ONE emotional moment. But it shouldn't appear anywhere else on the homepage. Section headings should be Syne at 24-28px. City names should be Syne, not Bebas Neue. "FINDE DEINE INSPIRATION" in Bebas Neue competes with the hero — it shouldn't.

### 6. Button radius — 8px, not pills

Airbnb buttons: 8px radius. Not pill-shaped.
Solen buttons: 99px radius (pill).

**Reconsider:** Pill buttons feel playful but also feel template-y. Airbnb's squared-off buttons with slight rounding feel more confident. The search bar can stay pill-shaped (it's different from a button). But CTA buttons could go to `rounded-xl` (12-16px) instead of `rounded-btn` (99px).

---

## What We Steal (from Fresha)

### 1. Display font for ONE moment

Fresha: Playfair Display (serif) for the hero headline. AktivGrotesk (sans) for everything else.

Solen equivalent: Bebas Neue for the hero headline. Syne for section titles. DM Sans for body. **This is already the right structure** — but Bebas Neue keeps leaking into other sections. Lock it down.

### 2. Trust through content, not banners

Fresha shows "1 billion+ appointments" because they earned it. They don't have a decorated trust stats card with animated count-ups.

Solen has 19 salons and ~2000 reviews. **Don't advertise small numbers.** Instead, show trust INSIDE the cards: ratings, review counts, badges on deserving salons. Let the content earn trust.

### 3. App-first thinking

Fresha's entire homepage is a funnel to the app. The web experience feels like a preview of the app.

Solen already has the PWA + floating nav pill. **Lean into this.** The homepage should feel like opening an app, not visiting a website. Tight, focused, immediate utility.

---

## The Solen Formula

```
Airbnb's restraint + Fresha's focus + Solen's warmth
```

| Dimension | Airbnb | Fresha | Solen |
|---|---|---|---|
| Background | White | White | **Cream** (warm differentiator) |
| Accent | Red (sparse) | Blue (sparse) | **Coral** (sparse — CTAs + 1 headline word only) |
| Text | #222222 | #0D1619 | **#222222** (warm near-black) |
| Display font | None | Serif (hero only) | **Bebas Neue** (hero only) |
| Body font | Cereal | AktivGrotesk | **DM Sans** |
| Sections | 3 | 7 | **6** |
| Cards | Photo-led, 16:10 | Clean, minimal | **Photo-led, warm shadows** |
| Hover | Shadow only | Minimal | **Shadow only** (warm tint) |
| Trust | In-card ratings | Scale numbers | **In-card ratings** (hide banners until scale) |
| Mobile nav | Tab bar | Tab bar | **Floating glass pill** (unique) |
| Identity | Global marketplace | Global tool | **Local neighborhood** |
| Feeling | "Browse anywhere" | "Book efficiently" | **"Your next spot around the corner"** |

---

## Concrete Changes (Priority Order)

### Phase 1 — Cut the noise (biggest impact, least effort)
1. Remove trust stats banner entirely
2. Remove "So funktioniert's" section
3. Remove "Discover/Inspiration" section
4. Remove category pills from hero (header nav handles categories)
5. Remove "Mehr Kategorien entdecken" button

### Phase 2 — Fix the cards (most visual impact)
6. Switch card images to aspect ratio (`aspect-[4/5]`) instead of fixed 200px height
7. Adopt 3-layer shadow (warm-tinted Airbnb style)
8. Show badges on fewer cards (only when earned: 4.9+ rating OR 50+ reviews)
9. Drop hover translateY — shadow-only hover

### Phase 3 — Tighten typography
10. Bebas Neue: hero headline ONLY — remove from city section, discover header, etc.
11. Section headings: Syne 28px/700 (match Airbnb's scale)
12. Reduce heading sizes overall — hierarchy through weight, not size

### Phase 4 — Refine interactions
13. Consider 12-16px button radius instead of 99px pills
14. Simplify card hover to shadow-deepen only
15. Remove entrance stagger animations on cards (content just appears)

---

## One Sentence

**Solen is Airbnb's quality and restraint, dressed in Basel's warmth — cream walls, coral light, your salon around the corner.**
