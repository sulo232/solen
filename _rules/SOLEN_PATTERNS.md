# Solen V3 — Patterns + Fresha translation playbook

> **Operational playbook for any new V3 surface.** Distills what we built on the homepage into reusable patterns + concrete rules + a Fresha→Solen adaptation guide. Auto-loaded by Claude on session start via `CLAUDE.md` "Topic-specific rules" table.
>
> **Hierarchy:** `_tasks/SOLEN_LIVE_TRUTH.md` is the principal *spec* doc (surface-level §15/§16/§17/§18 patterns + §5h color law). This file is the *playbook* — how to apply those locked specs to new surfaces. When the two disagree, LIVE_TRUTH wins.
>
> Last updated 2026-05-10 after V2-D49 series.

---

## Part 1 — The Solen V3 operating system

### 1.1 Brand foundation (V2-D48 Earthen Wellness Light, locked 2026-05-09)

- **Substrate:** cream `#F5EBDD` (`s-bg-base`). Body bg, hero bg. ~85% of viewport coverage.
- **Brand:** emerald `#1F5C42` (`s-brand`). Mid `#0F3D26` for hover. Deep `#0A2917` for active.
- **Accent:** terracotta `#C97A57` (`s-accent`). Deep `#8E4A2D` for hover.
- **4 cat colors:** Coiffeur=cream/terracotta, Barbershop=bone/ink, Nails=sage-pale/terra-deep, Spa=emerald-subtle/emerald-deep.
- **Atmosphere:** body radial gradients (earth-tone) + 7 organic blurred AtmosphereBlobs + AtmosphereGrain (SVG noise) + center white wash for reading clarity (V2-D49h).
- **Locked at:** `_tasks/SOLEN_LIVE_TRUTH.md` §1, §2, §5g, §5h.1.

### 1.2 The color rule (THE law — §5h principle 9 + §5h.2, V2-D49j 2026-05-10)

**Emerald = action. Terracotta = heartbeat. Never invert.**

- Emerald `s-brand` ONLY on: primary buttons, primary links, see-all pills, focus-visible outlines, success/check glyphs, active chip states. Heart-saved is the universal-semantic exception (love-red `#FF4A6B`).
- Terracotta `s-accent` ONLY on: 1-2 highlight words inside h1/h2 display text, logo dot accent, eyebrow leading-dot. **Never on buttons. Never on links. Never on glyph backgrounds.**
- Sage retired from CTA-adjacent (low contrast vs cream).

### 1.3 Typography (V2-D42, locked 2026-05-09)

- **Display:** Peace Sans (cdnfonts) — h1 hero, logo wordmark, footer giant cropped wordmark.
- **Body/UI:** Open Sauce One (cdnfonts) — section h2, eyebrows, body text, buttons, microcopy.
- **Section h2:** `clamp(22px, 3.5vw, 38px)` font-black tracking-[-0.02em] leading-none.
- **Tracking-normal everywhere** — Peace Sans's chunky letters break at negative tracking.
- Inter via Google Fonts as cdnfonts-failure fallback.

### 1.4 Spatial rhythm (V2-D49 series)

- **Section spacing:** `mb-1 md:mb-2` (4/8px) between feed sections.
- **Section frame inner padding:** `px-3 md:px-4`.
- **Section outer:** `max-w-[1280px] mx-auto px-1 md:px-3`.
- **ScrollRow:** `gap-3` (default), `gap-3 md:gap-4` only where scroll arrows are present.
- **Hero:** `pt-[100px] md:pt-32 min-h-[70vh] md:min-h-[78vh]` — vertical centering.
- **No 80px+ gaps between feed and footer** — V2-D49n-fu7: FeedZone pb shrunk to `pb-4 md:pb-6` so feed flows directly into footer's emerald rising panel, no cream void in between.

### 1.5 Atmosphere layer

- **Body wash** (`globals.css` `body::before` / `body::after`) — earth-tone radial gradients + white center radial `rgba(255,255,255,0.45)` for reading clarity (V2-D49h).
- **AtmosphereBlobs** (`AtmosphereBlobs.tsx`) — 7 organic blurred blobs in mix-blend-multiply, fixed inset-0.
- **AtmosphereGrain** — SVG feTurbulence noise, opacity ~0.05.

---

## Part 2 — The pattern library (everything we shipped, with file paths)

### 2.1 Header (`app/[locale]/_components/layout/Header.tsx` — V2-D49d)

