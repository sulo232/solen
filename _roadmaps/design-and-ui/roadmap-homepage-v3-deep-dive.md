# Homepage Deep-Dive V3 Roadmap

> **Scope:** Every pixel, component, animation, and interaction on the Homepage (`components/HomePage.tsx` + all direct sub-components).
> **Standard:** Solen V3 Design Rulebook — Zone 1 (Maximalist).
> **Strategy:** Phase by phase. One phase = one git commit + `npm run build`.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Hero layout 2-col | 🔴 High | Full section rewrite — test mobile fallback |
| P2 — Search bar Fresha style | 🟡 Medium | Wrapper styling only, logic untouched |
| P3 — Stats band V3 glass | 🟢 Low | SocialProofStrip visual-only |
| P4 — Category tiles gradient | 🟢 Low | CATEGORIES data + JSX visual change |
| P5 — Rebook widget | 🟢 Low | Visual-only, existing logic |
| P6 — Featured Salons section | 🟡 Medium | SalonCard wrapper hover fix |
| P7 — Last Minute plum section | 🟡 Medium | Background + LastMinuteCard changes (shared) |
| P8 — Trending + Nearby sections | 🟢 Low | Section heading + scroll wrapper |
| P9 — Review Carousel V3 | 🟢 Low | Glass card styling + eyebrow |
| P10 — Quartier dark section | 🟡 Medium | Full section bg swap to dark |
| P11 — New Salons + Neue label | 🟢 Low | Section header + eyebrow |
| P12 — Partner CTA + Trust Strip | 🟡 Medium | Remove blob shape (rounds to 20px) |
| P13 — Nav (global, homepage context) | 🟡 Medium | Glass tier 1 values correct |
| P14 — Footer V3 | 🟢 Low | Brand banner + du-form text |
| P15 — Motion + Accessibility | 🟢 Low | Universal reduce-motion, spring easing |

---

## Phase 1 — Hero: 2-Column Editorial Split

> **Goal:** Transform the centered hero into the V3 editorial split layout with a floating salon card on the right.

### Current state (HomePage.tsx line 257–301)
- Single column, `max-w-4xl mx-auto text-center`
- No CTA buttons below the heading
- No floating visual element
- Search bar placed directly below heading inline

### ⚠️ BE CAREFUL
- The search bar currently lives inside the hero section (line 296–298). In V3, the search bar is extracted BELOW the hero as its own section.
- `BlobBackground zone={1}` must stay — it's the Zone 1 carpet identity for the entire page.
- The floating hero card is `lg:block hidden` — invisible on mobile. Mobile: single column, heading + CTA buttons only.
- Hero H1 text: keep `clamp(64px, 9vw, 130px)` — already correct from previous work.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 257–301** — Replace hero section

✅ DO:
```tsx
<section className="relative overflow-hidden py-16 sm:py-24 min-h-[80vh] flex items-center">
  <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-center">

      {/* LEFT: editorial text stack */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {!userName && (
          <motion.span variants={fadeUp}
            className="font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber block mb-3">
            Von Basel, für Basel
          </motion.span>
        )}
        <motion.h1 variants={fadeUp}
          className="font-display uppercase text-s-ink dark:text-s-dm-text"
          style={{ fontSize: "clamp(64px, 9vw, 130px)", letterSpacing: "0.01em", lineHeight: "0.87" }}>
          {userName ? (
            <>Hallo{" "}<span className="text-s-coral">{userName}</span></>
          ) : (
            <>BEAUTY<span className="text-s-coral">.</span><br />BASEL<span className="text-s-coral">.</span></>
          )}
        </motion.h1>
        <motion.p variants={fadeUp}
          className="mt-5 font-body italic text-s-ink/60 dark:text-s-dm-text/60 leading-[1.82] max-w-md"
          style={{ fontSize: "17px" }}>
          {userName && nextBooking
            ? `Dein nächster Termin: ${nextBooking.date} bei ${nextBooking.salon}`
            : userName
              ? "Willkommen zurück — was darf's heute sein?"
              : "Coiffeur, Barber, Nails & Spa — buche jetzt in deinem Quartier."}
        </motion.p>

        {/* Hero CTAs — two pill buttons */}
        <motion.div variants={fadeUp} className="mt-8 flex gap-3 flex-wrap">
          <Link href={`/${locale}/search`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-btn bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover hover:shadow-coral-glow-hover hover:-translate-y-px active:translate-y-px active:shadow-pressed transition-all duration-150">
            <Search size={15} aria-hidden="true" /> Salon finden
          </Link>
          <Link href={`/${locale}/last-minute`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-btn border-[1.5px] border-s-ink/20 dark:border-white/20 text-s-ink dark:text-s-dm-text font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-ink hover:text-white hover:shadow-warm-md hover:-translate-y-px transition-all duration-150">
            Last Minute →
          </Link>
        </motion.div>
      </motion.div>

      {/* RIGHT: floating hero visual card (desktop only) */}
      <HeroVisualCard />
    </div>
  </div>
</section>
```

