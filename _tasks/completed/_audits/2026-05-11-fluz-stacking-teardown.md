# Fluz · /us/stacking · Site Teardown

> Reference URL: https://fluz.app/us/stacking/
> Captured: 2026-05-11
> Full-page screenshot: `_audits/fluz-stacking-fullpage.jpeg` (1440 × 11252px)
> Viewport for measurements: 1440 × 900px desktop

A pixel-accurate teardown of Fluz's stacking landing page. Every spec below came from `getComputedStyle()` and `getBoundingClientRect()` on the live DOM, not visual interpretation. Use this as the reference when "match Fluz" comes up.

---

## §1 · Typography system

Three font families, deliberately separated by role:

| Role | Font | Where |
|---|---|---|
| **Display headings** | `Greed Condensed SemiBold` | Hero h2, section h3s, FAQ titles, numbered steps, footer column titles |
| **Nav / UI labels** | `Greed-SemiBold` (regular, non-condensed) | Sub-nav (Money / Marketplace / Blog), Personal/Business labels |
| **Body text** | `Area Semibold` (paragraphs), `Area-Extrabold` (footer fine print) | All paragraph copy, footer copyright |

### Type scale (every size measured, sorted big → small)

| Size | Line-h | Letter-spacing | Family | Weight | Usage |
|---|---|---|---|---|---|
| **140px** | 120px | -1.8px | Greed Condensed SemiBold | 700 | "FAQs" section opener (span) |
| **132px** | 116-118px | -1.4px | Greed Condensed SemiBold | 700 | Hero h2 "Stack high. Save big.", "STACKER'S DELIGHT", "Works wherever you work it" |
| **72px** | 72px | -1.728px → -1.2px | Greed Condensed SemiBold | 700 | Section h3 "One app. Many deals.", "It's not Fluz or. It's Fluz and." |
| **40px** | 40px | -0.6px | Greed Condensed SemiBold | 700 | FAQ question titles |
| **24px** | 24-28px | normal | Greed Condensed SemiBold | 400/600/700 | Footer column headings (Company, Explore, Benefits) + numbered step indicators (1, 2, 3) |
| **20px** | 24px | normal | Greed Condensed SemiBold | 700 | CTA button text ("Get started", "Learn how", "Download app") |
| 16px | 20-24px | -0.25 / normal | Greed-CondensedSemiBold / Area Semibold | 700 | Body paragraphs + footer links |
| **14px** | 18px | normal | Greed-SemiBold | 400/700 | Main nav labels (Personal/Business/Platform/Company) + Search/Login pill text |
| 11px | 14-15.4px | normal | Greed-SemiBold / Area-Extrabold | 700 | Sub-nav (Money/Marketplace/Blog), copyright fine print |

### Display behavior rules

- **Tight letter-spacing scales with size**: -1.8px at 140px, -1.728px at 72px, -0.6px at 40px, normal at 24px and below. Roughly `-0.013em` for display, `0` for body.
- **Line-height ≈ font-size for huge headings** (132px / 116-118px line-height = 0.88). Tight stacking creates the dense visual mass.
- **Body line-height 1.5x** (16px / 24px = 1.5).
- **No italic anywhere.**
- **Mostly sentence case** for headings; rare uppercase ("STACKER'S DELIGHT" section opener, "FAQs").

---

## §2 · Color palette

### Text colors (sorted by frequency)