- Logo `Solen` + terracotta dot accent.
- **Inline category strip** in the same row: text-only, scrollable horizontally on mobile with `mask-image` edge fade, centered on desktop.
- 4 categories: Coiffeur · Barbershop · Nails · Entdecken.
- Right cluster: `Über uns` text link + `Anmelden` emerald CTA (md+) + hamburger (mobile).
- `bg-transparent py-5` baseline; frost-on-scroll variant when scrollY > 30.

### 2.2 Hero (`app/[locale]/_components/homepage/Hero.tsx`)

- Eyebrow with terracotta leading dot.
- H1 in Peace Sans `clamp(26px, 4.5vw, 58px)` font-black leading-[1.15] tracking-normal.
- One terracotta heartbeat word (`<span className="text-s-accent">buchen</span>`).
- SearchBar mounted inside.

### 2.3 SearchBar (`app/[locale]/_components/homepage/SearchBar.tsx` — V2-D49)

- 3-segment morphing pill (Service / Stadt / Zeit). Dynamic Island animation: `cubic-bezier(0.22, 1, 0.36, 1)` 0.5s morph, 0.1s stagger crossfade.
- Tap segment → expanded picker w/ backdrop dim + body scroll lock.
- **Service picker:** chips with category icons (Scissors Coiffeur, Sparkles Nails, Leaf Spa, Hand Massage, Footprints Pediküre, Palette Färben).
- **Stadt picker:** "Aktueller Standort" pill (Navigation icon in emerald circle) + 8 Swiss city chips.
- **Zeit picker:** Calendar primitive (single-date) + period-of-day chips with Sunrise / Sun / Sunset / Moon icons.
- Submit handler builds `URLSearchParams` and routes to `/[locale]/search?service=X&city=Y&date=Z&period=T`.

### 2.4 Section pattern (`SectionHeader.tsx` — V2-D49m)

All section primitives are exported from `app/[locale]/_components/homepage/SectionHeader.tsx`:

- **`<FeedZone>`:** page-level wrapper used by `app/[locale]/page.tsx` to enclose all feed sections. White-glass bg `bg-white/45 backdrop-blur-[22px] backdrop-saturate-[1.6]`, rounded top corners (`rounded-t-[28px] md:rounded-t-[40px]`), `-mt-6 md:-mt-8` overlap onto the hero. Bottom padding `pt-2 pb-4 md:pt-4 md:pb-6` (V2-D49n-fu7).
- **`<Section>`:** per-section outer wrapper, `max-w-[1280px] mx-auto px-1 md:px-3 py-2 md:py-3 mb-1 md:mb-2`.
- **`<SectionFrame>`:** inner padding wrapper `px-3 pt-1 pb-4 md:px-4 md:pt-2 md:pb-4` + `overflow-hidden`.
- **`<SectionTitle>`:** h2 + scroll-arrow controls.
  - Mobile: bare ArrowRight icon (no circle), tappable to see-all.
  - Desktop: 2 emerald-on-cream `<ScrollCircleButton>` instances, `scrollBy(clientWidth × 0.8, smooth)`, smart disabled state via `ResizeObserver` + scroll listener.
  - Falls back to text link when `scrollRef` not provided.
- **`<ScrollCircleButton>`:** desktop scroll-control button helper (white bg, emerald icon on hover, opacity-30 when disabled).
- **`<ScrollRow>`:** `forwardRef<HTMLDivElement>`, scroll-snap-x, hidden scrollbar, negative-margin bleed `-mx-3 md:-mx-5` matched by `scroll-padding`.

### 2.5 SalonCard + HeartButton (`SalonCard.tsx` + `HeartButton.tsx`)

- Width 150px mobile / 180px desktop.
- aspect-square photo, rounded-[14px].
- Curation/discount badge top-left (frosted-glass).
- Availability pill bottom-left (frosted-glass).
- HeartButton top-right: **outline-only glassmorphic** (V2-D49e) — translucent white stroke `rgba(255,255,255,0.9)` + dual drop-shadow (dark below + thin white sheen). No surrounding circle. Saved state: love-red fill + opaque love-red stroke + spring-pop animation.
- Frosted-glass info pill BELOW photo: name + rating row, then service/availability row.
- Universal glass formula §16.3.0: `rgba(<hue>, 0.22)` bg + `rgba(<hue>, 0.32)` border + `backdrop-blur(14px)`.

### 2.6 FeaturedStylists (`app/[locale]/_components/homepage/FeaturedStylists.tsx`)

- Circular avatars 110px mobile / 130px desktop.
- `ring-2 ring-white` (V2-D49 thinning).
- Rating pill bottom-right (Star icon + 4.9).
- Verb-first action title ("Lass dich verwöhnen.").
- Wrapped in SectionFrame for alignment with other sections.

