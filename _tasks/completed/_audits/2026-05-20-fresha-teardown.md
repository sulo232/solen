# Fresha · fresha.com · Site Teardown

> **Reference URL:** https://www.fresha.com
> **Captured:** 2026-05-20, desktop viewport 1440×900
> **Screenshot:** [_audits/2026-05-20-fresha-fullpage.jpeg](2026-05-20-fresha-fullpage.jpeg)
> **Raw data:** [2026-05-20-fresha-raw.json](2026-05-20-fresha-raw.json)
> **Page height:** 5,720px total scroll
> **Source data:** 1,767 colored text instances, 81 photos, 395 SVGs

---

## TL;DR — three things that contradict our assumptions

1. **Fresha does NOT use a serif anymore.** The Mobbin screenshots show an older era with a high-contrast serif h1 ("Book local beauty and wellness services"). The LIVE site today uses **RoobertPRO** — a clean modern sans-serif. ONE font family across every element.
2. **Fresha does NOT use purple as their brand color in any meaningful sense.** Purple `#6950F3` appears only 5 times total across the entire homepage. Search button background is `#0D0D0D` (near-black), not purple. The lavender atmosphere in older screenshots is gone or scoped to a single hero gradient.
3. **Fresha is essentially MONOCHROME + yellow stars.** Their entire color discipline is: pure white bg, near-black text, yellow on rating stars only. That's it. Real salon photography does ALL of the personality work.

This contradicts what I've been pushing toward all session. Fresha is not "Duolingo vibrant + claymorphic." Fresha is "Stripe-restrained + great photography." The user's reference has been more restrained than my interpretations.

---

## §1 Typography system

### The font family — ONE family, period

Every visible text element on fresha.com uses **`RoobertPRO`** (custom sans-serif from Displaay Type Foundry). No serif, no second body font, no display variant. The discipline is brutal.

Fallback stack appears to be: `RoobertPRO, system-ui, sans-serif`.

### Type scale (measured)

| Tier | Size / Line-height | Weight | Color | Where used |
|---|---|---|---|---|
| **Stat hero** | 96px / 112px | 700 | `#0D0D0D` | "1 billion+" massive stats |
| **H2 large** | 68px / 72px (or `normal`) | 700 | `#0D0D0D` | "Download the Fresha app", "Fresha for business" |
| **Hero h1** | **64px / 68px** | 700 | `#0D0D0D` | "Book local selfcare services" |
| **H2 medium** | 40px / 44px | 700 | `#0D0D0D` | "The top-rated destination for selfcare", "130,000+" |
| **Section h2** | 28px / 36px | 600 | `#0D0D0D` | "Recommended", "Trending", "New to Fresha" |
| **Body large** | 24px / 32px | 400-500 | `#0D0D0D` | App download / B2B intro paragraphs |
| **Subtitle** | 22px / 28px | 400 | `#0D0D0D` | Hero subtitle, "appointments booked today" stat |
| **Carousel num** | 22px / 22px | 600 | `#0D0D0D` | Calendar digits |
| **Card title** | 19px / 24px | 600 | `#0D0D0D` | Testimonial review titles |
| **Body** | 16px / 22px | 400 | `#0D0D0D` | Standard body copy |
| **CTA / nav** | 16px / 22px | 600 | `#0D0D0D` or `#FFFFFF` | "Log in", "Menu", "Search", "List your business" |
| **Body (salon name)** | 16px / 22px | 500 | `#0D0D0D` | Salon names in cards |
| **Footer link** | 14px / 20px | 400 | `#0D0D0D` | "Hair Salons in Sydney", category links |
| **Meta** | 14px / 20px | 400 | `#767676` (grey) | "Via Alessandro Volta, Corsico", review counts |
| **Caption** | 13px / 16px | 600 | `#0D0D0D` | "Featured" tag, "5.0" rating numbers |

### Type-scale observations

