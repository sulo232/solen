# ☀️ Solen — Brand Brief & Visual Soul

> **This file is for when you're generating a new design from scratch** — with Claude Design, Figma MCP, v0, Cursor, or any AI that needs to feel Solen instead of produce generic slop.
>
> `DESIGN_SYSTEM.md` tells you what tokens to use. **This file tells you what Solen IS.**
>
> If the two ever drift, use this brief to prove the feel, then reconcile the tokens.

**Last written: 2026-04-21** — reconstructed from `_archive/monolith-v1.html`, `globals.css` gradient history, commit history, and lost-charm review.

---

## 0. How to Use This File

**If you're prompting an AI design tool**: paste §1 + §2 + §3 + §11 into the system/context. That's the concentrated soul. Then attach DESIGN_SYSTEM.md for the rule fence.

**If you're designing manually**: read §1 to feel the room, §4–§9 to ground every choice, §10 for concrete archetypes, §11 to check for slop.

**If you're an engineer translating a design**: skip straight to §13 to map feel-words to real tokens.

---

## 1. The One-Paragraph Vibe

> Solen is a **warm Mediterranean afternoon in a terracotta-tiled courtyard**, not a sterile app dashboard. Think: salt-glazed pottery, sun-faded linen, a hairdresser's studio with plants in the window, afternoon light pouring through amber glass. The interface should feel **lived-in, confident, hand-curated** — never clinical, never cold, never corporate. Every interaction should feel like someone cared. The coral isn't "brand color #1", it's **a clay wall at 4pm**. The cream background isn't "#FAF6EF", it's **the inside of a cappuccino cup**. When a user taps a salon card, they should feel like they're **picking up a polaroid from a wooden tray**, not clicking a button.

That's the room. Everything below is furniture.

---

## 2. Reference Anchors

Not "inspired by" in a vague way — specifically, **these exact aesthetics at these exact moments**:

| Reference | What to pull |
|---|---|
| **Airbnb 2017–2019** (before they went flat-grey) | Card grids with breathing room, warm beige pages, confident photography, soft shadows, humane copy |
| **Fresha** (salon booking UX) | Booking sheet pattern, calendar density, availability pills, stylist-first layouts |
| **Glossier early site (2015–2018)** | Warm pink-coral palette, editorial typography mixing display + body, generous whitespace, "cool friend" voice |
| **Aesop website** | Restraint, beige canvas, serif moments, product-as-hero photography, *permission to be quiet* |
| **Linear marketing pages** | Ambient gradient backgrounds that breathe, micro-animations with intent, deceleration easing |
| **A hairdresser's Instagram** (the good ones — Larry King, Sam McKnight, Hershesons) | Confident close-ups, warm skin tones, raw textures, no stock photos, real hands |
| **Mediterranean ceramics** (Portuguese tile, Moroccan zellige, Italian majolica) | Terracotta + cream + deep plum, organic glazing, hand-made imperfection |

**Not references**: Material Design, Uber app, any B2B SaaS dashboard, Stripe docs, Notion, generic iOS patterns. If you're copying those, you've lost the plot.

---

## 3. Adjective Clusters

Solen is, in order:

**Primary**: warm · confident · editorial · hand-curated · tactile · sun-baked · artisanal · grounded
**Secondary**: generous · soft · intentional · slow-considered · Mediterranean · ceramic · terracotta · linen
**Permitted**: playful (sparingly) · whimsical (in hearts/stamps only) · decorative (in hero, not listings)

Solen is **never**:

clinical · corporate · material · neon · glossy · techy · startup-y · grey · "modern minimalist" (the flat/cold kind) · AI-looking · generic · template-y · 2023-dashboard · cyberpunk · bootstrap · "clean" (as a code word for boring)

**Read test**: if you'd describe the design with the word *crisp*, you're about to make Stripe. If you'd describe it with *warm* or *inviting*, you're making Solen.

---

## 4. Color Stories — Each Color Has a Mood

Don't just apply colors — tell their story.

### 4.1 Coral `#E8624A` — "terracotta at 4pm"

This is Solen's heartbeat. Not a brand color. A **clay wall in late-afternoon sun**. Use it like you'd use a single ripe tomato on a plate of linen — precious, focal, never background-sized. Primary CTAs, active tab, hero accent word, brand logo, favorite heart on press.

**Don't**: large backgrounds, hover-fill on entire rows, gradient fades from coral to anything cool.
**Do**: 2–8% wash in hero ambient gradient, CTA-only at full saturation, subtle under text-hovers on links.

### 4.2 Cream `#FAF6EF` — "inside of a cappuccino cup"

The page. The room. Never pure white. White on Solen feels like hospital sheets. Cream feels like a **handmade ceramic mug**. Use it as the base of every Marketing mode page. Cards sit on cream; cards are white (`#FFFFFF`) to create gentle lift without shadow drama.

### 4.3 Amber `#D4870A` — "honey drizzled on focaccia"

Urgency and premium, together. Last-minute slot strip, promotional bands, loyalty/premium indicators. Amber says *"this is special, this is ending, this is yours if you move"*. Pairs with cream beautifully. Never put amber on coral — they fight.