❌ DON'T:
```tsx
// Don't keep text-center on hero — left-align on desktop
className="max-w-4xl mx-auto text-center"

// Don't embed search bar inside the hero section
<motion.div variants={fadeUp} className="mt-8"><HomeSearchBar /></motion.div>
```

#### [NEW] [HeroVisualCard.tsx](file:///c:/Users/sulod/solen/components/ui/HeroVisualCard.tsx)
**New component:** The floating gradient card with glass overlay + stat card

```tsx
"use client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const reduced = typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroVisualCard() {
  return (
    <div className="relative h-[540px] hidden lg:block" aria-hidden="true">
      {/* ── Main gradient card ── */}
      <div className="absolute top-10 left-8 right-0 bottom-0 rounded-[20px] overflow-hidden"
        style={{ background: "linear-gradient(145deg, #D4870A 0%, #E8624A 100%)",
                 boxShadow: "0 24px 72px rgba(26,18,9,.18)" }}>

        {/* Deco circles on gradient */}
        <div className="absolute w-[220px] h-[220px] rounded-full bg-white/10 right-[-40px] top-[-40px]" />
        <div className="absolute w-[160px] h-[160px] rounded-full bg-s-plum/20 left-[-30px] bottom-[80px]" />

        {/* Bebas Neue salon name watermark */}
        <div className="font-display text-[80px] text-white/15 px-6 pt-6 leading-none select-none">
          AMARA
        </div>

        {/* Heart button */}
        <button className="absolute top-4 right-4 w-[36px] h-[36px] rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.50)" }}>
          <Heart size={16} className="text-s-coral fill-s-coral" />
        </button>

        {/* Top Pick badge */}
        <span className="absolute top-4 left-4 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn text-s-amber-text"
          style={{ background: "#F2C144", boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
          Solen Top Pick
        </span>

        {/* Glass overlay info card */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-[20px] p-5"
          style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                   WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                   borderTop: "1px solid rgba(255,255,255,.55)",
                   boxShadow: "inset 0 1px 0 rgba(255,255,255,.70)" }}>
          <p className="font-heading font-bold text-s-ink text-[16px] mb-0.5">Salon Amara</p>
          <p className="text-xs text-s-ink/60 mb-3 font-body">Kleinbasel · ★ 4.9 · 28 Bewertungen</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-s-sage-text mb-3 px-3 py-1 rounded-btn"
            style={{ background: "#EBF5EE", boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            Heute 14:30 frei
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm text-s-ink/70 font-body">Ab <strong className="text-s-ink font-heading">CHF 45</strong></span>
            <button className="px-4 py-2 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] transition-all"
              style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}>
              Jetzt buchen
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating stat card ── */}
      <motion.div
        className="absolute top-0 left-0 rounded-[20px] p-5 min-w-[140px]"
        style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                 WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                 border: "1px solid rgba(255,255,255,.55)",
                 boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.70)" }}
        animate={reduced ? {} : { y: [0, -10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <div className="font-display text-[44px] leading-none text-s-coral">247</div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-s-ink/50 mt-0.5 leading-tight">
          Buchungen<br />diese Woche
        </div>
      </motion.div>
    </div>
  );
}
```

**Git commit:** `git add components/HomePage.tsx components/ui/HeroVisualCard.tsx && git commit -m "R-HP-P1: hero 2-col editorial split, floating salon card, dual CTA buttons"`

**Verification:** `npm run build` — desktop shows 2-col, mobile shows single-col heading+buttons only.

---

## Phase 2 — Search Bar: Fresha-Style Segmented Panel

> **Goal:** Replace the stacked card layout with a visually integrated, single-row segmented search bar per the V3 spec.

### Current state (HomeSearchBar.tsx)
- 3 rows stacked in a card: dates → categories → text input
- Submit button separate below
- Container: `bg-white/90 backdrop-blur-sm rounded-card`
- Good logic: AI detect-category, date chips, aria-labels ✅

### ⚠️ BE CAREFUL
- The search logic (AI detect, category requirement, date routing) is SOLID — do NOT touch it.
- Only restyle the wrapper, card, and submit button. All `useState`, `handleSubmit`, `handleDateChip` logic stays identical.
- The new search bar lives as its own section BELOW the hero (removed from inside hero in P1).
- On mobile, the bar collapses to stacked rows same as before — the pill segmentation is lg-only.

