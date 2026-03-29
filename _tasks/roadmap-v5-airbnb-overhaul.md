# V5 Airbnb/Fresha Visual Overhaul — Final Roadmap

> **One Claude Code session. Three files: `app/globals.css`, `components/SalonCard.tsx`, `components/HomePage.tsx`**
>
> **Core design direction:** Airbnb browsing feel + Fresha minimal precision. Keep Solen fonts (Bebas Neue / Syne / DM Sans), keep text colors (coral, amber, ink). Light-mode first. No color shocks. No jarring section backgrounds. Content bleeds into cream like a magazine.

---

## Locked Design Decisions

| Question | Decision |
|---|---|
| Mobile card grid | **2 columns** |
| Card image ratio | **4/5 portrait** |
| Info below photo | **Clean text below, no overlay** |
| Hero alignment | **Left-aligned** |
| Hero subtitle | **Cut** — replaced with short AI-casual tagline |
| Buchungen link | **Show only when logged in** |
| Partner link | **Remove entirely** |
| City selector | **Persistent pill — select once, tap to change** |
| Last Minute section | **Remove `bg-s-plum` dark bg** → flat, inline |
| SocialProofStrip | **Cut** |
| Rebook bar | **Flatten to inline pill, no card box** |
| ReviewCarousel | **Keep, no color band** |
| Trust strip | **Flatten to inline items, no card** |
| Partner CTA | **Flat inline with border-top separator** |
| Section backgrounds | **All removed** — only barely-perceptible cream/white alternation |
| Amber eyebrow labels | **Keep but slightly muted** |
| Dark mode | **Light-mode first** |
| Hero bg orbs | **Keep but reduce opacity from ~0.12 to 0.04** |
| Featured salons | **2-col grid, no carousel** |
| Category items | **Rounded-xl squircles, horizontal scroll all viewports** |
| Shadows | **Removed from listing cards only. Kept on search, nav, modals, sheets, CTA buttons** |

---

## What Exists vs. What Needs Changing

### In `app/globals.css`:
- ✅ `.glass-frost` exists lines 172–182
- ✅ `.glass-search` exists lines 184–200
- ✅ `.glass-pill` exists (added in Session 1)
- ✅ `.hero-cinematic` exists (added in Session 1)
- ✅ `.card-v4` exists lines 320–338 — **DO NOT REMOVE** — still used in rebook bar, map CTA, dashboard, booking flow
- ❌ `.card-listing` is missing — needs to be added

### In `components/SalonCard.tsx`:
- ✅ `animated?: boolean` prop exists (Session 1 + 3 added it)
- ✅ `photos?: string[]` prop exists
- ✅ Photo carousel with dot indicators exists
- ✅ Compact info section exists (Session 3)
- Current outer class: `card-v4` → needs to become `card-listing`
- Current image ratio: `aspect-[3/2]` → needs to become `aspect-[4/5]`

### In `components/HomePage.tsx`:
- ✅ `gridContainerVariants`, `gridItemVariants`, `headingVariants` imported from `@/lib/motion`
- ✅ `CitySelector` already imported and rendered below search bar
- ✅ `animated={false}` already passed to SalonCard in grids
- ❌ All grids still use snap-scroll carousel pattern on mobile — needs to be 2-col grid
- ❌ Hero is centered — needs left-aligned
- ❌ Last Minute section has `bg-s-plum` dark background — needs removal
- ❌ Partner CTA has `bg-gradient-to-br from-s-amber via-s-coral to-s-plum` — needs removal
- ❌ Category row uses `rounded-full` circles — needs `rounded-2xl` squircles
- ❌ Hero subtitle is a `<motion.p>` with italic serif — cut it
- ❌ Hero has a glow div (line 250) around search — remove
- ❌ Small links block contains "Buchungen" always and "Partner →" — needs conditional + removal
- ❌ SocialProofStrip rendered — needs removal
- ❌ Rebook bar uses `card-v4` — flatten
- ❌ `grid-cols-1 sm:grid-cols-2` pattern everywhere — change to `grid-cols-2`