### 4.4 Basel Blue `#6BA3C8` — "the Rhine in June"

Breathe. Cool counter to all that warmth. Info states, map pins, links (subtle), trust signals. Use sparingly — too much and the whole thing goes corporate. One blue per page is often right.

### 4.5 Plum `#4A1E3C` — "an empty wine glass at dusk"

**Reserved**: premium tier labels, subscription ribbons, editorial depth blocks. Inverts to a soft **lavender `#C090B4`** in dark mode. When you see plum, the eye should feel *restraint, elegance*, not drama.

### 4.6 Sage `#7BA688` — "the underside of an olive leaf"

**Reserved**: spa + wellness category only. Don't extend to "general green accents". If it's not spa, it's not sage.

### 4.7 Sand `#C9A96E` — "salt-glazed pottery rim"

**Reserved**: warmth accents on secondary cards. Rare. Use when you want the warm brown-gold of unglazed terracotta without summoning coral.

### 4.8 Yellow `#F2C144` — "afternoon marigold"

**Reserved**: rating stars + "Top Rated" / "Neu" badges. That's it. Don't extend to "caution" or "highlight".

### 4.9 Ink `#1A1209` — "dark chocolate, not black"

The text. Warm brown-black, the color of a slightly over-pulled espresso. NEVER `#000000`. Shadows too: `rgba(26,18,9,x)`, never `rgba(0,0,0,x)`. This is the rule that makes everything else feel warm instead of grey.

### 4.10 Dark Mode

Not inverted cream — **warm espresso `#151009`**. The whole room is a candlelit kitchen at night, not a blank server room. Coral brightens to `#F07560` (ember glow), plum inverts to lavender (unexpected, delightful), cream → cream-text `#F5EEE4`.

---

## 5. Shape Language — Blobs Return, Selectively

Old system: blobs were banned everywhere. That killed the charm. New rule: **blobs are decorative atmosphere, not structural containers.**

### 5.1 Blob Rules — When YES

Blobs belong in these exact contexts, nowhere else:

| ✅ Use blobs | How |
|---|---|
| **Hero section backgrounds** | 1–2 soft organic blobs behind the headline, 4–8% coral/amber opacity, subtle breathing animation (10s+ loop), `filter: blur(60px)` so edges dissolve |
| **Empty states** | A single playful blob behind the illustration — "come back and fill this space" |
| **Marketing splash pages** (coming-soon, referral share, brand/partner landing) | Generous blob use, can be bigger + more saturated (up to 12% opacity) |
| **Category page hero strips** | One blob per category, tinted to that category's color (spa = sage blob, nails = coral blob) |
| **404 / error pages** | Whimsical single blob — make failure feel warm |

### 5.2 Blob Rules — When NO

Absolute bans. These break the charm → slop spiral:

| ❌ Never blobs | Why |
|---|---|
| **Listing cards / salon cards** | Content needs to breathe; blob behind a card = visual noise |
| **Booking flow / checkout** | App mode; trust demands solid surfaces |
| **Dashboard / admin** | Data is loud enough; blob would fight readability |
| **Modal backdrops** | Use solid + backdrop blur, not blob |
| **Behind forms / inputs** | Distracting |
| **Anywhere in dark mode above 4% opacity** | Blobs become patches on dark; keep subtle |

### 5.3 Blob Technical Spec

```css
/* Base blob — use for hero, empty state, splash */
.blob {
  position: absolute;
  border-radius: 47% 53% 62% 38% / 55% 45% 55% 45%;  /* asymmetric = organic */
  filter: blur(60px);
  opacity: 0.06;              /* whisper, never shout */
  pointer-events: none;
  animation: blob-drift 14s ease-in-out infinite;
}

.blob-coral  { background: #E8624A; }
.blob-amber  { background: #D4870A; }
.blob-sage   { background: #7BA688; }  /* spa only */
.blob-plum   { background: #4A1E3C; }  /* premium only */

@keyframes blob-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33%      { transform: translate(30px, -20px) rotate(5deg) scale(1.05); }
  66%      { transform: translate(-20px, 20px) rotate(-3deg) scale(0.98); }
}

/* Reduced motion: stop the drift, keep the shape */
@media (prefers-reduced-motion: reduce) {
  .blob { animation: none; }
}
```

Layout: 1–3 blobs per hero, positioned at opposite corners, one larger one smaller, colors different but within palette.

### 5.4 Non-Blob Shape Language

Outside blobs, shapes are soft geometric:

- **Pills** (`rounded-pill 9999px`) — tags, filter chips, badges, nav pill
- **Buttons** (`rounded-btn 99px`) — all CTAs; SOFT pill, never sharp
- **Cards** (`rounded-card 16px`) — salon, listing, content blocks; generous soft corner
- **Feature cards** (`rounded-card-lg 20px`) — hero cards, modals; even more generous
- **Inputs** (`rounded-input 12px`) — forms, dashboard cards; functional, still soft
- **Sheets** (`rounded-sheet 28px`) — bottom sheet top corners; dramatic top radius, bottom full-width