### 2.7 Entdecken (`Entdecken.tsx` — V2-D49g, ported from pre-V2 canonical)

- Vertical 9:16 portrait cards, `w-[44vw] max-w-[200px]`.
- **Center-zoom carousel** — active card scale-1.03 opacity-100, neighbors scale-0.88 opacity-60.
- Source pill top-left (warm gold `#C99B6A` glass): `Hair · TikTok`.
- Heart + Bookmark grouped in ONE glass pill top-right (mobile-always-visible, desktop-hover-only).
- Centered play button (white-glass, `bg-white/25 backdrop-blur-sm`).
- Style-name pill bottom (hover-only desktop).
- Final "Alle entdecken" CTA card with arrow.

### 2.8 Reviews / TestimonialsColumn (`Reviews.tsx`, `TestimonialsColumn.tsx`)

- 3-col vertical marquee, `motion.translateY -50%` linear infinite loop.
- **Split-tap card** (V2-D49l): full-card overlay button (opens review modal — Phase 2 stub) + inner salon-name link with `stopPropagation` (jumps to `/salon/[slug]`).
- Salon link styled as emerald pill: Store icon + name + ChevronRight.
- Avatar + person name + meta on author row.
- Mask-image fade top/bottom hides marquee boundaries.

### 2.9 SalonRegister B2B (`WhySolen.tsx`)

- Cream card with emerald 1.5px border, `rounded-[28px] md:rounded-[40px]`.
- Image: `aspect-[16/9]` mobile / `aspect-square` desktop. Hidden on mobile (V2-D49k — image carries no info on mobile, the floating stat card was already desktop-only).
- 3 emerald check bullets (V2-D49j fix — was sage, retired).
- Emerald CTA "Salon registrieren" (V2-D49j fix — was terracotta, mis-keyed).

### 2.10 Footer / negative-footer (`Footer.tsx` — V2-D49n)

- Full-bleed, no card framing.
- **Top:** emerald rising panel with rounded top corners (`rounded-t-[28px] md:rounded-t-[40px]`). Mobile 140px / desktop 260px height.
- Cropped giant `solen` wordmark in Peace Sans `clamp(140px, 24vw, 260px)`. `bottom: -18%` + `overflow-hidden` does the cropping.
- Outer wrapper `bg-white/45 backdrop-blur-[22px]` matching FeedZone — corners' rounded cutouts reveal glass not cream (V2-D49n-fu8).
- **Body** (white): 5-col desktop / 3-col mobile (brand col-span-3 + 3 link cols side-by-side). Brand col holds tagline + Newsletter form + social icons.
- 4 link cols: Solen / Hilfe / Versprechen / SolenStamp (round emerald badge with curved SVG `<textPath>` "SOLEN · SCHWEIZ · 2026").
- Legal bottom row: copyright + 4 legal links.
- FeedZone above tightened to `pb-4 md:pb-6` — flows directly into footer with no cream gap.

### 2.11 Cookie banner (`CookieConsent.tsx` — V2-D49o)

- **Mobile:** rounded floating card with margin from edges, `rounded-3xl`, soft shadow all sides.
- **Desktop:** full-bleed bottom strip.
- Cookie glyph (lucide `Cookie`) in peach circle (`bg-s-accent/15`).
- Title + subtitle.
- Settings icon button (`Settings2`) replaces "Anpassen" text on mobile (top-right of title row).
- 2 action buttons: `Nur notwendige` (white) + `Alle akzeptieren` (emerald). Mobile splits 50/50.

---

## Part 3 — Cross-cutting working principles

### 3.1 Documentation hierarchy

1. `_tasks/SOLEN_LIVE_TRUTH.md` §X — the principal spec (rules win).
2. `_tasks/V2_REBUILD_LOG.md` V2-D## — the decision log.
3. `public/solen-v2-*.html` — locked visual references.
4. Component JSDoc — last source of truth, lowest priority.

### 3.2 The 5-step iteration loop

1. **Spec draft** in LIVE_TRUTH §X.
2. **Mockup HTML** in `public/solen-v2-<surface>.html`.
3. **Conflict scan** against locked rules + component JSDoc.
4. **Implement** route-scoped React components.
5. **Lock** via V2-D## entry. User signs off.

### 3.3 Discuss-before-execute (CLAUDE.md global rules)