---

## Phase A — CSS changes in `app/globals.css`

### A1 — Add `.card-listing` class (after the `.card-v4` block, around line 338)

```css
/* ── V5 Listing Card — Airbnb style, no elevation ───────────────────── */
.card-listing {
  background: transparent;
  border: none;
  border-radius: 12px;
  box-shadow: none;
  transition: transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
}
.card-listing:hover {
  transform: translateY(-2px);
}
```

### A2 — Update `.glass-search` to Airbnb "double ring" style (replace lines 184–200)

```css
.glass-search {
  background: #ffffff;
  border: 1.5px solid rgba(26, 18, 9, 0.12);
  box-shadow: 0 1px 2px rgba(26, 18, 9, 0.06), 0 4px 16px rgba(26, 18, 9, 0.06);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.glass-search:focus-within {
  border-color: rgba(26, 18, 9, 0.22);
  box-shadow: 0 1px 2px rgba(26, 18, 9, 0.08), 0 4px 24px rgba(26, 18, 9, 0.10);
}
.dark .glass-search {
  background: rgba(30, 23, 16, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
}
```

### A3 — Reduce `.hero-cinematic` orb opacity (find the hero-cinematic definition)

Update its gradient values so orbs are barely there (0.04–0.05 opacity max):
```css
.hero-cinematic {
  background:
    radial-gradient(ellipse 60% 50% at 15% 70%, rgba(232, 98, 74, 0.05) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 85% 25%, rgba(242, 193, 68, 0.04) 0%, transparent 60%),
    #fafaf9;
}
.dark .hero-cinematic {
  background:
    radial-gradient(ellipse 60% 50% at 15% 70%, rgba(232, 98, 74, 0.07) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 85% 25%, rgba(242, 193, 68, 0.05) 0%, transparent 60%),
    #1a1209;
}
```

**Commit A**: `git commit -m "phase-a: card-listing CSS, Airbnb search ring, soften hero orbs"`

---

## Phase B — SalonCard overhaul (`components/SalonCard.tsx`)

### B1 — Outer `motion.div` (line 122–127): swap `card-v4` → `card-listing`

Find:
```tsx
className={`relative card-v4 overflow-hidden cursor-pointer group ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
```
Replace with:
```tsx
className={`relative card-listing cursor-pointer group ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
```
Note: remove `overflow-hidden` from the outer div — it goes on the image div instead (see B2).

### B2 — Image container (line 147): ratio + shape

Find:
```tsx
<div className="relative w-full aspect-[3/2] bg-s-bg-sunken overflow-hidden rounded-t-card img-hover-zoom">
```
Replace with:
```tsx
<div className="relative w-full aspect-[4/5] bg-s-bg-sunken overflow-hidden rounded-xl img-hover-zoom">
```
`rounded-xl` applies to all corners of the photo. The info section below sits directly on the page background — no card box around them together.

### B3 — Info section padding (line 269)

Find: `<div className="px-3 py-2.5">`
Replace with: `<div className="pt-3 pb-1 px-0.5">`

Removes left/right padding so text is flush — exact Airbnb style where the listing name aligns with the left edge of the photo.

### B4 — Name typography (line 272)

Find the `<h3>` class that has `text-[14px]`:
```tsx
className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-[14px] leading-tight group-hover:text-s-coral transition-colors duration-150"
```
Replace with:
```tsx
className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-[13px] leading-snug"
```
Remove the `group-hover:text-s-coral` — Airbnb doesn't change text color on card hover.

**Commit B**: `git commit -m "phase-b: SalonCard -> card-listing, 4/5 ratio, flush info text, Airbnb layout"`

---

## Phase C — Category row rebuild (in `components/HomePage.tsx`, category section around lines 293–375)

Replace BOTH the `flex md:hidden` mobile row AND the `hidden md:grid grid-cols-6` desktop grid with a single unified squircle row:

```tsx
{/* Unified squircle category row — all viewports */}
<motion.div
  className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 gap-5 pb-1"
  variants={categoryContainerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
>
  {CATEGORIES.map(({ key, label, Icon, color, bgClass }, i) => {
    const isEnabled = key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled;
    return (
      <motion.div key={key} variants={categoryItemVariants} custom={i} className="flex-shrink-0">
        <Link
          href={isEnabled ? (persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`) : '#'}
          aria-disabled={!isEnabled}
          className="flex flex-col items-center gap-2 w-[68px]"
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgClass} ${isEnabled ? 'transition-transform duration-200 hover:scale-[1.05] active:scale-[0.97]' : 'opacity-40'}`}
          >
            <Icon className={`w-7 h-7 ${isEnabled ? color : 'text-s-ink/30'}`} animate />
          </div>
          <span className={`font-body text-[11px] font-medium text-center leading-tight whitespace-nowrap ${isEnabled ? 'text-s-ink dark:text-s-dm-text' : 'text-s-ink/35'}`}>
            {label}
          </span>
        </Link>
      </motion.div>
    );
  })}
</motion.div>
```