**Never**: `rounded-sm`, `rounded-none`, sharp 90° corners anywhere (feels cold/techy). Never `rounded-lg/xl/2xl` — use design tokens.

### 5.5 Organic Accents Beyond Blobs

- **Wavy section dividers** — allowed between marketing sections, SVG wave path, coral or sand, max 40px height
- **Curved photo masks** — hero salon photo can have asymmetric bottom (`clip-path: ellipse(...)`), subtle
- **Asymmetric image frames** — in empty states / illustrations, not in card grids

---

## 6. Texture & Atmosphere

Warmth comes from **layers**, not saturation.

### 6.1 Ambient Gradients (mandatory backdrop)

Every Marketing page has a subtle warm radial-gradient wash behind the content. Two patterns:

**Hero cinematic** (homepage + category heroes):
```css
background:
  radial-gradient(ellipse 60% 50% at 15% 70%, rgba(232,98,74,0.05) 0%, transparent 70%),
  radial-gradient(ellipse 50% 40% at 85% 25%, rgba(242,193,68,0.04) 0%, transparent 60%),
  #FAF6EF;
```
Coral glow bottom-left (warmth), amber glow top-right (light), cream base.

**Ambient section** (below hero, category sections):
```css
background:
  radial-gradient(ellipse 70% 50% at 0% 0%, rgba(232,98,74,0.05) 0%, transparent 60%),
  radial-gradient(ellipse 50% 40% at 100% 100%, rgba(212,135,10,0.03) 0%, transparent 60%);
```

Available as `.ambient-v5` class. Use it on `<section>` backgrounds liberally in marketing; never in app mode (dashboard stays solid).

### 6.2 Glass

Glass is **floating UI only** — headers on scroll, modals, dropdown overlays, filter pills, bottom tab bar. Never on content cards. Use `.glass-frost` (20px blur, 72% opacity) for overlays, `.glass-pill` (12px blur, 55% opacity) for interactive filter chips.

Dark mode: glass becomes warm-brown translucency `rgba(30,23,16,0.78)`, not grey.

### 6.3 Shadows Are Warm

Every shadow in Solen uses `rgba(26,18,9, x)` — **never** `rgba(0,0,0, x)`. Tokens: `shadow-elevation-1` (rest) → `shadow-elevation-3` (hover). Primary CTAs get `shadow-coral-glow` (coral-matched halo, not generic shadow).

### 6.4 Film Grain (Optional, Sparingly)

For premium splash pages and hero backgrounds, a very subtle film-grain overlay (`opacity: 0.03`, SVG noise) adds warmth the eye can't articulate. Don't globalize — it murders performance on long pages.

---

## 7. Typography Voice

Three voices. Never more. Each has a specific moment.

### 7.1 Bebas Neue — The Confident Friend

**When**: hero headlines ≥36px, section eyebrows, category tile labels, campaign splashes.
**Voice**: loud, uppercase, **not shouting** — more like a confident friend who doesn't hedge. `DEIN NÄCHSTER TERMIN.` reads as *declaration*, not request.
**Spec**: always uppercase (the font is all-caps anyway), line-height 0.85–0.92 (tight, almost touching), letter-spacing neutral to slightly loose (0 to 0.02em), 56–130px in hero (use `clamp(64px, 9vw, 130px)`), 22px minimum for category tile labels.

**Don't**: drop Bebas below 36px (it stops reading as display and starts reading as ugly). Don't use Bebas in app mode (booking/dashboard) — it breaks the functional quiet.

### 7.2 Syne — The Structure Keeper

**When**: H1 when not Bebas, H2–H4 always, card titles, modal titles, section headers below hero.
**Voice**: sophisticated, geometric, **European editorial**. Reads like a design magazine, not a startup blog.
**Spec**: weight 700–800, letter-spacing `-0.02em` (subtly tight), never italic (use DM Sans italic when you need italic emphasis), sizes 18–48px depending on hierarchy.

**Don't**: use Syne for body text (it fatigues). Don't mix Syne and Bebas in the same visual line — pick one per tier.

### 7.3 DM Sans — The Quiet Host

**When**: body text, labels, nav, inputs, captions, data/numbers (`data-text` class adds `tabular-nums`).
**Voice**: warm, readable, **a clear voice that doesn't interrupt**. Doesn't have strong personality — it lets Bebas + Syne do the character work while it gets the information across.
**Spec**: 400 body, 500 data/numbers, 300-italic for pull quotes and hero descriptions, never weight 200 (too thin on cream), never weight 800 (too brutal alongside Syne).

### 7.4 Banned Fonts (zero brand personality)

`system-ui`, Inter, Roboto, Arial, SF Pro (on the web), Helvetica Neue loaded fresh, Space Grotesk (retired), DM Serif Display (retired). If a component is using any of these, it's leaking slop.

### 7.5 Pairing Rhythm

The Solen headline pattern:
```
[Bebas huge display]        ← declaration
[Syne mid heading]           ← subject
[DM Sans body paragraph]     ← explanation
[DM Sans italic 300 pull]    ← voice break
```

