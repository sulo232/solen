# Solen Homepage Audit — vs Airbnb & Fresha

> **Date:** 2026-04-12
> **Method:** Compared Solen's live homepage (Playwright screenshot) against Airbnb and Fresha's actual design systems and patterns.
> **Goal:** Identify where Solen feels "vibe-coded" vs where it could feel like a real premium product.

---

## Airbnb's Actual Design DNA (from their design system)

| Property | Airbnb value |
|---|---|
| Primary text | `#222222` (near-black, neutral) |
| Secondary text | `#6a6a6a` |
| Accent | `#FF385C` (Rausch red — used SPARINGLY, only CTAs + hearts) |
| Background | `#FFFFFF` (pure white — NOT cream, NOT warm) |
| Surface | `#F2F2F2` |
| Border | `#C1C1C1` |
| Font | Nunito Sans (formerly Cereal) — system fallbacks |
| Section heading | 28px / 700 |
| Card heading | 22px / 600 |
| Body | 14px / 400 |
| Card radius | **20px** |
| Button radius | **8px** |
| Card shadow | `0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)` |
| Hover shadow | `0 4px 12px rgba(0,0,0,0.08)` |
| Spacing scale | 4, 8, 12, 16, 24, 32 |
| Card image | 20:19 aspect ratio, carousel with dots |

### What makes Airbnb feel premium:
1. **Photography leads everything.** Cards are 80% image, 20% text. The image IS the product.
2. **Almost no color.** The UI is greyscale + one red accent. No gradients, no glass, no blobs.
3. **Extreme restraint.** No badges spamming cards. No trust banners. No "how it works" sections. Just search → cards.
4. **Typography is invisible.** You never notice the font because it doesn't draw attention to itself. No display fonts, no uppercase, no decorative type.
5. **White space is generous** but not wasteful. Cards breathe but the grid is tight.
6. **Cards have NO visual chrome** — no borders, just a subtle multi-layer shadow. The image bleeds to the card edge.
7. **Hover is minimal** — shadow deepens slightly. No translateY, no scale. Just shadow.
8. **Category icons are line-art** — consistent stroke weight, not filled, not 3D.

---

## Fresha's Actual Design DNA

| Property | Fresha value |
|---|---|
| Primary text | `#0D1619` (Bunker — very dark, near-black) |
| Accent | `#037AFF` (Azure — clean blue) |
| Background | `#FFFFFF` |
| Font | AktivGrotesk (body), PlayfairDisplay (display headlines) |
| Trust stats | Giant numbers, minimal chrome |
| Card style | Clean, white, minimal shadow |

### What makes Fresha feel premium:
1. **Trust through scale** — "1 billion+ appointments" displayed huge, not in a cute card.
2. **Serif display font** for emotional headlines, sans-serif for everything else.
3. **Blue accent is cold/professional**, not warm/playful.
4. **Testimonials are real reviews** with names, cities, and ratings — not styled cards, just clean quotes.
5. **Minimal decoration.** No glass, no gradients (except subtle hero), no animated category rows.
6. **CTA is "Get the app"** — the whole homepage is a funnel to the app, not a browse experience.

---

## Solen vs Both — The Audit

### 1. TOO MUCH VISUAL NOISE

**Airbnb:** Header → Search → Category icons → Cards. That's it. 4 layers of content.

**Solen has:** Header with 6 category icons + logo + lang switcher + profile → Hero headline + subtitle → Category pills → Trust signal → Coiffeur carousel → Trust stats banner → Nägel carousel → Barbershop carousel → "Mehr Kategorien" button → "So funktioniert's" 3-step → Discover section → City selector → Testimonials → Footer.

That's **14 sections** on one page. Airbnb has **3** (search, categories, cards).

**Problem:** The page tries to do everything. A new user sees: a headline, then pills, then a trust line, then cards, then stats, then more cards, then a how-it-works, then more cards, then cities, then reviews. There's no focus. It feels like a template that checked every "landing page best practice" box.

**Verdict:** 🔴 Cut sections. A homepage should do ONE thing well: get the user to search or browse salons. Everything else is friction.

---

### 2. DISPLAY FONT (BEBAS NEUE) FIGHTS READABILITY