Key changes:
- `rounded-2xl` squircle (not `rounded-full` circle)
- Single scroll row on ALL screen sizes
- No count text (`X salons`)
- No lock icon on disabled — just opacity-40
- `font-body` not `font-display` for labels (smaller labels, DM Sans reads better)
- `hover:scale-[1.05]` squircle tap-bounce instead of card lift

**Commit C**: `git commit -m "phase-c: unified squircle category row, all viewports"`

---

## Phase D — Grid overhaul: swap all snap-scroll carousels → 2-col true grid (in `components/HomePage.tsx`)

There are 4 salon grids (Featured, Trending, Near You, New Salons) plus 1 Last Minute grid. All get updated the same way.

### D1 — For each `motion.div` grid wrapper that contains `SalonCard`, replace:

```tsx
// BEFORE — the snap-scroll pattern (used in Featured and Trending):
className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0"

// AFTER — 2-col grid everywhere:
className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
```

Also update the New Salons grid (currently `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`):
```tsx
// BEFORE:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// AFTER:
className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
```

### D2 — Remove snap-scroll wrapper classes from individual card `motion.div`s

```tsx
// BEFORE (on each card's motion.div):
className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto md:shrink"

// AFTER — remove the className entirely (motion.div needs no class):
// just leave variants and custom props
```

### D3 — Last Minute grid (line 500): change to 2-col

```tsx
// BEFORE:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// AFTER:
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
```