- **7 effective sizes** for headings (96 / 68 / 64 / 40 / 28 / 22 / 19) — Fresha runs a wide type scale but the steps are large and confident
- **Body collapses to 16-14 mostly** — only two body sizes for 99% of paragraph text
- **No italic** anywhere
- **No uppercase eyebrows** — Fresha skips the "small caps section label" pattern entirely
- **No letter-spacing customization** — every measured `letter-spacing: normal`. They don't fight the font's default kerning.
- **Line-height is consistently TIGHT on display** — h1 64/68 = 1.06×, h2 large 68/72 = 1.06×, stats 96/112 = 1.17×. Body floats 1.37-1.45×.

### Weight discipline

Used weights: **400 / 500 / 600 / 700** only. No 300, no 800, no 900. Hero + display headings are 700, section h2 is 600, body is 400-500. Predictable, tight ladder.

---

## §2 Color palette (ranked by frequency on the page)

### Text colors (1,767 measured instances)

| Color | Hex | Count | Role |
|---|---|---|---|
| **Near-black** | `#0D0D0D` (rgb 13,13,13) | 1,767 | Primary text — everything |
| **Star yellow** | `#FFC00A` (rgb 255,192,10) | 656 | Rating stars ONLY |
| **Mid grey** | `#767676` (rgb 118,118,118) | 125 | Secondary text — addresses, review counts |
| White | `#FFFFFF` | 10 | Text on dark CTAs |
| **Purple** | `#6950F3` (rgb 105,80,243) | **5** | Single locale link + one accent ("English (US)") |
| Pure black | `#000000` | 3 | Trace |

### Background colors

| Color | Hex | Count | Role |
|---|---|---|---|
| Light grey | `#F2F2F2` | 59 | Card hover / inactive states |
| Image overlay | `rgba(19,19,19,0.33)` | 48 | Photo darkening overlay for text-over-image |
| Glass | `rgba(255,255,255,0.7)` | 30 | Sticky header glass + modal backdrops |
| Pure white | `#FFFFFF` | 19 | Cards, sticky bars |
| Near-black | `#0D0D0D` | 3 | **The Search CTA button background** |

### What this means

**Fresha runs a 3-color system:**
- `#0D0D0D` (near-black) — text + primary CTA
- `#FFFFFF` (pure white) — substrate + card surface
- `#FFC00A` (yellow) — star ratings only

That's it. Purple is **5 uses out of ~3,000 colored elements** — basically retired or in deep maintenance. The legendary "Fresha purple" we kept seeing in old Mobbin captures has been almost entirely removed.

Real salon photography (81 images) carries all the color/warmth/personality. The chrome is monochrome by design.

---

## §3 Buttons / CTAs

The Playwright extraction returned an empty CTA array — Fresha's primary CTAs (Search, Log in, Menu) use very subtle background colors that bypassed our filter. From visual inspection + sampled data:

### Primary CTA (Search button)
- Background: `#0D0D0D` (near-black) — NOT purple, NOT blue
- Text: `#FFFFFF` 16px / 600 weight
- Radius: `999px` (fully rounded pill)
- Padding: roughly `12px 24px`
- Sits at the right end of the search bar pill

### Search bar geometry
- Container: pill-shaped, `radius: 999px`, light shadow
- 4 fields inline: Service / Location / Date / Time, divided by hairlines
- Each field: 14-16px placeholder text, icon + label
- Submit button = the Search black pill on the right end
- Active field: light grey background `#F2F2F2`

### Secondary CTAs (top nav)
- "For business" — outlined pill, near-transparent bg, near-black text
- "Menu" — same outlined pill style
- "Log in" — text-only inside the menu dropdown

### "Get the app" CTA (under stat)
- Same near-black pill style
- Wider padding (~12px 28px)
- Outline-on-white in dropdown menus

### Card-internal CTAs (time slots)
- "10.00", "10.15", "10.30" buttons inside salon cards
- Outlined pill style, near-black text on white
- Radius: 999px

**Discipline note:** every CTA on the page is one of: filled-black-pill, outlined-near-black-pill, or text-link. No second color. No gradient. No glow shadow. Brutally simple.