**Airbnb:** No display font. Everything is the same sans-serif at different weights. The typography is invisible — you read content, not fonts.

**Fresha:** PlayfairDisplay serif for the hero headline only. Everything else is AktivGrotesk (clean sans).

**Solen:** Bebas Neue (condensed uppercase) for the hero headline, section titles, city names. It's visually loud and appears everywhere.

**Problem:** Bebas Neue is a condensed display face. It works for ONE hero headline. But Solen uses it for the hero AND "FINDE DEINE INSPIRATION" AND "BASEL/ZÜRICH/BERN" AND footer logo. When a display font appears 5+ times, it stops being special and starts feeling like a theme.

**Verdict:** 🟡 Reduce Bebas Neue to hero headline ONLY. Use Syne (heading font) for section titles like "Coiffeur", "So funktioniert's", "Finde deine Inspiration". This matches Fresha's pattern: display font for the emotional hook, clean sans for everything else.

---

### 3. CARDS DON'T LET PHOTOGRAPHY LEAD

**Airbnb cards:** Image fills ~70% of the card. Rounded corners (20px). Image carousel with dots. Below: title (16px/600), subtitle (14px), price, rating. Minimal text. The photo IS the card.

**Solen cards:** Image fills ~55% of the card (200px fixed height). Below: name (16px/600), location (13px), price + rating. Glass badges overlay the image ("Höchste Bewertung", "Beliebt"). Heart button on the image.

**Problems:**
- Fixed 200px image height is too short on desktop. Airbnb uses aspect ratio (20:19), not fixed height. This makes Solen cards feel stubby.
- Glass badges on every card add visual noise. Airbnb shows ONE badge type ("Guest Favorite") on ~10% of cards, not on every card.
- Card shadow uses a custom inline value instead of a multi-layer shadow like Airbnb's.

**Verdict:** 🔴 
- Switch to aspect ratio images (e.g., `aspect-[4/5]`) instead of fixed 200px height
- Show badges on fewer cards (only when truly earned, not on every card)
- Use Airbnb-style multi-layer shadow: `0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)`

---

### 4. TRUST STATS FEEL FORCED

**Airbnb:** No trust stats banner. Zero. The product speaks for itself through card content (ratings, reviews, "Guest Favorite").

**Fresha:** Trust stats exist but they're huge numbers in the hero area: "1 billion+ appointments". Clean, confident, not in decorated cards.

**Solen:** Trust stats are in a bordered section between carousels. "19+ Salons | ★ 4.8 Bewertung | 1'981+ Bewertungen | Kostenlos buchen". With count-up animation on scroll.

**Problem:** 19 salons and 1,981 reviews are not impressive numbers. Airbnb and Fresha show trust stats when the numbers are massive (1B+ appointments). Small numbers in a decorated banner actually HURT trust — they highlight how small the platform is.

**Verdict:** 🔴 Remove the trust stats banner entirely until the numbers are genuinely impressive (1000+ salons, 50K+ reviews). The small trust signal in the hero ("★ 4.8 Ø Bewertung · 2'400+ Bewertungen · Kostenlos buchen") is enough.

---

### 5. "SO FUNKTIONIERT'S" IS UNNECESSARY

**Airbnb:** No "how it works" section. Users know how to search and book.

**Fresha:** No "how it works" section on the homepage. The app does the explaining.

**Solen:** 3-step "Finde → Buche → Geniesse" section with icons.

**Problem:** This is a landing-page-template pattern. It fills space but adds no value. Users who visit a booking site know how booking works.

**Verdict:** 🟡 Remove or move to a separate "About" page. It's dead weight on the homepage.

---

### 6. DISCOVER SECTION IS UNFOCUSED

**Airbnb:** No "discover" section. The CARDS are the discovery.

**Fresha:** No separate inspiration section. Categories are the navigation.

**Solen:** "FINDE DEINE INSPIRATION" section with small Pinterest-style cards.

**Problem:** The discover cards are tiny (200px wide, 4:5 ratio), have demo content, and compete with the salon carousels above them for attention. The user has already seen 12 salon cards — showing 5 more "inspiration" cards is redundant.