> ⚠️ `gap-y-8` for SalonCard grids. `gap-y-6` for LastMinuteCard grid (they're shorter cards).

**Commit D**: `git commit -m "phase-d: all grids 2-col mobile, remove snap-scroll carousels"`

---

## Phase E — Hero rebuild (in `components/HomePage.tsx`, hero section lines 220–280)

### E1 — Left-align the container
Line 226:
```tsx
// BEFORE:
<motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">

// AFTER:
<motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-left">
```

### E2 — Reduce headline size
Line 230:
```tsx
// BEFORE:
style={{ fontSize: "clamp(40px, 7vw, 80px)", letterSpacing: "0.01em", lineHeight: "0.9" }}

// AFTER:
style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "0.01em", lineHeight: "0.92" }}
```

### E3 — Replace subtitle `<motion.p>` with short AI-casual tagline
Lines 237–245 — the entire `<motion.p>` block — replace with:

```tsx
<motion.p
  variants={fadeUp}
  className="mt-2 font-body text-s-ink/45 dark:text-s-dm-text/45"
  style={{ fontSize: "14px" }}
>
  {userName && nextBooking
    ? t("hero.nextBooking", { date: nextBooking.date, salon: nextBooking.salon })
    : t("hero.aiTagline")}
</motion.p>
```

The `hero.aiTagline` key should be added to all locale JSON files:
- `de.json`: `"aiTagline": "KI findet deinen perfekten Termin — sofort."`
- `en.json`: `"aiTagline": "AI finds your perfect appointment — instantly."`
- `fr.json`: `"aiTagline": "L'IA trouve ton rendez-vous parfait — instantanément."`
- `it.json`: `"aiTagline": "L'IA trova il tuo appuntamento perfetto — subito."`

### E4 — Remove the glow div from around search bar + left-align
Lines 249–252:
```tsx
// BEFORE:
<div className="mt-10 max-w-4xl mx-auto relative">
  <div aria-hidden className="absolute -inset-3 md:-inset-5 bg-gradient-to-r from-s-coral/8 via-s-plum/6 to-s-amber/8 rounded-[40px] blur-2xl opacity-40 -z-10" />
  <HomeSearchBar />
</div>

// AFTER — no glow, no centering:
<div className="mt-6 w-full max-w-2xl">
  <HomeSearchBar />
</div>
```

### E5 — Fix city selector: keep it but remove `md:hidden` so it shows everywhere, make it always left-aligned
Lines 254–257:
```tsx
// BEFORE:
<div className="mt-3 flex justify-center md:hidden">
  <CitySelector />
</div>

// AFTER:
<div className="mt-3">
  <CitySelector />
</div>
```

### E6 — Fix the hero quick links (lines 259–275): remove "Partner →", show "Buchungen →" only when logged in

```tsx
<motion.div variants={fadeUp} initial="hidden" animate="visible"
  className="mt-5 flex items-center gap-5 flex-wrap">
  <Link href={`/${locale}/angebote`}
    className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors">
    {t("cta.lastMinute")} →
  </Link>
  {userName && (
    <Link href={`/${locale}/account/bookings`}
      className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors">
      {t("hero.bookings")} →
    </Link>
  )}
</motion.div>
```

"Partner →" is fully removed.

**Commit E**: `git commit -m "phase-e: hero left-align, AI tagline, no glow, city selector fix, hide partner link"`

---

## Phase F — Flatten color-shock sections (in `components/HomePage.tsx`)

### F1 — Last Minute section: remove `bg-s-plum` dark background (line 480)

This is the biggest color shock on the page. Full replacement:

```tsx
// BEFORE (line 480):
<section id="tour-last-minute" className="py-10 md:py-14 overflow-hidden relative bg-s-plum">

// AFTER:
<section id="tour-last-minute" className="py-10 md:py-14">
```

Also update the text colors inside — everything was white/white/60 for the dark bg:
- `text-white` → `text-s-ink dark:text-s-dm-text`
- `text-white/60` → `text-s-ink/50 dark:text-s-dm-text/50`
- `text-s-yellow` eyebrow → `text-s-amber`
- The `border border-white/20` empty-state div → `border border-s-ink/[0.06]` + remove `bg-white/[0.08]`
- View all link: `text-white/60 border border-white/20 hover:border-white/40 hover:text-white` → `text-s-ink/50 border border-s-ink/10 hover:border-s-coral/30 hover:text-s-coral`

### F2 — Partner CTA: remove `bg-gradient-to-br from-s-amber via-s-coral to-s-plum` gradient card (lines 686–715)

Replace the entire `<section>` content with a flat inline layout:

```tsx
<section className="py-10 md:py-14">
  <div className="max-w-5xl mx-auto px-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-s-ink/[0.06] dark:border-white/[0.06]">
      <div className="max-w-sm">
        <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-2">
          {t("partner.eyebrow") || "Für Salons"}
        </span>
        <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text leading-tight"
          style={{ fontSize: "clamp(18px, 2.5vw, 26px)" }}>
          {t("partner.title")}
        </h2>
        <p className="font-body text-s-ink/45 dark:text-s-dm-text/45 text-sm mt-2 leading-relaxed">
          {t("partner.subtitle")}
        </p>
      </div>
      <Link href={`/${locale}/partner`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-s-ink dark:bg-white text-white dark:text-s-ink font-heading font-bold text-xs uppercase tracking-[.05em] hover:-translate-y-px transition-[transform,box-shadow] duration-200 shrink-0"
        style={{ boxShadow: "0 2px 8px rgba(26,18,9,.10), 0 4px 24px rgba(26,18,9,.06)" }}>
        {t("partner.cta")} →
      </Link>
    </div>
  </div>
</section>
```

### F3 — Remove SocialProofStrip

Find the line `<SocialProofStrip />` or its conditional wrapper — delete it entirely. Remove the import too.

### F4 — Flatten Rebook bar: remove `card-v4` wrapper (lines 386–401)

```tsx
// BEFORE:
<div className="flex items-center gap-4 p-4 card-v4">

// AFTER — no card, just a gentle separator:
<div className="flex items-center gap-4 p-4 border border-s-ink/[0.05] dark:border-white/[0.05] rounded-xl bg-s-bg-base/40 dark:bg-s-dm-surface/20">
```

This gives it a barely-there border instead of card elevation.

### F5 — Flatten Trust strip (lines 718–735)

```tsx
// BEFORE:
<div className="flex gap-4 flex-wrap items-center px-5 py-4 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.06] shadow-elevation-1">

// AFTER:
<div className="flex gap-5 flex-wrap items-center border-t border-s-ink/[0.04] dark:border-white/[0.04] pt-8 pb-4">
```

### F6 — Remove all jarring section backgrounds

Replace every `bg-[--base]`, `bg-[--raised]` on `<section>` tags with **no background class** (let the page's `hero-cinematic` / `#fafaf9` show through). Only alternate subtly with `bg-s-ink/[0.015]` on every other content section if you want ANY differentiation — otherwise just leave sections with no bg.

Map CTA section (lines 607–633): Remove the `card-v4` wrapper from the inner div, add a `border-t border-s-ink/[0.04]` separator instead. Remove the `bg-[--raised]` from the section.

**Commit F**: `git commit -m "phase-f: remove bg-s-plum last-minute, flatten partner/trust/rebook, cut SocialProofStrip"`

---

## Locale JSON updates (messages/de.json + en.json + fr.json + it.json)

Add under the `"hero"` namespace:
```json
"aiTagline": "KI findet deinen perfekten Termin — sofort."
```
(and equivalents in other locales as listed in Phase E3)

Add under `"partner"` namespace if missing:
```json
"eyebrow": "Für Salons"
```

---

## Verification After All Phases

Run these checks before committing:

```powershell
# 1. No bg-s-plum in HomePage:
Select-String -Path "components\HomePage.tsx" -Pattern "bg-s-plum"
# Expected: 0 results

# 2. No bg-gradient on partner section:
Select-String -Path "components\HomePage.tsx" -Pattern "from-s-amber.*via-s-coral"
# Expected: 0 results

# 3. No card-v4 on SalonCard:
Select-String -Path "components\SalonCard.tsx" -Pattern "card-v4"
# Expected: 0 results

# 4. No snap-scroll in homepage grids:
Select-String -Path "components\HomePage.tsx" -Pattern "snap-x|snap-mandatory|snap-start"
# Expected: 0 results

# 5. No SocialProofStrip import:
Select-String -Path "components\HomePage.tsx" -Pattern "SocialProofStrip"
# Expected: 0 results

# 6. Confirm grid-cols-2 present on mobile grids:
Select-String -Path "components\HomePage.tsx" -Pattern "grid-cols-2"
# Expected: multiple results
```

**Final commit**: `git commit -m "phase-all: V5 Airbnb/Fresha overhaul complete — card-listing, 2-col grids, squircles, no color shocks"`