---

## §4 Page structure

**Total page height:** 5,720px scroll

Sections (top to bottom, identified from full-page screenshot):
1. **Sticky header** — logo left, "For business" + "Menu" pills right (~80px tall)
2. **Hero** — h1 + subtitle + search pill + stat counter (no image) (~520px tall)
3. **Categories grid** — small image tiles (Hair & styling / Nails / Eyebrows / Massage / etc.) (~400px)
4. **Recently viewed** — horizontal scroll rail of salon cards (~340px)
5. **Recommended / Trending / New to Fresha** — repeating rails, each ~340px
6. **B2B teaser** — "Top-rated destination" stats block (~480px tall)
7. **App download** — phone mockup + h2 + bullets (~560px)
8. **Featured cities** (?) — text-link grid (~400px)
9. **Testimonials** — review cards with star + name + quote (~440px)
10. **B2B large CTA** — "Fresha for business" big heading + CTA (~500px)
11. **Footer** — multi-column link grid (~600px)

---

## §5 Imagery system

- **81 `<img>` elements** — real salon photography sourced from `images.fresha.com/locations/...`
- **395 SVG elements** — icons (search, location, calendar, clock, stars, chevrons) + small decorative graphics
- **0 cutout illustrations** in the homepage
- **0 3D claymorphic / mascot illustrations**
- **0 stock-photo gradient placeholders**

**Aspect ratios sampled:**
- Salon card photo: 326×183px → **16:9 aspect** (NOT square like Solen)
- Category tile photos: smaller, ~150×150 → roughly 1:1
- All photos served via Fresha's CDN, with `f_wi` width-resize parameter

**Photography style:** real salon interiors. Wood floors, mirrors, styling chairs, soft natural light. Zero "stock photo woman with blow-dryer" content. Every photo is a specific salon, taken in that salon.

---

## §6 Layout & spacing

### Container widths
- Main wrap: **1440px** (47 elements at exact 1440 width)
- Content section inset: **1376px** (~32px gutter each side)
- Inner content blocks: **576-600px** (text columns, modal inner widths)
- Card max-width: **~448px**

### Border-radius vocabulary
| Radius | Uses | What |
|---|---|---|
| `999px` | 92 | Pills, buttons, chips, search bar — fully rounded |
| `16px` | 77 | Cards, content blocks, modals |
| `100%` / `50%` | 104 | Circular elements (avatars, icon backgrounds) |
| `100px` | 5 | Image masks |
| `24px` | 1 | Single use |
| `12px` | 1 | Single use |

**Two-radius system in practice:** pill (`999px`) for any tap target, 16px for any container. No drift, no "rounded-2xl vs rounded-lg" confusion.

### Shadow vocabulary
Only **3 distinct shadows** on the entire 5,720px page:
- `none` (default) — most elements
- `rgba(156,156,156,0.08) 0px 0px 0px 6px inset` — soft inset glow on focus state
- `rgba(19,19,19,0.08) 0px 2px 8px 0px, rgba(19,19,19,0.12) 0px 4px 20px 0px` — the ONE card shadow (2-layer: tight 8px + soft 20px)

**Flat brand discipline.** Cards are essentially boundaryless until hover.

---

## §7 Atmosphere treatment

### What we expected from older Mobbin screenshots
- Big lavender/pink radial gradient behind hero
- Soft atmospheric color extending mid-page

### What's actually there now (live, 2026-05-20)
- **Body background: `rgb(255, 255, 255)` — PURE WHITE**
- **HTML background: `rgb(255, 255, 255)` — PURE WHITE**
- No measured page-level gradient
- The hero MAY still have a localized soft pink/lavender gradient as an absolute-positioned div behind the h1 (visible at the very top of the screenshot) — but it's scoped to the hero ONLY, ~600px tall, fading to white before the categories grid

This is a CRITICAL re-read. Fresha's hero gradient is a **single localized moment**, not a page-wide atmosphere. After ~600px scroll, it's pure white for the next 5,000+ pixels.