- **Don't invent:** when values aren't locked, ask. Don't fill from memory.
- **Lead with recommendation:** state the pick + reasoning. Don't list options without picking.
- **Visualize visual questions:** render mockup HTML side-by-side before/after for any sizing/color/layout question.
- **No yes-man:** before agreeing, state one concrete failure mode.
- **Pattern-reset on meta-feedback:** "you're guessing / inventing / yes-manning" → stop, diagnose posture, change.

### 3.4 Surgical edits only

- No whole-file rewrites unless requested.
- Match exact scope of request.
- Read before editing.
- Mass token sweeps blocked by `.claude/hooks/pre-sweep-check.sh`.

### 3.5 Anti-patterns (LIVE_TRUTH §0d.7 + this session)

- ❌ `bg-white` on `<body>` (kills atmosphere wash).
- ❌ Cat-color halo glows on cards.
- ❌ Section padding ↔ ScrollRow margin drift.
- ❌ "Fixing" Cooper Black cdnfonts URL (silent fallback to Sansita 900).
- ❌ `will-change` / `transform: translateZ(0)` at REST.
- ❌ Animating `width` / `height` to/from `auto`.
- ❌ Em-dashes in user-facing prose (V2-D49j) — use comma/colon/middle-dot.
- ❌ Italic anywhere in UI (V2-D15).
- ❌ Terracotta button bg (washed-out CTA).
- ❌ Emerald inside a sentence as highlight word (reads as link).

---

## Part 4 — Salon detail page adaptation playbook

**The translation principle:** Fresha is a *costume* (visual reference). Solen V3 is the *anchor* (brand voice). For each Fresha element, identify what it COMMUNICATES (info / action / photo / decoration), then deliver that communication using the Solen pattern from Part 2.

### 4.1 Anticipated element-by-element mappings

| Fresha element | Solen pattern |
|---|---|
| Photo gallery hero | Hero pattern (eyebrow + h1 with terracotta heartbeat) + photo carousel via §17 ScrollRow + scroll arrows from §15 |
| Sticky tab bar (Services / Über / Bewertungen / Standort) | New §SD spec; emerald active underline; bg becomes opaque white + `backdrop-blur(12px)` once stuck |
| Service list with prices | SalonCard `variant=service` Row 2 pattern: service name + `ab CHF [price]` with emerald price accent |
| Staff section | FeaturedStylists pattern (circular avatar + name + specialty/city + rating pill) |
| Reviews summary | TestimonialsColumn split-tap pattern OR static 3-card grid using same card structure |
| Photo carousel | §17 ScrollRow + circle scroll arrows from §15 SectionTitle |
| Sticky bottom booking CTA | Emerald pill at bottom of viewport on mobile (`fixed bottom-4 inset-x-3`); sidebar position on desktop |
| Opening hours table | Custom rows; "Heute frei" pill in success-green per §5h.2 semantic exception |
| Map | Deferred to v2 (V2-D10 already locked OUT for now) |

### 4.2 What to keep from Fresha (information architecture)

- Page IA — what content appears, in what order.
- Tab structure (services / about / reviews / location / staff).
- Booking CTA wiring (CTA → booking wizard `/book/[slug]`).
- Per-service "Buchen" buttons.
- Photo gallery order (hero → all photos).

### 4.3 What to drop from Fresha (visual treatment)

- All Fresha colors → V3 palette only (24 authorized hexes per §5h.1).
- All Fresha typography → Peace Sans display + Open Sauce One body.
- All Fresha button styles → emerald CTAs.
- All Fresha card shadows → V3 depth system §5b (single-shadow, warm-tinted).
- All Fresha icons → lucide-react only.
- Fresha pill styles → flat-pill discipline (no gradients, no inset gloss, no italic).

### 4.4 What to adapt to Solen voice