**Verdict:** 🟡 Either make this section genuinely different (full-bleed editorial photos, user-generated looks, before/after shots) or remove it. Current state adds noise without value.

---

### 7. COLOR SYSTEM IS TOO WARM

**Airbnb:** Pure white background. Near-black text (#222222). One accent color (#FF385C). That's it. Cold, clean, confident.

**Fresha:** White background. Dark text (#0D1619). Blue accent (#037AFF). Also cold and clean.

**Solen:** Warm beige (#F5F0EB) background. Warm ink text (#1A1209). Coral accent (#E8624A). Warm shadows. Everything is warm.

**Problem:** The warm palette is a deliberate choice that differentiates Solen from both references. BUT: when combined with Bebas Neue, glass effects, and lots of sections, it tips from "premium warmth" into "template warmth." Airbnb proves you can feel inviting with a white background and great photography.

**Verdict:** 🟢 The warm palette is fine as a brand differentiator — but it only works if the REST of the design is as restrained as Airbnb. Warm colors + visual noise = spa website template. Warm colors + extreme restraint = premium.

---

### 8. CATEGORY PILLS VS CATEGORY ROW

**Airbnb:** Horizontal scrollable icon row BELOW the header. Each icon is a simple line drawing + label below. Clicking filters the cards below. It's the primary navigation mechanism.

**Solen:** Category icons are IN the header (6 icons with labels). PLUS there are category pills below the hero ("Coiffeur", "Nägel", etc.). These are two competing navigation patterns for the same thing.

**Problem:** Duplicate category navigation. The header has icons AND the hero has pills. Pick one.

**Verdict:** 🟡 Choose: either Airbnb-style icon row (filter cards) OR pills in the hero (navigate to category pages). Not both.

---

### 9. HOVER EFFECTS ARE OVERDONE

**Airbnb card hover:** Shadow deepens slightly. That's it. No translateY, no scale, no image zoom.

**Solen card hover:** translateY(-1px) + shadow change + 200ms transition. The card physically lifts.

**Problem:** Card lift on hover is a 2020 pattern. Airbnb dropped it. The subtle shadow-only hover feels more native-app and less "CSS trick."

**Verdict:** 🟢 Minor. The current hover is fine but could be simplified to shadow-only for a more modern feel.

---

### 10. MOBILE NAV — BOTTOM PILL IS GOOD

**Airbnb:** Bottom tab bar on mobile. Simple icons, no labels (or minimal labels).

**Fresha:** Bottom tab bar on mobile.

**Solen:** Floating glass pill at bottom with 4 icons.

**Verdict:** ✅ This is actually the one pattern Solen nails. The frosted glass pill is a premium touch that neither Airbnb nor Fresha has. Keep it.

---

## Summary: Priority Actions

| # | Action | Severity | Impact |
|---|---|---|---|
| 1 | **Cut sections** — remove trust stats banner, "So funktioniert's", and consider removing discover section | 🔴 | Huge — page goes from 14 sections to ~8, feels focused |
| 2 | **Fix card images** — aspect ratio instead of fixed height, fewer badges | 🔴 | Cards will look like actual salon photography, not thumbnails |
| 3 | **Reduce Bebas Neue** — hero only, Syne for all section titles | 🟡 | Typography hierarchy becomes readable, not shouty |
| 4 | **Kill duplicate category nav** — pick header icons OR hero pills, not both | 🟡 | Cleaner navigation, less redundancy |
| 5 | **Simplify card hover** — shadow-only, no translateY | 🟢 | Modern feel, less "CSS showcase" |
| 6 | **Keep warm palette** — but pair it with MORE restraint, not less | 🟢 | Brand differentiator works if everything else is clean |

---

## The Core Insight

**Airbnb and Fresha are premium because of what they DON'T show.** No trust banners, no how-it-works, no inspiration sections, no display fonts everywhere, no glass effects, no animated stats. They trust great photography and a clean search→browse flow to sell the product.

**Solen tries to compensate for being new/small by adding MORE: more sections, more effects, more trust signals, more fonts, more badges.** This is the opposite of what premium platforms do. Premium = confidence = restraint.

The single biggest change: **cut 4-5 sections from the homepage and let the salon cards breathe.**