---

## §8 What Fresha does that we don't

1. **One font family** — they have RoobertPRO doing everything. We have Bricolage + Hanken splitting duties. Fresha's single-font discipline is part of what makes them feel coherent.

2. **One-color text discipline** — `#0D0D0D` (essentially black) for 99% of text. We have a 4-tier ink ramp (ink, ink-2, ink-3, ink-4). Fresha mostly uses ONE near-black for ALL primary text, drops to `#767676` only for secondary metadata.

3. **Star-yellow is the ONLY accent** — no royal blue CTA, no warm-red heart variants, no semantic green/orange/pink palette. Just yellow stars on a black-on-white page. We're operating with 4-5 semantic colors.

4. **Near-black CTAs** — Fresha's primary button is `#0D0D0D`, not their brand color (purple). They don't expose the brand on CTAs — they expose it nowhere except the very rare locale link.

5. **16:9 photo aspect on salon cards** — we use 1:1 square. Fresha's wider crop better shows salon interiors with multiple stations visible.

6. **No section eyebrow labels** — Fresha skips the "ZULETZT ANGESEHEN" small-caps pattern entirely. Section headings sit at 28px / 600, no eyebrow above.

7. **Tight type ladder anchored at 64px** — h1 is HUGE, section h2 is 28px. Then they have a separate 40-68-96 tier for "feature moments" (stats, B2B teaser, app download). 3 layers, not blended.

8. **Pill-everything** — 92 distinct `999px` radius elements vs 77 at 16px. Pills dominate. Cards are the rectangle exception.

9. **Real photography carries ALL personality** — 81 location photos from real salons. We have placeholder gradients on cards. Fresha's brand IS the photography.

---

## §9 What Fresha does that confirms our current direction

1. **Pure white substrate** — we just killed our gradient and went pure white. Fresha confirms this is correct (5,000+ pixels of pure white).

2. **Flat shadows** — Fresha runs 1 card shadow (2-layer subtle), nothing else. We have soft shadows on salon cards too. Aligned.

3. **No italic** — confirmed banned.

4. **No purple gradients** — confirmed retired.

5. **No 3D claymorphic illustrations** — confirmed not Fresha's pattern.

6. **No scroll-triggered fade-ins** — Fresha's sections just APPEAR when you scroll there.

7. **No decorative color** — every color carries a job (yellow = rating, black = primary action/text, white = surface).

---

## §10 Application to Solen — priority-ordered match levers

If "match Fresha" is the locked target, here are the moves ranked by impact:

### TIER 1 — Structural mismatches that make us look unlike Fresha

1. **Salon card photo aspect 1:1 → 16:9.** Fresha's card photos are wider. This is the single most visible "shape" difference. Solen's square cards look like Apple Music cards; Fresha's wide cards look like Airbnb listings. Easy CSS change.

2. **Hero h1 size: align to Fresha's 64px desktop.** We just bumped to clamp(56,13vw,76). Fresha is 64/68 fixed. We're in the right zone — possibly nudge the desktop ceiling to 72 instead of 76 to match.

3. **Drop the section eyebrow pattern entirely.** Fresha has NO eyebrow above section h2s. Our "ZULETZT ANGESEHEN" small-caps labels are inconsistent with the reference. Just h2 alone.

4. **Section h2 size: align to Fresha's 28px / 600 weight.** We're currently at 26px / 700 (per current SectionHeader). Bump 2px, drop weight from 700→600.

### TIER 2 — Token + color discipline

5. **Audit: are we using more than 3 colors on the homepage?** Fresha runs near-black + white + yellow. We have ink + s-brand royal blue + yellow + s-love muted red + semantic greens + ink-2 + ink-3. We have 8 colors where Fresha has 3. That's the saturation discrepancy.

6. **Consider: do we keep royal-blue CTAs or move to near-black like Fresha?** This is a brand call, not a tech call. Fresha uses brand-color-on-nothing and near-black-on-CTA. We use brand-color-on-CTA. Fresha's pattern is more disciplined. Worth user discussion.