### Files to modify

#### [MODIFY] [HomeSearchBar.tsx](file:///c:/Users/sulod/solen/components/ui/HomeSearchBar.tsx)
**Line 126–226** — Restyle the container and submit button only

The outer `<form>` wrapper → becomes the centred section container:
```tsx
<form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto" role="search" aria-label="Salon suchen">

  {/* ── Main segmented bar ── */}
  <div className="rounded-[18px] overflow-hidden"
    style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
             WebkitBackdropFilter: "blur(24px) saturate(1.3)",
             border: "1px solid rgba(255,255,255,.80)",
             boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>

    {/* Row: dates + categories side by side on lg, stacked on sm */}
    <div className="flex flex-col lg:flex-row">
      {/* Segment 1: Date */}
      <div className="flex items-center gap-2 px-5 py-4 lg:border-r border-b lg:border-b-0 border-s-ink/[0.06] flex-wrap">
        <Calendar size={14} className="text-s-ink/35 shrink-0" aria-hidden="true" />
        {/* date chips + picker — logic unchanged */}
        <button type="button" onClick={() => handleDateChip("today")}
          className={[pillBase, activeDateChip === "today" ? pillActive : pillInactive].join(" ")}>Heute</button>
        <button type="button" onClick={() => handleDateChip("tomorrow")}
          className={[pillBase, activeDateChip === "tomorrow" ? pillActive : pillInactive].join(" ")}>Morgen</button>
        <SolenDatePicker label="" value={selectedDate} onChange={handleCustomDate} minValue={todayValue} className="[&_label]:hidden" />
      </div>

      {/* Segment 2: Categories */}
      <div className={`flex items-center gap-1.5 px-5 py-4 overflow-x-auto no-scrollbar border-b lg:border-b-0 border-s-ink/[0.06] flex-1 ${categoryHint ? "ring-2 ring-s-coral/30 ring-inset" : ""}`}>
        {CATEGORIES.map(({ key, label, Icon }) => (
          <button key={key} type="button"
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            className={[pillBase, selectedCategory === key ? pillActive : pillInactive].join(" ")}
            aria-pressed={selectedCategory === key} aria-label={`Kategorie ${label}`}>
            <Icon size={13} aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {/* Segment 3: Text input + Search button inline */}
      <div className="relative flex items-stretch">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-s-ink/30" aria-hidden="true"/>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Service oder Salon…" aria-label="Service oder Salon suchen" id="tour-search"
          className="w-full lg:w-56 py-4 pl-10 pr-2 text-sm font-body text-s-ink placeholder:text-s-ink/35 bg-transparent focus:outline-none border-b lg:border-b-0 border-s-ink/[0.06]" />

        {/* Submit — nested inside bar */}
        <button type="submit" disabled={detecting}
          className="shrink-0 m-2 px-5 py-3 rounded-[12px] bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.04em] flex items-center gap-1.5 shadow-coral-glow hover:bg-s-coral-hover hover:shadow-coral-glow-hover transition-all disabled:opacity-60">
          {detecting ? <Loader2 size={14} className="animate-spin" /> : <Search size={13} aria-hidden="true" />}
          {detecting ? "…" : "Suchen"}
        </button>
      </div>
    </div>
  </div>

  {/* Category hint text */}
  {categoryHint && (
    <p className="text-xs text-s-coral font-body font-medium mt-2 text-center animate-pulse">
      Bitte wähle eine Kategorie
    </p>
  )}
</form>
```

**Also update HomePage.tsx**: Move `<HomeSearchBar />` OUT of the hero section into its own `<section>` right after the hero:
```tsx
{/* ── Search Bar ── */}
<section className="max-w-5xl mx-auto px-4 -mt-6 relative z-20 mb-12">
  <HomeSearchBar />
</section>
```

**Git commit:** `git add components/ui/HomeSearchBar.tsx components/HomePage.tsx && git commit -m "R-HP-P2: search bar Fresha-style segmented panel, extracted from hero section"`

---

## Phase 3 — Stats Band: V3 Glass Tile System

> **Goal:** Upgrade `SocialProofStrip` from a thin coral strip to 3 glass stat cards on cream background.

### Current state (SocialProofStrip.tsx)
- `bg-s-coral/5 border-y border-s-coral/10` — thin coral strip
- Counts rendered as inline text, no card shape
- Count-up animation works ✅, real data API ✅

### ⚠️ BE CAREFUL
- The count-up hook + IntersectionObserver logic is solid — keep entirely.
- Only restyle the container and StatCounter visual layout.