| Hex | RGB | Usage frequency | Role |
|---|---|---|---|
| **`#1A0000`** | rgb(26, 0, 0) | **463** uses | Primary text — dark with red tint (NOT pure black) |
| **`#FFE9E1`** | rgb(255, 233, 225) | **151** uses | Cream / warm-white — highlight text on dark bg |
| `#161616` | rgb(22, 22, 22) | 21 uses | Dark gray secondary |
| `#E3E3E3` | rgb(227, 227, 227) | 15 uses | Light gray (nav text on dark bg) |
| `#FFFFFF` | white | 14 uses | Pure white (CTA button text) |
| `#170100` | rgb(23, 1, 0) | 7 uses | Near-black with red tint (variant of #1A0000) |
| `#D2D2D0` | rgb(210, 210, 208) | 6 uses | Muted light gray |
| `#FFE8E0` | rgb(255, 232, 224) | 5 uses | Cream variant |

### Background colors

| Hex | RGB | Role |
|---|---|---|
| **`#FFF9FE`** | rgb(255, 249, 254) | Default page bg — almost white with hint of pink |
| **`#221919`** | rgb(34, 25, 25) | **Dark header bar** + dark section bgs (warm brown-black, not pure black) |
| `#2F2B29` | rgb(47, 43, 41) | Footer bg — warmer dark gray |
| `#98BBF4` | rgb(152, 187, 224) | Sky-blue accent (likely one specific module) |
| `#F2F2F2` | rgb(242, 242, 242) | Light gray section divider |

### Palette rule (inferred)

Fluz uses a **warm dark / warm cream** palette — no pure black, no pure white. Even the darkest text (`#1A0000`) has a red tint; even the lightest bg (`#FFF9FE`) has a pink tint. Sky blue (`#98BBF4`) appears as a section accent. No green, no purple, no aggressive saturation — the brand vibrancy comes from gradients on CTAs (blue → purple login pill is the exception) and big punchy typography.

---

## §3 · Buttons / CTAs

All CTAs share a uniform geometry:

| Spec | Value |
|---|---|
| Border-radius | `200px` (full pill) |
| Padding | `16px 32px` (vertical / horizontal) |
| Font-size | `20px` |
| Font-family | `Greed Condensed SemiBold`, weight 700 |
| Height | 56px |

### Variants

| Variant | Bg | Text | Used as |
|---|---|---|---|
| **Primary (dark)** | `#000000` | `#FFFFFF` | "Get started" |
| **Secondary (near-dark)** | `#170100` | `#FFFFFF` | "Learn how" |
| **Inverted (light)** | `#FFF9FE` | `#000000` | "Download app" (on dark sections) |

No border, no shadow visible in computed styles. Plain solid pills.

---

## §4 · Page structure

**Total page height: 11,252px** at 1440px wide — a long-form vertical landing page.

Visible chrome (measured earlier):
- Sub-nav strip: y=0 → y=~30 (Money active + green underline)
- Main header bar: y=~30 → y=96 (logo + nav + right cluster)
- Total chrome: **96px**

The 96px chrome is `position: fixed` and stays as the user scrolls.

After the header, ~11 visual sections follow (estimated from the bg-color transition scan):

1. **Hero** — dark `#221919` bg, "Stack high. Save big." 132px display headline
2. **3-step explainer** — cream `#FFF9FE` bg, numbered steps (1/2/3 in 24px Greed Condensed)
3. **"STACKER'S DELIGHT"** — large 132px section divider
4. **Photo + product pair** — JPG photos paired with product transparent PNGs
5. **Use-case grid** — 185×185px PNG square icons (pizza, grocery, TV, sneaker, steering wheel, cloud) with labels
6. **"It's not Fluz or. It's Fluz and."** — 72px section h3 + cream highlight
7. **Stacking deal types** — multiple cashback/coupon/credit examples
8. **FAQs** — 140px "FAQs" opener + 40px question titles in accordion
9. **CTA module** — primary CTAs in dark section
10. **Footer** — `#2F2B29` dark gray, 24px Greed Condensed column titles + 16px links

---

## §5 · Imagery system

- **27 image assets** total (PNG + JPG), 9 SVGs
- **Transparent PNG product photos** — coins, stacking hero illustration, product cutouts (no rectangular crops on hero imagery)
- **JPG photos** — full-bleed photographic content for "stacking item" feature sections (566×627 → 566×675 dimensions, roughly square)
- **185×185 square PNG icons** — category badges (pizza, grocery, sneaker, etc.) — rendered with transparent bg
- **No SVG illustrations of people/objects** — Fluz uses real photographic imagery + cut-out PNGs, not AI-style flat SVG illustrations

This is the **anti-AI-slop principle in action**: real photo assets, not generic SVG vector art.

---

## §6 · Layout & spacing

- **Container max-width** (inferred from header `max-w-[1440px]`): 1440px
- **Page horizontal padding**: 32px on each side at desktop (from `px-8` typical in their design)
- **Inter-section vertical spacing**: ~120-160px between major sections (based on full-page height / 11 sections ≈ 1000px per section, with ~200-400px of headline + content + padding)

The page uses **HUGE vertical whitespace** between sections — sections breathe, headlines dominate.

---

## §7 · "When and how" — usage rules inferred

### Hero pattern
- 132px display headline (Greed Condensed SemiBold, line-height 0.88, letter-spacing -1.4px)
- Dark bg `#221919`, cream text `#FFE9E1` (or inverted: cream bg, dark text)
- Subheadline in 16-20px Area Semibold (much smaller, body color)
- Pair of CTAs (Primary dark + Inverted light) below

### Section divider pattern
- Big standalone 132-140px headline acting as a visual chapter break
- Often single line or 2 lines max
- Negative letter-spacing tight to create "type as architecture"

### Numbered steps pattern
- Big number in 24px Greed Condensed (often colored to match accent)
- Step title in 16-20px Greed Condensed bold
- Description in 16px Area Semibold

### CTA pattern
- Pill shape (radius 200px), 56px tall, padding 16×32
- 20px font-size in Greed Condensed
- Primary = solid dark, Secondary = inverted light, never an outline button visible on this page

### Body copy pattern
- 16px Area Semibold, line-height 1.5 (24px), letter-spacing normal
- Color: `#FFE9E1` cream on dark bg, `#1A0000` red-black on light bg
- Max-width ~600px (eyeballed from screenshot — not measured)

---

## §8 · Anti-patterns Fluz avoids

- **No purple-gradient slop** (their login pill IS gradient but it's brand signature — see "exception" below)
- **No emoji icons** — they use 185×185 PNG illustrations instead
- **No generic stock-photo people** — real product photography + custom cut-out PNGs
- **No 50/50 hero (image right, text left)** — text dominates, imagery is supportive
- **No outlined buttons** — only solid fills

### Exception they own
- Blue → purple gradient on the Login pill IS their signature. On other surfaces they'd be slop; here it's brand.

---

## §9 · Application to Solen

If "match Fluz" is the goal, the levers in priority order:

1. **Three-font system** — display condensed + body humanist sans + label sans. Solen's V3 has Peace Sans + Open Sauce One — that's only two. To get Fluz density we'd need a condensed display font (Anton is the closest free match — already in V3 globals.css per V2-D57).
2. **Type scale ratio** — Fluz jumps 16 → 24 → 40 → 72 → 132 → 140. Solen V3 currently caps around 56-64px display. To match Fluz energy, raise hero/section sizes to 100-130px.
3. **Warm dark, never pure black** — `#221919` not `#000000`. Solen V3 uses `#1F1714` for dark which is already warm. ✓
4. **Long-form vertical layout** — 11+ sections, ~1000px per section. Solen homepage today is ~6 sections. To match: add more chapter-style dividers.
5. **Section dividers using TYPE** — Fluz uses 132px "STACKER'S DELIGHT" as a chapter break with no card / box. Just type as architecture.
6. **CTA pill geometry** — `rounded-full px-8 py-4 text-[20px] font-bold` height 56px. Solen V3 currently uses smaller CTAs.
7. **Real photography + transparent PNG cutouts** — not flat illustrations or icons-only.

---

## §10 · Open questions

- Mobile-specific styles at 375px (extracted separately for header — full mobile teardown not done)
- Hover / focus states (require scripted interaction triggers)
- Section-level heights per visual chapter (bg-scan only catches color transitions, missed the 9+ visual sections sharing cream bg)
- What's the actual Greed font license? (Adobe Originals / commercial-only — would need a free condensed substitute for Solen)

---

## §11 · Spacing system (round 2 — measured 2026-05-11)

Most-used spacing values:

### Gap (flex / grid gap)
| Value | Count | Where |
|---|---|---|
| **`5px`** | 35 | The DOMINANT intra-element gap (tight clustering) |
| `8px` | 12 | Secondary tight gap |
| `4px` | 7 | Tiniest icon-to-text gap |
| `20px` | 2 | Inter-card spacing |
| `28px` | 1 | One-off section gap |
| `6%` | 1 | Percentage-based responsive |

### Margin (bottom-rhythm)
| Value | Count | Role |
|---|---|---|
| **`0 0 24px`** | 24 | Primary text bottom-margin (paragraph rhythm) |
| `0 0 8px` | 8 | Tight bottom margin |
| `0 0 405px` | 4 | Big section break |
| `0 0 30px` | 4 | Medium section break |

### Padding (containers + buttons)
| Value | Count | Where |
|---|---|---|
| `0 13.96px` | 7+6 | Header inner padding |
| `12px 0 0` | 7 | Top-pad on stacked elements |
| **`0 40px`** | 6 | Container side-padding |
| `135px 0 0` | 5 | Hero top spacing (above-fold breathing room) |
| **`16px 32px`** | 4 | Button padding (already in §3) |

**Spacing scale inferred:** 4, 5, 8, 12, 16, 20, 24, 30, 40, 135 — a non-strict scale. No tidy 4px/8px multiples everywhere (some 5/13.96px weirdness from CSS calc). Vertical rhythm is dominantly 24px.

---

## §12 · Border-radius system (THIS IS BIG)

| Radius | Count | Role |
|---|---|---|
| **`20px`** | 12 | **CARDS** — the dominant card radius |
| `200px` | 8 | CTA pill buttons (full-round) |
| `100px` | 7 | Smaller pills / circular badges |
| `31.5px` | 5 | Icon containers (weird half-px value, possibly calc-derived) |
| `30px` | 4 | Medium-radius modules |
| `15px 15px 0 0` | 1 | Top-rounded section (curves only at top edge) |
| `40px 40px 0 0` | 1 | Larger top-rounded section divider |
| `57.6px 57.6px 0 0` | 1 | Very pronounced top-rounded section |

**Insight:** Fluz uses **top-only rounded corners on section dividers** (`15/40/57.6px`) — sections curve UP into the next section like overlapping cards. This is a major visual signature. Solen V3 already does this with `rounded-t-[40px]` on the main content wrapper.

---

## §13 · Motion / transition system

| Transition | Count | Easing analysis |
|---|---|---|
| **`0.3s ease-out`** | 35 | Default for most things — fast + slowing entrance |
| `color 0.3s` | 12 | Color-specific 300ms |
| **`transform 0.65s cubic-bezier(0.05, 0.2, 0.1, 1)`** | 11 | **Custom slow ease for scroll reveals** |
| `opacity 0.3s ease-out` | 4 | Fade-ins |
| `opacity 0.2s 0.1s` | 4 | Fade with 100ms delay (stagger) |
| `border-color 0.15s` | 4 | Fast border-color transitions |
| `transform 0.45s cubic-bezier(0.3, 0.4, 0.2, 1)` | 4 | **Custom quick ease for transforms** |

### Custom easing curves (the taste part)
- `cubic-bezier(0.05, 0.2, 0.1, 1)` — **slow ease-out for scroll reveals** (650ms)
- `cubic-bezier(0.3, 0.4, 0.2, 1)` — **quick ease for transforms** (450ms)

These are **designer-picked custom Bézier curves**, not default `ease-out`. This is the "design engineering" tax that separates premium feel from default. Emil Kowalski territory.

### Duration scale
- **150ms** — fast property transitions (border-color, micro-interactions)
- **200ms** — stagger-delayed fades
- **300ms** — default property transitions (color, opacity, etc.)
- **450ms** — short transform animations
- **650ms** — scroll-reveal transform animations

---

## §14 · Elevation / shadow system

**Result: ZERO box-shadows on the entire page.**

Fluz uses **NO elevation effects**. No card shadows, no hover lifts, no modal drops. Hierarchy comes from:
1. Color contrast (warm dark vs cream)
2. Typography weight + size
3. Whitespace
4. Background color shifts between sections

This is a deliberate brand discipline — flat surfaces, type does the heavy lifting. **Solen V3 currently uses shadows on cards** (`shadow-warm-md`, etc.). If matching Fluz: drop most shadows, lean harder on typography hierarchy.

---

## §15 · Z-index layering

| Z-index | Count | Used for |
|---|---|---|
| `10` | 34 | General section layering |
| `1` | 8 | Stacking within sections |
| `999` | 4 | Modal / dialog layer |
| `-1` | 4 | Background decoration (behind content) |
| **`899`** | 1 | The HEADER element |
| `100` | 1 | Tooltips / popover |

Header z-index of `899` is interesting — high but below modal layer (999). Leaves room for overlays.

---

## §16 · Link styling

All anchor tags have `text-decoration: none` — **no underlines anywhere**. Link indication is purely through color contrast (`#1A0000` red-black on cream gets attention vs body text).

Link colors found (with counts):
- `#1A0000` (39 uses) — primary link color (same as body text — no underline OR color change, just bold weight)
- `#161616` (6 uses) — slightly different dark
- `#787571` (2 uses) — muted gray link (footer fine print)

**Pattern:** Fluz links use **weight + position** to signal interaction, not color or underline.

---

## §17 · Header positioning

- `position: static` (NOT fixed!) — header scrolls away as you go down
- `z-index: 899`
- No `backdrop-filter` — no glass blur effect

**Solen V3 vs Fluz here:** Solen's Header is `position: fixed` (stays visible while scrolling). Fluz's header is `static` (scrolls away). This is a structural difference. To match Fluz exactly we'd change Solen's header to scroll away with content. But fixed/sticky headers are arguably better UX for app-style sites — this might be a place we keep our pattern.

---

## §18 · What this teardown still doesn't capture

Honest list of gaps:

1. **Mobile-specific styles** — only desktop measured. Mobile header structure captured separately (in Solen Header.tsx port), but mobile spacing/typography/layout patterns NOT measured.
2. **Hover / focus / active states** — would need scripted Playwright hover events to capture.
3. **Per-section anatomy** — section heights, alignment, max-widths within each visual chapter. The bg-scan only catches color transitions; on Fluz most sections share cream bg so 9+ structural sections show as one.
4. **Scroll-triggered animations** — the `transform 0.65s cubic-bezier(0.05, 0.2, 0.1, 1)` is clearly used for scroll reveals, but WHICH elements animate and HOW (from where to where) is not captured.
5. **Iconography patterns** — sizes, treatments, when used.
6. **Form / input styling** — none on this page.
7. **Specific content density** — words per line, lines per section, paragraph length conventions.
8. **Asset weights** — image sizes, font subsetting, performance.
9. **Color usage CONTEXT** — `#1A0000` is used 463 times but WHERE specifically? No section-level color mapping.
10. **Specific transform usage** — `transform 0.65s` is used for scroll reveals, but the actual transform values (translateY? scale? rotate?) aren't captured.

To capture the missing items would require: a second mobile pass at 375px, a scripted hover sequence, a section-by-section visual walk, and a scroll-trigger replay. The next iteration of `site-teardown` skill should add these.