- Highlight words → terracotta heartbeat (e.g. salon name's last word, or one verb in section title).
- Section h2s → use §15 SectionTitle pattern (with scroll arrows where horizontal lists exist).
- Vertical rhythm → `mb-2 md:mb-4` between sections.
- Cropped giant elements (e.g. salon name as hero) → consider the negative-footer Peace-Sans-cropped pattern adapted to a top hero band.
- All atmosphere blobs + body wash → inherits from layout, no additional work needed.

---

## Part 5 — Workflow when the Fresha reference arrives

1. **Spec draft** → Append `§SD · Salon detail page` to `_tasks/SOLEN_LIVE_TRUTH.md` covering Fresha-mapped IA in V3 voice. Include anatomy diagram, tab structure, sticky bar behavior, motion specs, accessibility map.
2. **Mockup HTML** → `public/solen-v2-salon-detail.html` rendering full page at desktop + mobile widths. Use real V3 tokens. No new patterns invented — every element references a Part 2 pattern by name.
3. **Conflict scan** → Cross-check against §5h.2 (every emerald is action, every terracotta is heartbeat), §16 (SalonCard variant), §15 (SectionTitle scroll-arrow rule), §0d.7 (anti-patterns).
4. **User sign-off** on mockup — mockup-first per CLAUDE.md visualize-visual-questions rule.
5. **Implement** under `app/[locale]/salon/[slug]/page.tsx` + components in `app/[locale]/salon/[slug]/_components/`. Reuse Part 2 components verbatim where possible.
6. **Lock** with `V2-D##` entry in `V2_REBUILD_LOG.md`. Mark `§SD` as locked in LIVE_TRUTH.

---

## Part 6 — Reusable component inventory (file paths)

**Layout:**
- Header: `app/[locale]/_components/layout/Header.tsx`
- Footer: `app/[locale]/_components/layout/Footer.tsx`

**Homepage components (reusable on salon detail):**
- SalonCard: `app/[locale]/_components/homepage/SalonCard.tsx`
- HeartButton: `app/[locale]/_components/homepage/HeartButton.tsx`
- FeedZone / Section / SectionFrame / SectionTitle / ScrollRow / ScrollCircleButton (all from): `app/[locale]/_components/homepage/SectionHeader.tsx`
- TestimonialsColumn (review marquee): `app/[locale]/_components/homepage/TestimonialsColumn.tsx`
- AtmosphereBlobs: `app/[locale]/_components/homepage/AtmosphereBlobs.tsx`
- AtmosphereGrain: `app/[locale]/_components/homepage/AtmosphereGrain.tsx`
- Both atmosphere layers mounted at the page level via `app/[locale]/page.tsx`; surfaces inheriting via shared layout don't need to remount.

**Homepage feed-section components (page-specific, reuse pattern not the file directly — they wrap SalonCard + Section pattern with section-specific demo data):**
- RecentlyViewed: `app/[locale]/_components/homepage/RecentlyViewed.tsx`
- LastMinute: `app/[locale]/_components/homepage/LastMinute.tsx`
- Nearby: `app/[locale]/_components/homepage/Nearby.tsx`
- Coiffeur (category section): `app/[locale]/_components/homepage/Coiffeur.tsx`
- Reviews: `app/[locale]/_components/homepage/Reviews.tsx`
- Entdecken: `app/[locale]/_components/homepage/Entdecken.tsx`
- WhySolen / SalonRegister B2B: `app/[locale]/_components/homepage/WhySolen.tsx`
- Hero: `app/[locale]/_components/homepage/Hero.tsx`

**Primitives** (`app/[locale]/_components/primitives/`):
- Modal · Sheet · Toast · DateTimePicker · TextInput · Textarea · Checkbox · Radio · Switch · Select · PillToggle · CookieConsent · Logo · SkipLink · FieldLabel · FieldHelper

---

## Part 7 — Verification

When a new V3 surface lands (salon detail, booking wizard, profile, etc):

1. **Visual check** — Render at mobile 375 / 393 (iPhone 16) / desktop 1280. Compare each section against its spec + mockup HTML.
2. **Color rule check** — Every CTA emerald? Every heartbeat word terracotta? Run `grep -r "bg-s-accent" app/[locale]/<surface>/` and verify each match is decorative not action.
3. **Pattern reuse check** — Every section uses a Part 2 pattern by name. No new ad-hoc components unless approved.
4. **Spec lock** — `§<surface>` exists in LIVE_TRUTH with mockup reference. `V2-D##` entry in V2_REBUILD_LOG.
5. **End-to-end** — Real-device smoke test of the user funnel that touches the surface.

---

## Part 8 — Anticipated open questions when Fresha arrives

These are product/flow questions to surface via AskUserQuestion early, not assume:

1. **Booking flow integration** — Does "Buchen" go to a wizard route (Phase 2 §BW at `/book/[slug]`) or modal?
2. **Photo gallery interaction** — full-screen lightbox on tap, or just horizontal scroll?
3. **Sticky CTA on mobile** — single button "Termin buchen" or expanded with date+time?
4. **Per-service quick-book** — does each service row have its own "Buchen" or only the overall page CTA?
5. **Auth gate** — does booking require login first? (Tied to V2-D09 guest checkout decision — already locked OUT v1.)
6. **Cropped hero treatment** — does the salon name use the negative-footer Peace-Sans-cropped pattern as hero, or stay h1-style?