### Files to modify

#### [MODIFY] [SocialProofStrip.tsx](file:///c:/Users/sulod/solen/components/ui/SocialProofStrip.tsx)
**Lines 59–101** — Replace strip with 3 glass stat cards

```tsx
// Change DEFAULT_STATS to include icons + context
const DEFAULT_STATS = [
  { value: 247, label: "Buchungen diese Woche", icon: "📅" },
  { value: 38,  label: "Salons in Basel", icon: "✂" },
  { value: 4.9, label: "Ø Bewertung", icon: "★", isDecimal: true },
];

// StatCounter becomes a glass card:
function StatCounter({ item, isVisible }: ...) {
  return (
    <div className="flex-1 min-w-[160px] rounded-[20px] p-6 text-center"
      style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
               WebkitBackdropFilter: "blur(16px) saturate(1.2)",
               border: "1px solid rgba(255,255,255,.55)",
               boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
      <div className="text-[10px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 mb-2">
        {item.icon}
      </div>
      <div className="font-display text-[44px] leading-none text-s-coral mb-1">
        {item.isDecimal ? item.value.toFixed(1) : count.toLocaleString("de-CH")}
      </div>
      <div className="text-xs font-body text-s-ink/55 leading-tight">{item.label}</div>
    </div>
  );
}

// Container:
return (
  <div ref={ref} className="max-w-5xl mx-auto px-4 py-8">
    <div className="flex gap-4 flex-wrap justify-center">
      {stats.map(item => <StatCounter key={item.label} item={item} isVisible={isVisible} />)}
    </div>
  </div>
);
```

**Git commit:** `git add components/ui/SocialProofStrip.tsx && git commit -m "R-HP-P3: stats band → 3 glass stat cards with Bebas Neue numbers"`

---

## Phase 4 — Category Tiles: Gradient Fill + Bebas Neue (No Icons)

> **Goal:** Replace icon tiles with gradient-fill square cards with Bebas Neue text only.

### Current state (HomePage.tsx CATEGORIES + grid)
- 6 tiles with Lucide icons + Bebas Neue label ✅ (label correct)
- Backgrounds: subtle colour tints (correct but not gradient)
- Hover: scale + rotate ✅

### ⚠️ BE CAREFUL
- Remove Lucide icon imports that are ONLY used by category tiles (Scissors, ScissorsLineDashed, Sparkles, Droplets, Palette, Zap). Check if any are used elsewhere in `HomePage.tsx` first with a grep.
- Add salon count per category (stored in component state, fetched via `/api/salons/category-counts` if the route exists, otherwise show static counts).
- `aspect-square` required on tiles — not a fixed height.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 61–68** — Replace CATEGORIES constant
```tsx
const CATEGORIES = [
  { key: "coiffeur",   label: "COIFFEUR",    count: "42",  grad: "linear-gradient(145deg,#D4870A,#E8624A)" },
  { key: "barbershop", label: "BARBER",      count: "18",  grad: "linear-gradient(145deg,#4A1E3C,#6BA3C8)" },
  { key: "nails",      label: "NAILS",       count: "24",  grad: "linear-gradient(145deg,#E8624A,#F2C144)" },
  { key: "spa",        label: "SPA",         count: "11",  grad: "linear-gradient(145deg,#7BA688,#6BA3C8)" },
  { key: "makeup",     label: "MAKEUP",      count: "8",   grad: "linear-gradient(145deg,#C9A96E,#E8624A)" },
  { key: "waxing",     label: "WAXING",      count: "15",  grad: "linear-gradient(145deg,#4A1E3C,#7BA688)" },
] as const;
```