Example (hero):
> **DEIN NÄCHSTER TERMIN.** (Bebas 88px)
> **Salons in Basel, die Lust machen.** (Syne 24px 700)
> Finde deine Frisur. Buche in 30 Sekunden. Nie wieder Warteschleife. (DM Sans 16px 400)
> *Weil dein Nachmittag dir gehört.* (DM Sans 14px 300 italic)

---

## 8. Motion Personality

Motion in Solen is **decelerated exhale**, never acceleration. Every animation is a thing settling in, not jumping out. Easing = `EASE_SOLEN [0.23, 1, 0.32, 1]` — fast start, silky landing.

### 8.1 Timing Personality

| Moment | Duration | What it feels like |
|---|---|---|
| Hover color change | 150ms | A held breath |
| Button press | 100–150ms | A confirmed decision |
| Card hover lift | 250ms | A polaroid being picked up |
| Modal enter | 200ms | A window opening into the room |
| Bottom sheet enter | 300ms iOS curve | A drawer sliding out |
| Grid stagger | 60ms between items | Cards arriving like guests, not all at once |
| Heart bounce | 300ms spring | A tiny yes |
| Section heading slide-in (Marketing only) | 500ms | A title being unveiled |

Never longer than 300ms on functional UI. The only 500ms allowed is Marketing reveals that happen once on scroll.

### 8.2 Motion Archetypes (what Solen motion feels like)

**Polaroid pickup** (cards): `translateY(-4px)` + subtle shadow deepening, 250ms EASE_SOLEN. Not a scale-up (feels cheap). Not a tilt (feels gimmicky). Just a gentle lift.

**Bread rising** (section reveal on scroll): `opacity 0 → 1` + `translateY(16px → 0)`, 500ms EASE_SOLEN. The content was always there; it's just finishing settling.

**Guests arriving** (grid stagger): one card at a time, 60ms apart, each doing its own polaroid lift-in. Feels warm, not mechanical.

**Tiny yes** (heart/favorite/stamp): spring `{stiffness: 500, damping: 20}`, scale `1 → 1.15 → 1`, 300ms total. Playful confetti of delight.

**Drawer opening** (bottom sheet): slide up from bottom 100% → 0 with iOS curve (`[0.32, 0.72, 0, 1]`), 300ms. Dismiss with faster 200ms EASE_SOLEN.

### 8.3 Forbidden Motion Patterns

- **Acceleration curves** (`ease-in`) on entering elements — feels broken
- **Spring physics on modals/sheets** — feels jittery; springs only for hearts/stamps/avatar
- **`scale(0) → 1`** entrances — pops out of nowhere; start from `scale(0.95+)`
- **`transition-all`** — browser watches every property, can't optimize
- **Long fade-in-on-load curtain** (page-level opacity 0 → 1 over 600ms) — feels slow
- **Parallax on scroll** — busy, dated, 2015 website
- **Cursor-tracking blobs/elements** — novelty that ages badly
- **Typewriter animations** on headlines — unbearable on repeat visits
- **Infinite loops above 0.05 opacity** — fatigues eyes

### 8.4 Ambient Motion (subtle, allowed)

Blobs in hero can drift with a 10–14s ease-in-out-infinite loop (see §5.3). Coral pulse on primary CTA (2s loop, once per page, optional). Hero background ambient gradients can have a slow `scale(1 → 1.02)` breath, 20s loop, opacity unchanged. Anything else: no loops.

### 8.5 `prefers-reduced-motion`

Mandatory. A single global `@media` block zeroes transitions/transforms/animations. Already wired in `globals.css` — don't remove, don't add per-component checks.

---

## 9. Iconography & Illustration

Three icon languages, each in its lane.

### 9.1 Lucide React — UI Chrome

Menu, search, X, heart, star, chevron, paperclip, share, copy, arrow, info, alert, check, pencil, plus, minus, settings, user, map pin, filter, calendar, clock.

Outlined, 18–24px, inherit `currentColor`. Never filled (exception: rating stars). Never mix lucide with another icon library.

### 9.2 Beauty Icons — The Domain (custom SVG)

Lucide doesn't know what a "balayage" looks like or how to show "french tip vs stiletto". Custom library in `components/ui/beauty-icons.tsx` handles the beauty domain:

- Hair types (straight, wavy, curly, coily)
- Hair lengths (pixie, bob, lob, long)
- Nail shapes (almond, stiletto, coffin, square, oval)
- Skin concerns (sensitive, oily, dry, mature)
- Beauty tools (scissors, clippers, brush)

These are drawn in-house with Solen's shape language — soft, warm, slightly imperfect (a tiny asymmetry that reads as hand-drawn, not generated).

### 9.3 Recraft SVG — Category Tiles

The 6 category icons on the homepage — Coiffeur, Nails, Barber, Makeup, Spa, Waxing. Generated via Recraft API with locked prompts (see `DESIGN_SYSTEM.md` §10.3). Always coral `#E8624A`, flat, transparent background, centered, no shadows.

**Regenerate** if: a new category is added, or the current icons look AI-generic. **Never** hand-edit bezier paths — output will drift.