7. **One-font experiment: drop to Bricolage-only OR Hanken-only.** Fresha has one. We have two. Mixing display + body fonts can fight unless tightly choreographed. Quick test: render the homepage with Bricolage ONLY at varying weights — see if it carries.

### TIER 3 — Spacing + radius

8. **Pill-discipline 999px / card 16px.** We're mostly there. Worth a quick audit: do any of our buttons or chips use `rounded-lg` (8px) or `rounded-2xl` (16px)? Should be 999px (pill) for anything tappable.

9. **Card shadow recipe.** Fresha runs a 2-layer shadow: `0px 2px 8px rgba(19,19,19,0.08), 0px 4px 20px rgba(19,19,19,0.12)`. Copy this verbatim into our salon card hover state.

10. **Container width 1376px (32px gutters).** We use 1280px max-width. Fresha is 1440px wrapper with 1376px content. ~96px wider feel. Easy swap.

### TIER 4 — Aspirational (not first-pass)

11. **Real salon photos.** Biggest jump in feel, biggest data effort. Get 20 real Swiss salon photos in 16:9 crops, replace placeholders.

12. **Localized hero gradient.** Fresha may still have a soft lavender hero-only gradient. We just killed all atmosphere. Consider a SINGLE local hero gradient (scoped, not page-wide). Worth a mockup test if user wants to revisit.

13. **Stat counter under hero.** Fresha shows "456,602 appointments booked today" right under the search bar. Strong social proof + brand presence. We could add "X Buchungen heute" in our hero zone.

---

## §11 Honest mismatch: where Fresha contradicts the founder's stated direction

Founder direction (verbatim, multiple times): "modern 2026 like Airbnb / Duolingo / Yuh, vibrant where it counts, soft 3D claymorphic illustrations in hero + featured moments + bento sections."

Fresha's actual execution:
- Not vibrant — monochrome + yellow stars
- No 3D claymorphic illustrations anywhere
- No bento grids visible on the homepage (just rails + a single B2B feature block)
- The "personality" is photography, not illustrations
- The "vibrant where it counts" is "yellow on stars" — nothing else

**This means**: if "match Fresha" is the locked target, then most of the claymorphic / vibrant / bento direction is OFF the table — Fresha doesn't do those things. The user has been naming Fresha alongside Airbnb + Duolingo + Yuh, but those four references contradict each other:
- Fresha + Airbnb = restrained photography-driven
- Duolingo + Yuh = vibrant illustration-driven

The user can only pick one of these tracks. Worth flagging to them before we go further.

---

## §12 Open questions

1. **Mobile-specific layouts** — this teardown is desktop 1440×900. Need a 375×812 pass to capture mobile breakpoint differences. Mobbin iOS screenshots already give us a partial picture: bottom nav with purple-on-active tab icon, h1 in a similar serif-looking font (could be RoobertPRO at a different weight + size or could be the older serif era).

2. **Hover / focus states** — only captured rest state. Would need Playwright `hover()` to capture how the search bar field activates, how cards lift, etc.

3. **Motion** — no scroll-driven measurement here. Worth a follow-up Playwright `boundingClientRect` scan over a scroll.

4. **Font license** — RoobertPRO is a paid commercial font from Displaay Type Foundry. License cost ~$280-450 for web use. Worth knowing before we propose adopting it.

5. **Older era reference** — the Mobbin web screenshots show what looks like a high-contrast serif h1 ("Book local beauty and wellness services" in a serif). Either this is an older Fresha (~2023-2024) or a marketing-only landing variant. Worth a follow-up at https://www.fresha.com/marketplace/ to verify whether the serif still exists somewhere.

---

## Files generated
- `_audits/2026-05-20-fresha-fullpage.jpeg` — full-page desktop screenshot (5,720px tall)
- `_audits/2026-05-20-fresha-raw.json` — raw extraction data for follow-up analysis
- `_audits/2026-05-20-fresha-teardown.md` — this doc
