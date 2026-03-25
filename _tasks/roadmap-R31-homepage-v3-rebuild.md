# R31 — Homepage V3 Full Rebuild

> Rebuild the Homepage to match the V3 Design Rulebook spec exactly: editorial 2-column hero, segmented Fresha search bar, gradient category tiles, plum Last Minute section, dark Quartier section, and trust strip.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — Hero Layout | 🟡 Medium | Layout change affects mobile responsive grid |
| Phase 2 — Category Tiles | 🟢 Low | Self-contained visual-only change |
| Phase 3 — Last Minute Section | 🟡 Medium | Colour/component change, data flow unchanged |
| Phase 4 — Quartier + Partner + Trust | 🟢 Low | Layout polish, no data changes |

---

## Phase 1 — Hero: Editorial 2-Column Split + Floating Card

### ⚠️ BE CAREFUL
- The hero currently renders `<text-center>` on a `max-w-4xl mx-auto` single column. Switching to a 2-column grid must maintain mobile fallback to single column.
- The floating hero visual card animates with `solen-float` — wrap in `@media (prefers-reduced-motion: reduce)` to disable.
- Don't break `BlobBackground zone={1}` — it must stay as `z-index: 0` behind the hero content.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 257–301** — Replace single-column hero with editorial 2-column split

✅ DO:
```tsx
<section className="relative overflow-hidden py-16 sm:py-24 min-h-screen flex items-center">
  <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left: editorial text */}
      <div>
        <motion.span variants={fadeUp} className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber block mb-3">
          Von Basel, für Basel
        </motion.span>
        <motion.h1 variants={fadeUp} className="font-display uppercase leading-[0.87] text-s-ink dark:text-s-dm-text"
          style={{ fontSize: "clamp(64px, 9vw, 130px)", letterSpacing: "0.01em" }}>
          BEAUTY.<br /><span className="text-s-coral">BASEL.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-5 font-body italic text-s-ink/60 leading-[1.82] max-w-md text-[17px]">
          Coiffeur, Barber, Nails & Spa — buche jetzt in deinem Quartier.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex gap-3 flex-wrap">
          <Link href={`/${locale}/search`} className="inline-flex items-center gap-2 px-9 py-4 rounded-btn bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover hover:shadow-coral-glow-hover hover:-translate-y-px active:translate-y-px active:shadow-pressed transition-all duration-150">
            <Search size={15} /> Salon finden
          </Link>
          <Link href={`/${locale}/last-minute`} className="inline-flex items-center gap-2 px-9 py-4 rounded-btn border-[1.5px] border-s-ink/28 text-s-ink font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-ink hover:text-s-bg-base hover:shadow-warm-md hover:-translate-y-px transition-all duration-150">
            Last Minute →
          </Link>
        </motion.div>
      </div>
      {/* Right: floating hero card */}
      <HeroVisualCard />
    </div>
  </div>
</section>
```

❌ DON'T:
```tsx
// Don't keep text-center or max-w-4xl solo column
<div className="max-w-4xl mx-auto text-center px-4">
  <motion.h1 ...>Beauty<span>.Basel.</span></motion.h1>
```

#### [NEW] [HeroVisualCard.tsx](file:///c:/Users/sulod/solen/components/ui/HeroVisualCard.tsx)
Floating hero right-side card with `solen-float` animation:
```tsx
"use client";
import { motion } from "framer-motion";

export default function HeroVisualCard() {
  return (
    <div className="relative h-[520px] hidden lg:block">
      {/* Main gradient card */}
      <div className="absolute top-10 left-5 right-0 bottom-0 rounded-[20px] bg-gradient-to-br from-s-amber to-s-coral shadow-warm-float overflow-hidden flex flex-col justify-end">
        <div className="font-display text-[72px] text-white/18 px-6 pt-4 leading-none">AMARA</div>
        {/* Glass overlay */}
        <div className="bg-white/62 backdrop-blur-[16px] border-t border-white/55 rounded-b-[20px] p-5"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.70)" }}>
          <p className="font-heading font-bold text-s-ink text-base">Salon Amara</p>
          <p className="text-xs text-s-ink/60 mb-2">Kleinbasel · ★ 4.9 · 28 Bewertungen</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-s-sage-text bg-s-sage-subtle px-3 py-1 rounded-btn mb-2 shadow-warm-xs">
            Heute 14:30 frei
          </span>
          <p className="text-sm text-s-ink/60 mb-3">Ab <strong className="text-s-ink">CHF 45</strong></p>
          <button className="px-4 py-2 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover transition-all">
            Jetzt buchen
          </button>
        </div>
        {/* Heart */}
        <button className="absolute top-3.5 right-3.5 w-[34px] h-[34px] rounded-full bg-white/75 backdrop-blur-[8px] border border-white/50 flex items-center justify-center shadow-warm-sm hover:scale-110 transition-transform" />
        {/* Top Pick badge */}
        <span className="absolute top-3.5 left-3.5 bg-s-yellow text-s-yellow-text text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn shadow-warm-sm">
          Solen Top Pick
        </span>
      </div>
      {/* Floating stat card */}
      <motion.div
        className="absolute top-0 left-0 rounded-[20px] bg-white/62 backdrop-blur-[16px] border border-white/55 p-4 shadow-warm-lg"
        style={{ boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.70)" }}
        animate={{ y: [0, -10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="font-display text-[40px] leading-none text-s-coral">247</div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-s-ink/50">Buchungen<br />diese Woche</div>
      </motion.div>
    </div>
  );
}
```