### 9.4 Illustrations

- **Empty states** — one-off SVG or Lottie, warm style, slight humor, never generic shrugging person
- **Hero graphics** (marketing pages only) — Recraft `digital_illustration` style or commissioned designer
- **Error/404 pages** — warm, apologetic, not sterile
- **Onboarding moments** — simple vignettes, never 3D isometric illustrations (that's Stripe/Notion, not Solen)

Illustration voice: **editorial magazine, not tech brochure**. Think New York Times travel section, not Mailchimp.

### 9.5 Photography

Salon photos come from real salon onboarding (Supabase storage) and curated Unsplash/Pexels. **Never AI-generated photorealistic people** in production — reads uncanny, ages badly, ethically iffy. Photo style: warm light, real hands working, raw textures, close-ups of hair/nails/products, never stocky smiling models in sterile rooms.

### 9.6 No Emoji in Functional UI

Emoji render differently per OS, don't scale, don't inherit color, feel lazy. Use lucide or beauty-icons. Exception: decorative uses in copy (e.g., a blog post title), not in buttons or states.

---

## 10. Component Archetypes — What "Good Solen" Looks Like

For each key component, a **feel description** + **what wrong looks like**. These are the archetypes AI should target.

### 10.1 Hero (Homepage)

**Feels like**: stepping into a sunlit atelier. Big confident declaration in Bebas. A sentence of invitation in Syne. A real salon photo or a gorgeous hand-curated mood image, slightly off-center. Warm ambient glow behind it. Maybe one coral blob drifting very slowly bottom-left, one amber blob top-right, both 5% opacity.

**Wrong**: centered hero with generic gradient, "Book Now" button floating in white space, stock happy-salon-lady photo, "trusted by 10,000+ users" bar underneath. That's a SaaS landing. Not Solen.

### 10.2 Salon Card

**Feels like**: picking up a polaroid from a wooden tray. Square (1:1) cover photo, solid white card, 16px soft corners, subtle elevation at rest, **clean lift on hover** (250ms polaroid pickup). Title in Syne 700 18px. Category pills in cream-tinted glass. Rating in DM Sans `data-text` with tabular numbers. One coral heart in top-right corner.

**Wrong**: glass card with frosted background, neon-glow border, oversized rating badge, "From CHF 50" sticker slapped on corner, gradient over the photo, hover scale to 1.05 with bounce. That's an Airbnb parody from 2020.

### 10.3 Category Tile

**Feels like**: a page from an illustrated beauty encyclopedia. Square (1:1) tile, white background, centered Recraft coral icon, label in Bebas 22px below. Maybe one blob behind the grid at 4% opacity. Hover: tile lifts 4px with warm shadow deepening; icon stays still (don't animate the icon on every hover — feels twitchy).

**Wrong**: colored square with emoji, gradient background per category, icon inside a colored circle, hover tilt 3D effect. That's gamified. Solen is editorial.

### 10.4 Booking Sheet (App mode)

**Feels like**: a clean worktop in a calm studio. Full white surface, no glass, no blobs, no ambient. `rounded-sheet 28px` top corners, solid shadow. Time slots in a tight grid, Syne 500 14px. Selected slot fills coral, tactile `active:scale-[0.97]`. No animation beyond simple fade on state change (150ms).

**Wrong**: frosted glass modal, ambient gradient behind, spring bounce on slot select, decorative blob in the corner, coral gradient background. Booking is trust. Trust is solid.

### 10.5 Last-Minute Strip

**Feels like**: a cork board where someone just pinned a special. Amber background at 100%, warm ink text, a small clock icon ticking down in DM Sans `data-text` tabular. Coral CTA button at the right. Subtle pulse on the CTA (2s coral-pulse loop). Urgent without panicking.

**Wrong**: red urgency bar with blinking animation, countdown in huge red numbers, "Only 3 left!!!" copy with exclamation marks. That's a phishing page.

### 10.6 Filter Bar

**Feels like**: a row of smooth ceramic buttons on a console. Pills with `.glass-pill` treatment, 55% white frosted, subtle dark border. Active filter = coral fill, white text, coral glow. Tap = `active:scale-[0.97]`. Never slide/animate on mobile when switching filter state (150ms opacity fade on the content grid below — that's enough).

### 10.7 Empty State

**Feels like**: a polite shrug from a friend. One warm-toned illustration or a single calming blob behind, soft heading in Syne 20px, sub in DM Sans 14px at `/70` opacity, maybe a CTA to take action. Humor optional but never sarcastic.

**Wrong**: giant sad emoji, "Nothing found 😢", grey empty-box icon. Solen is never sad.

### 10.8 Dashboard (App mode)

**Feels like**: the back of a well-organized cafe — clean, functional, no charm distractions. White cards on cream, `rounded-input 12px`, `shadow-elevation-1` at rest. Syne + DM Sans only (no Bebas). No ambient gradients. Accent colors only on borders, status dots, and CTAs. Numbers in `data-text` with tabular-nums so everything aligns.

**Wrong**: glass dashboard cards, gradient backgrounds, chart with 12 colors, "beautiful data viz" that nobody can read. Dashboards serve data, not ego.

### 10.9 Modal / Sheet

**Feels like**: a polite door opening into the current room. `.glass-frost` treatment on backdrop (20px blur, `bg-s-ink/40`), content inside is solid white, `rounded-card-lg 20px`, shadow-elevation-3. Enter in 200ms EASE_SOLEN from `{opacity:0, scale: 0.95, y: 10}`. Close via X + backdrop + Escape, all three.

### 10.10 Homepage Section Rhythm

A great Solen homepage reads like a magazine spread:
1. **Hero** (Bebas declaration + invitation + search bar + blob ambient)
2. **Category grid** (6 tiles, subtle ambient)
3. **Featured salons** (editorial row of 4–6 curated cards)
4. **Last-minute strip** (amber band, time-sensitive)
5. **Editorial pair** (big image + quote from founder / stylist)
6. **City guide / browse by quartier**
7. **Testimonials** (real quotes, real names, real warmth)
8. **Newsletter** (soft invitation, not popup hijack)
9. **Footer** (dark plum, handwritten warmth)

Each section separated by ~80px vertical rhythm, ambient gradient shifting subtly between sections.

---

## 11. Anti-Slop — The Solen-Specific "Not This, This"

General anti-slop rules (scale(0.95), ease-out, named transitions, ≤300ms, active:scale) are in `DESIGN_SYSTEM.md` §8.6. This section is **Solen-specific slop traps**.

### 11.1 Colors That Scream "AI Made This"

| ❌ Slop pattern | ✅ Solen way |
|---|---|
| Vibrant gradient background `from-coral to-amber` at 100% | Soft radial glow at 4–8% opacity, coral one corner, amber opposite |
| Purple-to-pink SaaS gradient | Warm coral-to-amber, or just solid cream |
| Neon hot-pink accent for "energy" | Coral. Always coral. Energy comes from contrast on cream, not saturation. |
| Dark grey card on black background | Warm white card on warm dark espresso. Never grey. Never black. |
| Blue-800 for "trust" CTAs | Coral. Trust in Solen comes from warmth, not corporate blue. |
| Generic "lighter" + "darker" shade variants | Every color has specific moods (see §4) — use with intent |

### 11.2 Layouts That Scream "Template"

| ❌ Slop pattern | ✅ Solen way |
|---|---|
| 3 centered feature cards in a row with identical icons | Editorial asymmetry: 1 large card + 2 smaller stacked, or 4 cards in a horizontal scroll |
| "Trusted by" logo bar | Real testimonials with real names, in `font-body italic 300` |
| Bento grid of colored boxes | A magazine spread with breathing room and one editorial photo as hero |
| Hero with headline + "Book Now" button centered in white void | Hero with confident Bebas declaration + warm ambient glow + real photo + search bar |
| Rounded-3xl card with huge drop shadow | `rounded-card 16px` + `shadow-elevation-1` (subtle, warm) |

### 11.3 Copy That Scrimes "Template"

| ❌ Slop copy | ✅ Solen voice |
|---|---|
| "Discover the best salons near you" | "Der Termin, den du dir gönnst." |
| "Trusted by thousands of users" | "Lieblingssalons, von echten Menschen kuratiert." |
| "Get started" | "Jetzt buchen" or "Termin finden" |
| "Our community of beauty lovers" | (just skip this — Solen doesn't talk about "communities") |
| "Sign up now to unlock exclusive deals" | "Registriere dich – oder nicht. Buchen geht auch ohne." |
| Exclamation marks | Almost never. Solen is confident, not excited. |

### 11.4 Motion That Screams "AI Added Animation Because It Could"

| ❌ Slop motion | ✅ Solen way |
|---|---|
| Typewriter effect on headline | Static. Solen doesn't need to prove it's dynamic. |
| Cursor-following glow/blob | No. Ages badly, feels gimmicky. |
| Parallax scrolling | No. Makes the page feel haunted. |
| Scroll-triggered video autoplay | No. Heavy. Slop. |
| Framer `whileInView` with `scale: 0.5 → 1` bounce on every section | One `fadeSlideUp` reveal per section on first view, no bounce. |
| Infinite scrolling logo marquee | No. |
| Animated count-up numbers on trust stats | OK on first view only, 600ms, ease-out. Never on scroll-back. |
| Hover-tilted 3D cards | No. |
| Blob that morphs shape on hover | Blobs drift slowly; they don't react to user. |

### 11.5 Icon/Illustration Slop

| ❌ Slop | ✅ Solen way |
|---|---|
| 3D isometric illustrations (Notion/Stripe style) | Flat editorial SVG, hand-feeling lines |
| Stock happy-diverse-team photo | Real hands, real salons, real work |
| Generic "bell notification" icons everywhere | Lucide sparingly; domain needs = custom beauty-icons |
| Gradient-filled icons | Flat coral `#E8624A`, one color |
| Animated wiggle on idle icons | Only on first hero load stagger, never idle-looping |

### 11.6 "Everything Has a Border and Gradient" Trap

The single strongest slop tell: **AI loves adding decorative borders and gradients to everything.** Solen resists this.

- Cards: 1px `border-s-ink/5` (almost invisible) OR no border at all, just shadow
- Buttons: no border (coral fill or ghost outline, not both)
- Sections: divided by whitespace, not `<hr>` or gradient divider (unless it's a deliberate wavy section break)
- Glass: 1px frosted border OK, anywhere else no

### 11.7 Final Read Test

Before shipping any component/page/generated design, read these five questions:

1. **If I removed the coral, would anyone know this is Solen?** If yes, good. If the coral was doing all the brand work, it's slop.
2. **Does this feel warm without trying?** If it needs "warm gradient filter" CSS, you've failed. Warmth comes from cream base, warm shadows, warm ink.
3. **Could this be on a generic SaaS landing?** If yes, scrap it. Solen is never generic.
4. **Is there one thing per page that's deliberately imperfect / asymmetric / hand-curated?** There should be. Perfection reads as AI.
5. **Would a human designer be proud to show this in their portfolio, or would they quietly hide it?** Be honest.

---

## 12. Ready-to-Paste Prompts for Claude Design

Paste these directly into Claude Design (or any AI design tool) as context when generating Solen work.

### 12.1 The Cold Start Prompt (paste first, always)

```
You are designing for Solen.ch — a beauty & wellness booking platform for the
Basel area in Switzerland. Solen is not a generic SaaS app. It's a warm
Mediterranean courtyard translated into a product. Think: terracotta tiles at
4pm, sun-faded linen, salt-glazed pottery, a hairdresser's studio with plants
in the window. It's Airbnb 2017 × Aesop × early Glossier × a real stylist's
Instagram.

Foundational rules (non-negotiable):
- Every shadow uses rgba(26,18,9,x) not rgba(0,0,0,x). Warm, always.
- Page background is cream #FAF6EF, never white. Cards are white, on cream.
- Dark mode base is warm espresso #151009, never grey or pure black.
- Primary color is terracotta coral #E8624A. Used precious, never filler.
- Fonts: Bebas Neue (display ≥36px, uppercase), Syne (headings), DM Sans (body).
  No Inter, no Roboto, no system-ui, no DM Serif, no Space Grotesk.
- Radii: 16px cards, 12px inputs, 99px buttons (pill), 9999px tags.
  No rounded-lg/xl/2xl/full from Tailwind defaults.
- Motion: decelerated (cubic-bezier(0.23,1,0.32,1)), 150–300ms max on UI,
  60ms stagger between grid items, springs only on hearts/stamps.
- Blobs: allowed in hero backgrounds, empty states, splash pages at 4–8%
  opacity with blur(60px). Never on cards, dashboards, booking flow.
- Icons: lucide-react for chrome; custom beauty SVG for hair/nail/skin;
  Recraft coral #E8624A for 6 category tiles.

Anti-slop: no purple gradients, no "trusted by" logo bars, no 3D isometric
illustrations, no centered hero in white void, no typewriter effects, no
parallax, no "Discover the best..." template copy, no exclamation marks,
no stock-happy-team photos, no blue-800 corporate CTAs.

When in doubt, reference:
- Aesop for restraint
- Glossier 2016 for warmth
- Airbnb 2017 for card grids
- Linear marketing for ambient gradients

Design like a human who's already in love with Solen. Not a machine
filling a brief.
```

### 12.2 The Hero Prompt

```
Design the homepage hero for Solen.ch.

Layout: full-bleed hero, cream background (#FAF6EF), ambient warm radial
gradient glow (coral 5% opacity bottom-left, amber 4% opacity top-right).
One coral blob drifting slowly behind the headline (6% opacity, blur 60px).

Content:
- Headline: Bebas Neue, 88px desktop / clamp(56px, 9vw, 130px),
  uppercase, line-height 0.88, 3 lines max.
  Copy: "DEIN NÄCHSTER. TERMIN. WARTET."
- Subhead: Syne 500, 22px, /70 opacity of s-ink. 1 line.
- Search bar: .glass-search style, 99px rounded, shadow-elevation-1,
  3 segments (Was / Wo / Wann).
- One coral accent word in the headline — pick the most important word
  and color it #E8624A, no underline.

Below hero: subtle wavy SVG divider, coral at 20% opacity, max 30px height.

No centered layout. Headline is left-aligned. Search bar is below it,
slightly right-offset.

Don't use: centered hero, "Book Now" button in white void,
"Trusted by 10,000+" strip, stock photo, gradient overlay on text.
```

### 12.3 The Salon Card Prompt

```
Design a salon card for Solen.ch.

Constraints:
- Square (1:1) cover photo — ALWAYS aspect-square on all breakpoints.
- Solid white card on cream page background.
- Radius: rounded-card 16px.
- Rest shadow: 0 1px 2px rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.03).
- Hover: translateY(-4px) + shadow 0 4px 12px rgba(26,18,9,.06),
  0 16px 40px rgba(26,18,9,.08). 250ms cubic-bezier(0.23,1,0.32,1).
- Active: scale(0.97).

Content:
- Cover photo fills 1:1.
- Top-right overlay: coral heart button (outline default, fills on click
  with spring bounce stiffness 500 damping 20, 300ms).
- Top-left overlay: availability pill — green "Verfügbar heute" or amber
  "Nur noch 2 Plätze" or grey "Ausgebucht bis [date]".
- Below photo: padding 16px.
  - Salon name: Syne 700, 18px, s-ink.
  - Category pills: .glass-pill style, s-ink/70 text, 12px DM Sans.
  - Rating: filled yellow star + DM Sans data-text tabular-nums "4.8 · 247".
  - Neighborhood: DM Sans 14px, s-ink/60.

No gradient overlay on photo. No "From CHF X" sticker. No animated icon
on hover. Card lifts; everything inside stays still.
```

### 12.4 The Color / Mood Refiner

Use when output looks almost right but feels cold:

```
The design is technically correct but feels sterile. Make it feel like
late afternoon in a Swiss Mediterranean-adjacent city. Warm the page:
shift background to cream #FAF6EF, add a subtle warm radial gradient
behind the content (coral 5% bottom-left, amber 4% top-right), warm
every shadow to rgba(26,18,9,x), and make sure the ink color is warm
brown #1A1209 not pure black. Keep all other decisions.
```

---

## 13. Feel → Token Map (for Engineers Translating a Design)

When a designer says something feels a certain way, here's which design token delivers it:

| Designer says | Engineer uses |
|---|---|
| "Warm shadow" | `shadow-elevation-1/2/3` (already `rgba(26,18,9,x)`) |
| "Coral glow on CTA" | `shadow-coral-glow` + `shadow-coral-glow-hover` |
| "Soft corner" | `rounded-card` (16px) for cards, `rounded-btn` (99px) for CTAs |
| "Pill" | `rounded-pill` (9999px) |
| "Cream page" | `bg-s-bg-base` (#FAF6EF) |
| "White card" | `bg-s-bg-raised` (#FFFFFF) |
| "Warm dark" | `bg-s-dm-bg` (#151009) |
| "Warm ink" | `text-s-ink` (#1A1209) |
| "Muted text" | `text-s-ink/60` for body, `/40` for disabled |
| "Editorial heading" | `font-heading` (Syne, 700) |
| "Confident display" | `font-display` (Bebas Neue, uppercase, ≥36px) |
| "Clean body" | `font-body` (DM Sans, 400) |
| "Tabular numbers" | `data-text` class |
| "Ambient glow behind section" | `.ambient-v5` class |
| "Frosted header on scroll" | `.glass-frost` |
| "Interactive filter pill" | `.glass-pill` + active state `.glass-pill-active` |
| "Polaroid lift on hover" | `hover:-translate-y-[4px] hover:shadow-elevation-3 transition-[transform,box-shadow] duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)]` |
| "Tiny yes on tap" | `active:scale-[0.97]` |
| "Stagger cards in" | `containerVariants` + `itemVariants` from `lib/animations.ts` (60ms apart) |
| "Modal opens softly" | `modalVariants` from `lib/animations.ts` (200ms EASE_SOLEN) |
| "Bottom sheet slides" | `sheetVariants` from `lib/animations.ts` (300ms EASE_DRAWER) |
| "Heart bounces" | `EASE_BOUNCE` spring from `lib/animations.ts` |
| "Hero has a drifting shape" | Blob (see §5.3 CSS) — Marketing mode only |
| "Section has breathing space" | `py-12` (48px) vertical rhythm, multiples of 8 |
| "Subtle divider" | Whitespace or `border-s-ink/5`, rarely a wavy SVG divider |

**Never use**: anything not in this table without first proving the feel in `BRAND_BRIEF.md` or getting sign-off.

---

## 14. When to Update This File

You update `BRAND_BRIEF.md` (this file) when:
- A new color, font, or visual motif joins the palette
- A new reference brand anchor is identified (e.g., "now we're also leaning into X")
- A recurring slop pattern is spotted across multiple agents/generations (add to §11)
- A new component archetype is designed (add to §10)
- The user rejects a generated design with *"this doesn't feel like Solen"* — capture why

You update `DESIGN_SYSTEM.md` when:
- Tokens change (Tailwind config, CSS variables, animation easing)
- A rule is enforced (banned tokens, pre-commit checks)
- A component contract changes (props, modes)

**Two files, two jobs.** Brief = soul. System = rules. Both must stay true. If they drift, the one the user reacts to more positively is the one that wins — usually the brief, since it's harder to fake charm than to fake a ruleset.

---

## Summary

Solen isn't a color palette + a font stack + a rule list. It's a warm Mediterranean room translated to pixels. Every choice — coral over grey, cream over white, warm shadow over pure black, Bebas over system-ui, 60ms stagger over 30ms, polaroid lift over scale bounce, ambient blob at 6% over decorative gradient at 40% — is a small act of resistance against generic AI slop.

**Paste §1 + §2 + §3 + §11 into Claude Design and you'll get Solen work, not SaaS work.**

If you're still getting slop, the brief isn't strong enough — come back here and add specificity.