**Lines 320–338** — Replace tile JSX
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
  {CATEGORIES.map(({ key, label, count, grad }) => (
    <Link key={key} href={`/${locale}/${key}`}
      className="relative aspect-square rounded-[20px] overflow-hidden group"
      style={{ boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
      <div className="absolute inset-0 transition-transform duration-[250ms] group-hover:scale-[1.04] group-hover:-rotate-1"
        style={{ background: grad }} />
      <div className="absolute inset-0 bg-gradient-to-t from-s-ink/60 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-3">
        <div className="font-display text-[22px] text-white leading-none">{label}</div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-white/55 mt-0.5">{count} Salons</div>
      </div>
    </Link>
  ))}
</div>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P4: category tiles → gradient fills, Bebas Neue, no icons, count labels"`

---

## Phase 5 — Rebook Widget: V3 Glass Pill

> **Goal:** Upgrade the "Wieder buchen?" widget from a flat card to a Tier 2 glass card.

### Current state (HomePage.tsx lines 344–369)
- `bg-s-coral/5 border border-s-coral/15` — flat tinted bg
- `rounded-card` container ✅
- `rounded-btn` on the button ✅

### ⚠️ BE CAREFUL - This widget is in Zone 1, glass Tier 2 is fine.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 344–369** — Upgrade to glass Tier 2

```tsx
<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
  className="flex items-center gap-4 p-4 rounded-[20px]"
  style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
           WebkitBackdropFilter: "blur(16px) saturate(1.2)",
           border: "1px solid rgba(255,255,255,.55)",
           boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
    style={{ background: "rgba(232,98,74,.12)" }}>
    <RefreshCw size={18} className="text-s-coral" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-heading font-bold text-s-ink dark:text-s-dm-text text-sm">Wieder buchen?</p>
    <p className="text-xs text-s-ink/50 font-body truncate">Dein letzter Besuch: {lastBookedSalon.name}</p>
  </div>
  <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
    className="shrink-0 px-4 py-2 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em]"
    style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}>
    Nochmal
  </Link>
</motion.div>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P5: rebook widget → Tier 2 glass card with coral icon box"`

---

## Phase 6 — Featured Salons: Section Eyebrow + Warm Shadows

> **Goal:** Add amber eyebrow, fix section bg from `bg-s-bg-surface/50` to cream, fix card wrapper hover.

### ⚠️ BE CAREFUL
- Card wrappers in the scrollable row currently add `hover:-translate-y-[5px] hover:shadow-card-hover`. `shadow-card-hover` is a cold token — replace with `shadow-warm-float`.
- `SalonCard` itself handles hover via `motion.div whileHover` — the wrapper div hover is redundant. Remove `hover:-translate-y-[5px]` from wrapper, let `SalonCard`'s own Framer Motion handle it. Both together = double movement.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 374–433** — Featured Salons section

1. Replace section wrapper bg: `bg-s-bg-surface/50` → no bg needed (transparent over carpet)
2. Remove `hover:-translate-y-[5px] hover:shadow-card-hover` from card wrapper `div` (line 417) — let `SalonCard`'s own hover handle it
3. Add eyebrow label above H2:
```tsx
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  Beliebt in Basel
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
  Beliebte Salons
</h2>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P6: featured salons eyebrow label, remove double hover, warm shadows"`

---

## Phase 7 — Last Minute Section: Plum Dark Glass

> **Goal:** Replace coral-subtle section with deep plum dark section per V3 spec.

(See R35 for full detail — abbreviated here for sequencing.)

### ⚠️ BE CAREFUL
- Section uses `rounded-blob-e mx-2 sm:mx-6` — NEVER on a section container. Replace with `overflow-hidden` only (no radius on full-width sections).

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)

```tsx
<section id="tour-last-minute" className="py-20 overflow-hidden relative"
  style={{ background: "#4A1E3C" }}>
  {/* Deco blobs on dark */}
  <div className="absolute w-[360px] h-[360px] rounded-full right-[-80px] top-[-80px] pointer-events-none"
    style={{ background: "rgba(232,98,74,.14)" }} />
  <div className="absolute w-[240px] h-[240px] rounded-full left-[-50px] bottom-[-50px] pointer-events-none"
    style={{ background: "rgba(107,163,200,.08)" }} />
  <div className="max-w-5xl mx-auto px-4 relative z-10">
    <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
      <div>
        <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] mb-2"
          style={{ color: "#F2C144" }}>Last Minute</span>
        <h2 className="font-heading font-extrabold text-white"
          style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
          Spare bis zu 50%
        </h2>
      </div>
      <Link href={`/${locale}/last-minute`}
        className="text-white/60 border border-white/20 text-xs px-4 py-2 rounded-btn font-heading font-bold uppercase tracking-[.04em] hover:text-white hover:border-white/40 transition-all">
        Alle ansehen →
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {lastMinuteSlots.map(slot => <LastMinuteCard key={slot.id} slot={slot} locale={locale} />)}
    </div>
  </div>
</section>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P7: last minute section → plum dark with deco blobs, remove blob-container violation"`

---

## Phase 8 — Trending + Nearby: Eyebrow Labels + Section Head Fix

> **Goal:** Both sections get amber eyebrow labels, card wrapper hover fixed, section bg normalised.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 491–556** — Trending + Nearby sections

For each section:
1. Remove `border-t border-s-ink/5` between sections — use `py-12` spacing only
2. Add eyebrow label above H2
3. Remove `hover:-translate-y-[5px] hover:shadow-card-hover` from card wrapper divs (same reason as Phase 6)
4. Section bg: keep transparent (BlobBackground behind)

```tsx
{/* Trending eyebrow example: */}
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  Trending
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
  Trending in Basel
</h2>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P8: trending + nearby sections — eyebrow labels, section border removal"`

---

## Phase 9 — Review Carousel: Eyebrow + Glass Tier 2 Cards

> **Goal:** Upgrade ReviewCarousel to match V3 — eyebrow, glass Tier 2 cards, warm shadows.

### Current state (ReviewCarousel.tsx line 92)
- `bg-white/80 backdrop-blur-sm` — half-hearted glass, missing inset highlight
- `hover:shadow-card` — cold shadow
- No eyebrow label above "Was Basler:innen sagen"
- Section bg: transparent (fine)

### Files to modify

#### [MODIFY] [ReviewCarousel.tsx](file:///c:/Users/sulod/solen/components/ReviewCarousel.tsx)
**Lines 72–113** — Eyebrow + card glass upgrade

```tsx
{/* Add eyebrow above "Was Basler:innen sagen" */}
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  Bewertungen
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
  Was Basler:innen sagen
</h2>

{/* Card: glass Tier 2 */}
<motion.div key={review.id}
  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.1 }}
  className="snap-start shrink-0 w-[280px] md:w-auto rounded-[20px] p-5 hover:-translate-y-[3px] transition-transform duration-[250ms]"
  style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
           WebkitBackdropFilter: "blur(16px) saturate(1.2)",
           border: "1px solid rgba(255,255,255,.55)",
           boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
  {/* ... review content unchanged ... */}
</motion.div>
```

**Git commit:** `git add components/ReviewCarousel.tsx && git commit -m "R-HP-P9: review carousel → eyebrow + Tier 2 glass cards + warm shadows"`

---

## Phase 10 — Quartier Section: Dark Ink Treatment

> **Goal:** Full dark section with large Bebas Neue numbers, filter zero-count tiles, no "Bald hier".

### ⚠️ BE CAREFUL
- Filter out tiles where `quartierCounts[slug] === 0` — do NOT show them with "Bald hier".
- Section background changes from light cream to `#1A1209` (dark ink). Text inside must be white.
- The condition `Object.values(quartierCounts).some(c => c > 0)` must stay as the outer guard.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 593–671** — Full quartier section rewrite

```tsx
{sections.quartier && Object.values(quartierCounts).some(c => c > 0) && (
<section className="py-20 overflow-hidden relative" style={{ background: "#1A1209" }}>
  <div className="absolute w-[400px] h-[400px] rounded-full right-[-80px] top-[-80px] pointer-events-none"
    style={{ background: "rgba(232,98,74,.08)" }} />
  <div className="max-w-5xl mx-auto px-4 relative z-10">
    <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] mb-3"
      style={{ color: "#F2C144" }}>Dein Quartier</span>
    <h2 className="font-display text-white mb-2"
      style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: "0.87", letterSpacing: "0.01em" }}>
      ENTDECKE<br /><span style={{ color: "#E8624A" }}>BASEL</span>
    </h2>
    <p className="font-body italic mb-10 max-w-sm text-[15px] leading-[1.82]"
      style={{ color: "rgba(245,238,228,.45)" }}>
      Salons direkt in deinem Quartier — von Kleinbasel bis Bruderholz.
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {QUARTIERS.filter(q => (quartierCounts[q.slug] ?? 0) > 0).map(({ slug, name }, i) => (
        <Link key={slug} href={`/${locale}/coiffeur?quartier=${slug}`}
          className="relative rounded-[20px] p-5 overflow-hidden hover:-translate-y-[3px] hover:opacity-90 transition-all duration-[250ms] group"
          style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.06)" }}>
          <p className="font-heading font-bold text-white text-[15px] mb-0.5">{name}</p>
          <p className="text-xs" style={{ color: "rgba(245,238,228,.45)" }}>
            {quartierCounts[slug]} {quartierCounts[slug] === 1 ? "Salon" : "Salons"}
          </p>
          {/* Large background number */}
          <span className="font-display text-[72px] absolute right-[-8px] bottom-[-20px] leading-none select-none pointer-events-none"
            style={{ color: "rgba(255,255,255,.05)" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
        </Link>
      ))}
    </div>
  </div>
</section>
)}
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P10: quartier → dark ink section, filter zero tiles, large bg numbers"`

---

## Phase 11 — Neue Salons: Eyebrow + Glass Section Head

> **Goal:** Eyebrow label, section heading fix, remove `border-t` artifact.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 562–589** — Neue Salons section

1. Add eyebrow label above "Neue Salons"
2. Remove Sparkles icon from the heading row (heading = text only per V3)
3. Remove `border-t` between sections

```tsx
<div className="mb-6">
  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
    Neu dabei
  </span>
  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
    style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
    Neue Salons
  </h2>
  <p className="text-sm text-s-ink/50 mt-1 font-body">
    Frisch auf Solen — entdecke die neuesten Salons in Basel
  </p>
</div>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P11: neue salons → eyebrow label, remove icon from heading, clean spacing"`

---

## Phase 12 — Partner CTA: Remove Blob Shape + Gradient + Trust Strip

> **Goal:** Replace `rounded-blob-c` (NEVER rule) with `rounded-[20px]`. Add trust strip below.

### ⚠️ BE CAREFUL
- `rounded-blob-c` is a blob shape on a container — NEVER rule #6. Replace with `rounded-[20px]`.
- The heading: keep `font-heading` (not Bebas Neue) at this size per Z1 editorial rules.
- Trust strip: a glass Tier 3 ambient strip below the partner CTA.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 673–709** — Partner CTA block

```tsx
<motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }} transition={{ duration: 0.5 }}
  className="rounded-[20px] overflow-hidden relative"
  style={{ background: "linear-gradient(135deg,#D4870A 0%,#E8624A 55%,#4A1E3C 100%)",
           boxShadow: "0 24px 72px rgba(26,18,9,.18)" }}>
  {/* Inner blobs */}
  <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
    style={{ background: "rgba(255,255,255,.12)", filter: "blur(60px)", transform: "translate(50%,-50%)" }} />
  <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
    <div className="max-w-xl text-center md:text-left">
      <h2 className="font-heading font-bold text-white mb-4 leading-tight"
        style={{ fontSize: "clamp(26px, 4vw, 52px)", letterSpacing: "-0.02em" }}>
        Hast du einen Salon?
      </h2>
      <p className="font-body italic text-white/70 text-lg leading-[1.82]">
        Bring dein Business auf das nächste Level — erreiche tausende Kund:innen in Basel.
      </p>
    </div>
    <div className="shrink-0">
      <Link href={`/${locale}/partner`}
        className="inline-flex items-center gap-2 px-10 py-4 rounded-btn bg-white text-s-ink font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-bg-base hover:-translate-y-px transition-all duration-150"
        style={{ boxShadow: "0 2px 4px rgba(26,18,9,.12), 0 4px 16px rgba(26,18,9,.10)" }}>
        Partner werden →
      </Link>
    </div>
  </div>
</motion.div>
```

**Below partner CTA, add Trust Strip:**
```tsx
{/* Trust Strip */}
<div className="mt-6 flex gap-4 flex-wrap items-center px-5 py-4 rounded-[16px]"
  style={{ background: "rgba(250,246,239,.50)", backdropFilter: "blur(8px)",
           WebkitBackdropFilter: "blur(8px)",
           border: "1px solid rgba(255,255,255,.25)",
           boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
  {[
    { icon: "🔒", text: "Sichere Zahlung — Stripe verschlüsselt" },
    { icon: "🇨🇭", text: "Swiss Made — Basel" },
    { icon: "✓",  text: "nDSG konform" },
    { icon: "↩",  text: "Stornierung bis 24h vor Termin" },
    { icon: "💳", text: "TWINT · Visa · Mastercard" },
  ].map(({ icon, text }) => (
    <div key={text} className="flex items-center gap-2 text-xs text-s-ink/65">
      <div className="w-7 h-7 rounded-[8px] bg-white border border-s-ink/08 flex items-center justify-center text-sm shrink-0"
        style={{ boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
        {icon}
      </div>
      {text}
    </div>
  ))}
</div>
```

**Git commit:** `git add components/HomePage.tsx && git commit -m "R-HP-P12: partner CTA blob→20px, gradient fill, trust strip"`

---

## Phase 13 — Motion System: Springs + Reduced Motion Universal

> **Goal:** Upgrade all Framer animations to spring physics and enforce universal prefers-reduced-motion.

### ⚠️ BE CAREFUL
- Current `fadeUp` and `itemVariants` use `ease: "easeOut"` and fixed durations. Replace with spring physics for snappiness.
- The universal `*` CSS reduce-motion override in `globals.css` must NOT break Framer's inline styles. Framer works fine with the CSS override — it respects it.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 47–55** — Update animation variants

```tsx
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
} as const;
```

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
Replace the selective `@media (prefers-reduced-motion: reduce)` block at lines 207–219 with the universal version:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Git commit:** `git add components/HomePage.tsx app/globals.css && git commit -m "R-HP-P13: spring physics animations, universal prefers-reduced-motion"`

---

## Phase 14 — Footer: Brand Banner + Du-Form + Trust Note

> **Goal:** Add Bebas Neue SO.LEN banner to footer, du-form copy, nDSG note.

### Files to modify

#### [MODIFY] Footer.tsx (path: components/layout/Footer.tsx)

Add at top of footer content (before link grid):
```tsx
{/* Brand banner */}
<div className="text-center py-12 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full pointer-events-none"
    style={{ background: "rgba(232,98,74,.10)", filter: "blur(60px)" }} />
  <h2 className="font-display relative z-10"
    style={{ fontSize: "clamp(44px, 6vw, 80px)", letterSpacing: "0.02em", color: "rgba(245,238,228,.90)" }}>
    SO<span style={{ color: "#E8624A" }}>.</span>LEN
  </h2>
  <p className="font-body italic mt-2 text-sm relative z-10" style={{ color: "rgba(245,238,228,.50)" }}>
    Von Basel, für Basel.
  </p>
</div>
```

Change tracking on section headings: `tracking-wider` → `tracking-[.20em]`

Add below footer legal links:
```tsx
<p className="text-xs mt-3" style={{ color: "rgba(245,238,228,.28)" }}>
  nDSG-konform — Deine Daten bleiben in der Schweiz.
</p>
```

**Git commit:** `git add components/layout/Footer.tsx && git commit -m "R-HP-P14: footer brand banner SO.LEN, du-form, nDSG note"`

---

## Phase 15 — Final Polish: Scroll Restoration + Hydration

> **Goal:** Fix any scroll restoration issues and ensure the homepage doesn't flash on hydration.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
Add loading skeleton for the hero's floating card to prevent CLS:
```tsx
// HeroVisualCard should be wrapped in Suspense or render null until mounted
// to avoid hydration mismatch on SSR
```

Add `scroll-behavior: smooth` to html for anchor links (section IDs exist for tutorial tour):
```css
/* globals.css */
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

**Git commit:** `git add app/globals.css components/HomePage.tsx && git commit -m "R-HP-P15: scroll restoration, CLS fix on hero card, smooth scroll with reduced-motion guard"`

---

## Execution Order

| Phase | Task | Depends On | Parallel? |
|---|---|---|---|
| P1 | Hero 2-col split | Nothing | ✅ |
| P2 | Search bar Fresha | P1 (bar moves out of hero) | After P1 |
| P3 | Stats band glass | Nothing | ✅ |
| P4 | Category tiles gradient | Nothing | ✅ |
| P5 | Rebook widget glass | Nothing | ✅ |
| P6 | Featured salons eyebrow | Nothing | ✅ |
| P7 | Last minute plum | Nothing | ✅ |
| P8 | Trending/Nearby eyebrow | Nothing | ✅ |
| P9 | Review carousel glass | Nothing | ✅ |
| P10 | Quartier dark | Nothing | ✅ |
| P11 | Neue Salons eyebrow | Nothing | ✅ |
| P12 | Partner CTA + trust strip | Nothing | ✅ |
| P13 | Motion spring + reduce | Nothing | ✅ |
| P14 | Footer brand banner | Nothing | ✅ |
| P15 | Polish/hydration | All above | Last |

> Phases 3–14 are fully independent and can run in parallel (separate Claude Code sessions).

---

## Files Changed Summary

| Tag | File |
|---|---|
| MODIFY | `components/HomePage.tsx` (P1,P4,P5,P6,P7,P8,P10,P11,P12,P13) |
| NEW | `components/ui/HeroVisualCard.tsx` (P1) |
| MODIFY | `components/ui/HomeSearchBar.tsx` (P2) |
| MODIFY | `components/ui/SocialProofStrip.tsx` (P3) |
| MODIFY | `components/ReviewCarousel.tsx` (P9) |
| MODIFY | `components/layout/Footer.tsx` (P14) |
| MODIFY | `app/globals.css` (P13, P15) |

---

## Verification After All Phases

```bash
npm run build
# Expected: 0 TypeScript errors

# Visual checks:
# ✅ Desktop: 2-col hero with floating card + stat badge
# ✅ Segmented search bar below hero
# ✅ 3 glass stat cards (247, 38, 4.9)
# ✅ Gradient category tiles, no icons
# ✅ Dark plum Last Minute section
# ✅ Dark ink Quartier section, no "Bald hier"
# ✅ Partner CTA = 20px radius, gradient fill
# ✅ Trust strip below partner CTA
# ✅ SO.LEN banner in footer
# ✅ Mobile: single column hero, stacked search bar, all sections full-width

# Accessibility:
# ✅ prefers-reduced-motion: reduce → zero animations
# ✅ All buttons have aria-labels
# ✅ Search form has role="search" aria-label
```
