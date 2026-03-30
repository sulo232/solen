# R34 — Category Pages V3 (Coiffeur / Barbershop / Nails / Spa / Makeup / Waxing)

> Apply V3 Zone 2 treatment to all 6 category pages: correct hero with gradient fill + Bebas Neue H1, fix filter pill styling, ensure max 1 background blob at 50% opacity, add eyebrow labels, fix card grid shadows.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — Hero section V3 | 🟡 Medium | Changes CategoryHero component (shared across 6 pages) |
| Phase 2 — Filter pill styling | 🟢 Low | Visual-only change |
| Phase 3 — Zone 2 blob enforcement | 🟢 Low | CSS opacity adjustment |
| Phase 4 — Card grid + eyebrow labels | 🟢 Low | Layout polish |

---

## Phase 1 — Category Hero: Gradient Fill + Bebas Neue + Zone 2 Blob

### ⚠️ BE CAREFUL
- `CategoryHero.tsx` is shared across all 6 category pages. Changes here affect all simultaneously — test all 6 routes after change.
- Zone 2 rules: max 1 blob at 50% opacity. No grain texture. Bebas Neue H1 is allowed ONCE as the page title.
- The hero must NOT have a 3-blob system (Zone 2 restriction). Reduce to 1 coral blob at 50% opacity.

### Category gradient map (per rulebook):
| Category | Gradient |
|---|---|
| Coiffeur | `from-s-amber to-s-coral` |
| Barbershop | `from-s-plum to-s-blue` |
| Nails | `from-s-coral to-s-yellow` |
| Spa & Massage | `from-s-sage to-s-blue` |
| Makeup | `from-s-sand to-s-coral` |
| Waxing | `from-s-plum to-s-sage` |

### Files to modify

#### [MODIFY] [CategoryHero.tsx](file:///c:/Users/sulod/solen/components/CategoryHero.tsx)
Full rewrite of category hero:

✅ DO:
```tsx
interface CategoryHeroProps {
  category: string;
  title: string;
  subtitle?: string;
  count?: number;
  gradient: string; // tailwind gradient string
}

export default function CategoryHero({ category, title, subtitle, count, gradient }: CategoryHeroProps) {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Zone 2: max 1 blob at 50% opacity */}
      <div className="absolute w-[320px] h-[320px] rounded-full bg-s-coral/[0.07] right-[-60px] top-[-40px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-3">
          {category}
        </span>
        <h1 className="font-display uppercase text-s-ink dark:text-s-dm-text leading-[0.87] mb-4"
          style={{ fontSize: "clamp(56px, 8vw, 110px)", letterSpacing: "0.01em" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-body italic text-s-ink/60 text-[17px] leading-[1.82] max-w-sm mb-4">
            {subtitle}
          </p>
        )}
        {count != null && count > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-s-bg-raised shadow-warm-sm text-sm text-s-ink/70 font-body border border-s-ink/[0.08]">
            {count} {count === 1 ? "Salon" : "Salons"} in Basel
          </span>
        )}
      </div>
    </section>
  );
}
```

❌ DON'T:
```tsx
// Don't use 3 blobs in Zone 2
<BlobBackground zone={1} /> // Zone 1 blob system — wrong for category pages
// Don't use Lucide icons as the hero's main visual
```

#### [MODIFY] Each category page.tsx that uses CategoryHero
Pass the gradient + correct subtitle per category:
```tsx
// app/[locale]/coiffeur/page.tsx — CategoryPage component call
<CategoryHero
  category="Coiffeur"
  title="COIFFEUR"
  subtitle="Die besten Coiffeursalons in Basel."
  gradient="from-s-amber to-s-coral"
/>
```

**Verification:** `npm run build` — all 6 category pages render Hero with Bebas Neue H1, 1 blob max.

**Git commit:** `git add components/CategoryHero.tsx app/[locale]/coiffeur app/[locale]/barbershop app/[locale]/nails app/[locale]/spa app/[locale]/makeup app/[locale]/waxing && git commit -m "R34-P1: CategoryHero V3 — Bebas Neue, gradient fills, Zone 2 single blob"`