**Verification:** `npm run build` — hero must render as 2-col on lg, 1-col on mobile. Float animation disabled via `prefers-reduced-motion`.

**Git commit:** `git add components/HomePage.tsx components/ui/HeroVisualCard.tsx && git commit -m "R31-P1: hero editorial 2-column split + floating salon card"`

---

## Phase 2 — Category Tiles: Gradient Fills + Bebas Neue Only

### ⚠️ BE CAREFUL
- Remove Lucide icon imports used only by the category tile (Scissors, ScissorsLineDashed, etc.) — but check if they are used elsewhere in `HomePage.tsx` before removing.
- Tile hover: `scale(1.03) rotate(-1deg)` NOT `scale(1.03) rotate-1` Tailwind — the Tailwind `hover:-rotate-1` is `rotate(-1deg)` so it IS equivalent. Use Tailwind.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 61–68 + 307–339** — replace icon tiles with gradient fill tiles

✅ DO:
```tsx
const CATEGORIES = [
  { key: "coiffeur",   label: "COIFFEUR",   count: "42 Salons", grad: "from-s-amber to-s-coral" },
  { key: "barbershop", label: "BARBER",     count: "18 Shops",  grad: "from-s-plum to-s-blue" },
  { key: "nails",      label: "NAILS",      count: "24 Studios",grad: "from-s-coral to-s-yellow" },
  { key: "spa",        label: "SPA",        count: "11 Anbieter",grad:"from-s-sage to-s-blue" },
  { key: "makeup",     label: "MAKEUP",     count: "8 Studios", grad: "from-s-sand to-s-coral" },
  { key: "waxing",     label: "WAXING",     count: "15 Salons", grad: "from-s-plum to-s-sage" },
] as const;

// In JSX:
{CATEGORIES.map(({ key, label, count, grad }) => (
  <Link
    key={key}
    href={`/${locale}/${key}`}
    className={`relative aspect-square rounded-[20px] overflow-hidden bg-gradient-to-br ${grad} shadow-warm-sm hover:shadow-warm-float hover:scale-[1.04] hover:-rotate-1 transition-all duration-[250ms] group`}
  >
    <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-s-ink/68 to-transparent">
      <div className="font-display text-[22px] text-white leading-none">{label}</div>
      <div className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-white/62 mt-0.5">{count}</div>
    </div>
  </Link>
))}
```

❌ DON'T:
```tsx
// Don't keep Lucide icons in category tiles
<Icon size={36} className="text-s-coral group-hover:scale-110" />
// Don't use subtle bg (bg-s-coral-subtle) — must be gradient fills
```

**Verification:** `npm run build` — 6 tiles render with gradient backgrounds, Bebas Neue text, no icons.

**Git commit:** `git add components/HomePage.tsx && git commit -m "R31-P2: category tiles → gradient fills + Bebas Neue labels"`

---

## Phase 3 — Last Minute Section: Plum Dark Glass Treatment

### ⚠️ BE CAREFUL
- Section background changes from `bg-s-coral-subtle` to dark plum (`bg-s-plum` / `#4A1E3C`). Text inside must switch to white.
- The `rounded-blob-e` on the section container is a NEVER — use no special radius on a full-width section (sections have `overflow-hidden`, no own radius).
- `LastMinuteCard` component must also be updated (Phase 3B — see R35 for full card redesign).

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 436–489** — replace section wrapper styling

✅ DO:
```tsx
<section id="tour-last-minute" className="py-20 bg-s-plum relative overflow-hidden">
  {/* Deco blobs on dark bg */}
  <div className="absolute w-[400px] h-[400px] rounded-full bg-s-coral/14 right-[-80px] top-[-80px] pointer-events-none" />
  <div className="absolute w-[300px] h-[300px] rounded-full bg-s-blue/08 left-[-60px] bottom-[-60px] pointer-events-none" />
  <div className="max-w-5xl mx-auto px-4 relative z-10">
    <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
      <div>
        <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-yellow mb-2">Last Minute</span>
        <h2 className="font-heading font-extrabold text-white" style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
          Spare bis zu 50%
        </h2>
      </div>
      <Link href={`/${locale}/last-minute`} className="text-white/60 border border-white/20 text-sm px-4 py-2 rounded-btn font-heading font-bold uppercase tracking-[.04em] hover:text-white hover:border-white/40 transition-all">
        Alle ansehen →
      </Link>
    </div>
    {/* Cards — see LastMinuteCard updates */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {lastMinuteSlots.map((slot) => <LastMinuteCard key={slot.id} slot={slot} locale={locale} />)}
    </div>
  </div>
</section>
```