---

## Phase 2 — Filter Bar: V3 Pill Styling

### ⚠️ BE CAREFUL
- `FilterBar.tsx` (11,128 bytes) has its own pill structure — check active/inactive state classes.
- Active filter → `bg-s-coral text-white rounded-btn` for time filters.
- Active quality filter → `bg-s-amber text-white rounded-btn`.
- Inactive filter → `bg-s-bg-raised border border-s-ink/[0.08] text-s-ink/70 rounded-btn`.

### Files to modify

#### [MODIFY] [FilterBar.tsx](file:///c:/Users/sulod/solen/components/FilterBar.tsx)
Sweep active/inactive filter pill classes:

✅ DO:
```tsx
// Time filters (active):
className="px-4 py-2 rounded-btn bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover transition-all"

// Quality/feature filters (active):  
className="px-4 py-2 rounded-btn bg-s-amber text-white font-heading font-bold text-xs uppercase tracking-[.04em] shadow-amber-glow hover:bg-s-amber-hover transition-all"

// Inactive (all):
className="px-4 py-2 rounded-btn bg-s-bg-raised border border-s-ink/[0.08] text-s-ink/60 font-heading font-bold text-xs uppercase tracking-[.04em] shadow-warm-xs hover:bg-s-bg-surface hover:border-s-ink/15 transition-all"
```

❌ DON'T:
```tsx
// Don't use rounded-full or rounded-button on filter pills
className="... rounded-full ..."
// Don't use generic text-s-coral for active without background
```

**Verification:** `npm run build` — filter pills show coral (time), amber (quality), ghost (inactive).

**Git commit:** `git add components/FilterBar.tsx && git commit -m "R34-P2: filter bar V3 pill styling — coral/amber active, ghost inactive"`

---

## Phase 3 — Zone 2 Blob Enforcement

### ⚠️ BE CAREFUL
- Zone 2 pages (Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing, Salon profile, Search results) must have MAX 1 blob at 50% opacity.
- If any of these pages use `<BlobBackground zone={1} />`, switch to `zone={2}`.
- If `BlobBackground` doesn't support a zone prop that limits to 1 blob, add it.

### Files to modify

#### [MODIFY] [BlobBackground.tsx](file:///c:/Users/sulod/solen/components/ui/BlobBackground.tsx)
Ensure zone=2 renders only 1 blob at 50% opacity:
```tsx
if (zone === 2) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute w-[320px] h-[320px] rounded-full bg-s-coral/[0.07] right-[-60px] top-[-40px]" />
    </div>
  );
}
```

#### [MODIFY] All 6 category pages + Search + Salon profile
Change `<BlobBackground zone={1} />` → `<BlobBackground zone={2} />` where applicable.

**Verification:** `npm run build` — Zone 2 pages have max 1 subtle blob, no heavy carpet effect.

**Git commit:** `git add components/ui/BlobBackground.tsx app/[locale]/coiffeur app/[locale]/barbershop && git commit -m "R34-P3: Zone 2 blob enforcement — max 1 blob at 50% opacity"`

---

## Phase 4 — Section Eyebrow Labels + Card Grid Gap Fix

### ⚠️ BE CAREFUL
- Every section in category pages needs an amber eyebrow label above the H2.
- Card grid gaps: 3-column = `gap-[18px]`, 4-column = `gap-[14px]` per 8pt grid.

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
Add eyebrow labels to each section heading:
```tsx
// Before each H2:
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  Beliebte {category}
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text mb-6"
  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
  Top bewertet in Basel
</h2>
```

Fix grid gaps:
```tsx
// 3-col grid:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]"
// 4-col grid:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]"
```

**Verification:** `npm run build` — eyebrow labels visible above all section headings on category pages.

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "R34-P4: eyebrow labels + 8pt grid gaps on category pages"`

---

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 — CategoryHero | Must be done first (shared component) |
| Phase 2 — FilterBar | Independent |
| Phase 3 — Blob Zone | Depends on BlobBackground component existing |
| Phase 4 — Eyebrow/gaps | Independent |