❌ DON'T:
```tsx
// Don't use rounded-blob-e on sections
className="... rounded-blob-e mx-2 sm:mx-6 ..."
// Don't keep coral-subtle bg
className="bg-s-coral-subtle/40 border-y border-s-coral/10 ..."
```

**Verification:** `npm run build` — Last Minute section renders dark plum with deco blobs.

**Git commit:** `git add components/HomePage.tsx && git commit -m "R31-P3: Last Minute → plum dark section with deco blobs"`

---

## Phase 4 — Quartier Dark Section + Partner Fix + Trust Strip

### ⚠️ BE CAREFUL
- Quartier section currently has "Bald hier" text — NEVER rule #24. Already has `Object.values(quartierCounts).some(c => c > 0)` guard. Add guard to HIDE individual tiles where count is 0 (filter them out, don't show "Bald hier").
- Partner CTA uses `rounded-blob-c` — BANNED for interactive containers. Replace with `rounded-[20px]`.
- Trust strip: add 5 trust items as a glass-tier-3 strip at `z-10`.

### Files to modify

#### [MODIFY] [HomePage.tsx](file:///c:/Users/sulod/solen/components/HomePage.tsx)
**Lines 593–671** — Quartier section dark treatment
```tsx
<section className="py-20 bg-s-ink relative overflow-hidden">
  <div className="absolute w-[400px] h-[400px] rounded-full bg-s-coral/08 right-[-100px] top-[-100px] pointer-events-none" />
  <div className="max-w-5xl mx-auto px-4 relative z-10">
    <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-yellow mb-2">Dein Quartier</span>
    <h2 className="font-display text-white mb-2" style={{ fontSize: "clamp(36px,5vw,64px)", lineHeight: 0.87 }}>
      Entdecke<br /><span className="text-s-coral">Basel</span>
    </h2>
    <p className="font-body italic text-white/45 text-[15px] leading-[1.8] mb-8 max-w-md">
      Salons direkt bei dir im Quartier — vom Kleinbasel bis ins Bruderholz.
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {QUARTIERS.filter(q => (quartierCounts[q.slug] ?? 0) > 0).map(({ slug, name }, i) => (
        <Link key={slug} href={`/${locale}/coiffeur?quartier=${slug}`}
          className="relative rounded-[20px] border border-white/10 bg-white/06 p-5 hover:bg-white/10 hover:-translate-y-[3px] hover:shadow-warm-lg transition-all duration-200 overflow-hidden group">
          <p className="font-heading font-bold text-white text-[15px] mb-1">{name}</p>
          <p className="text-xs text-white/45">{quartierCounts[slug]} {quartierCounts[slug] === 1 ? "Salon" : "Salons"}</p>
          <span className="font-display text-[64px] absolute right-[-8px] bottom-[-16px] text-white/05 leading-none pointer-events-none">
            {String(i + 1).padStart(2, "0")}
          </span>
        </Link>
      ))}
    </div>
  </div>
</section>
```

**Lines 673–708** — Partner CTA: remove `rounded-blob-c`, use `rounded-[20px]` + gradient fill
```tsx
<motion.div className="rounded-[20px] overflow-hidden relative shadow-warm-float"
  style={{ background: "linear-gradient(135deg, #D4870A 0%, #E8624A 55%, #4A1E3C 100%)" }}>
  {/* ... same content but correct shape */}
```

**Lines 710+** — Trust strip (NEW — add before `<Footer />`):
```tsx
<div className="px-4 pb-16">
  <div className="max-w-5xl mx-auto">
    <div className="flex gap-4 flex-wrap items-center px-5 py-4 rounded-[16px] bg-s-bg-base/50 backdrop-blur-[8px] border border-white/25 shadow-warm-xs">
      {[
        { icon: "🔒", label: "Sichere Zahlung — Stripe verschlüsselt" },
        { icon: "🇨🇭", label: "Swiss Made — Entwickelt in Basel" },
        { icon: "✓",  label: "nDSG konform" },
        { icon: "↩",  label: "Kostenlose Stornierung bis 24h" },
        { icon: "💳", label: "TWINT · Kreditkarte · Bar" },
      ].map(({ icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-xs text-s-ink/70">
          <div className="w-7 h-7 rounded-[8px] bg-white border border-s-ink/08 flex items-center justify-center text-sm shadow-warm-xs shrink-0">{icon}</div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Verification:** `npm run build` — Quartier dark section, no "Bald hier", partner uses 20px radius, trust strip visible.

**Git commit:** `git add components/HomePage.tsx && git commit -m "R31-P4: quartier dark section, partner 20px fix, trust strip added"`

---

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 — Hero | BlobBackground (exists ✅) |
| Phase 2 — Cat Tiles | Homepage data (exists ✅) |
| Phase 3 — LM Section | LastMinuteCard (see R35 for card redesign) |
| Phase 4 — Quartier/Partner/Trust | quartierCounts API (exists ✅) |

## Final Verification

```bash
npm run build
# Check: no type errors, no missing imports
# Visual: 2-col hero on desktop, gradient category tiles, dark LM section, dark quartier section
```
