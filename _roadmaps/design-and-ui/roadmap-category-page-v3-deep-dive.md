# Category / Search Page — Deep-Dive V3 Roadmap

> **Scope:** `components/CategoryPage.tsx`, `components/FilterBar.tsx`, `components/SalonCard.tsx`, `components/ui/SalonCard` sub-elements, all 6 category `page.tsx` files.
> **Zone:** Zone 2 (Soft Maximalist) — `BlobBackground zone={2}` already in place ✅, max 1 blob, no grain.
> **Key files:** CategoryPage.tsx (360 lines), FilterBar.tsx (272 lines), SalonCard.tsx (291 lines).

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Hero gradient + H1 typography | 🟡 Medium | Full hero block restyle, shared across all 6 categories |
| P2 — Breadcrumb eyebrow | 🟢 Low | Typography change only |
| P3 — FilterBar glass upgrade | 🟡 Medium | Sticky z-index, backdrop-blur change |
| P4 — Filter pill V3 (height, font) | 🟢 Low | CSS-only on pillBase/pillActive/pillInactive |
| P5 — Price dropdown glass | 🟢 Low | Dropdown wrapper only |
| P6 — Sort dropdown glass | 🟢 Low | Dropdown wrapper only |
| P7 — SalonCard: blob shape NEVER fix | 🔴 High | DirectoryCard uses `rounded-blob-d` — NEVER rule #6 |
| P8 — SalonCard: hover physics | 🟡 Medium | `cardPopIn` animation variant + hover shadow |
| P9 — SalonCard: Availability + Off-peak pills | 🟢 Low | Pill styling inside card |
| P10 — Map/List toggle | 🟢 Low | Button styling only |
| P11 — Quartier banner | 🟢 Low | Glass upgrade |
| P12 — Salon grid layout | 🟢 Low | gap + padding adjustment |
| P13 — Load More button | 🟢 Low | Pill upgrade |
| P14 — Empty state | 🟢 Low | EmptyState component V3 |
| P15 — Per-category hero gradient tokens | 🟢 Low | Update `categoryGradients` map |

---

## Phase 1 — Hero: Gradient Fill + Bebas Neue Category Name

### Current state (CategoryPage.tsx lines 207–223)
- Hero: `pt-28 pb-10` with `bg-gradient-to-b from-white/60` — generic flat cream fade
- H1: `font-heading font-bold text-2xl sm:text-4xl text-s-ink` — uses Syne, NOT Bebas Neue
- Size: `text-4xl` (~36px max) — too small per V3 display spec
- No eyebrow amber label above the H1
- Count line: `text-sm text-s-ink/50` — fine but no category-specific colour accent

### ⚠️ BE CAREFUL
- All 6 category pages share `CategoryPage.tsx` — one change applies everywhere.
- The `categoryGradients` map uses Tailwind gradient classes but they go `from-s-coral/10` for most categories — NOT differentiated per V3. Fix in P15.
- Mobile: Bebas Neue at `clamp(48px, 8vw, 96px)` must scale down to ~48px on small screens.

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 207–223** — Hero block

✅ DO:
```tsx
<div className="pt-24 pb-12 relative z-10 overflow-hidden">
  {/* Category gradient overlay */}
  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

  <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
    {/* Breadcrumb — eyebrow style */}
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-[.12em]">
        <li><span className="text-s-ink/30">{locale === "de" ? "Startseite" : "Home"}</span></li>
        <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
        <li className="text-s-ink/60" aria-current="page">{categoryLabel}</li>
      </ol>
    </nav>

    {/* Amber eyebrow */}
    <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-3">
      Basel · {categoryLabel}
    </span>

    {/* Hero H1 — Bebas Neue at display size */}
    <h1 className="font-display text-s-ink dark:text-s-dm-text"
      style={{ fontSize: "clamp(48px, 8vw, 96px)", lineHeight: "0.87", letterSpacing: "0.01em" }}>
      {categoryLabel.toUpperCase()} IN{" "}
      <span className="text-s-coral">BASEL</span>
    </h1>

    {/* Count line */}
    {(total > 0 || dirTotal > 0) && (
      <p className="font-body italic text-s-ink/50 mt-3 text-[15px] leading-[1.82]">
        {total} {total === 1 ? "Salon" : "Salons"} auf Solen
        {dirTotal > 0 && ` · ${dirTotal} weitere in Basel`}
      </p>
    )}
  </div>
</div>
```

❌ DON'T:
```tsx
// Don't use font-heading / Syne for the category H1 — it's Bebas Neue at display sizes
className="font-heading font-bold text-2xl sm:text-4xl"

// Don't use a shallow gradient — each category needs its own rich gradient (P15)
className="from-white/60 to-transparent"
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P1: hero → Bebas Neue H1, amber eyebrow, eyebrow-style breadcrumb"`

---

## Phase 2 — Legacy Breadcrumb Removal

> The breadcrumb is handled inside P1 rewrite — P2 is a git verification step only.

```bash
# Verify the old breadcrumb `<nav>` (lines 210–214) is fully replaced by P1's new nav.
grep -n "font-body flex items-center gap-1" components/CategoryPage.tsx
# Expected: 0 results
```

**Git commit:** (included in P1)

---

## Phase 3 — FilterBar: Glass Tier 1 + Warm Shadow

### Current state (FilterBar.tsx line 99)
```tsx
className="sticky top-[57px] z-40 bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-glass border-b border-s-ink/5 dark:border-white/5"
```
- `bg-white/80` + `backdrop-blur-glass` — uses a Tailwind custom class, not full inline spec
- Border-bottom only — missing inset highlight (V3 Tier 1 glass requires `boxShadow: "inset 0 -1px 0 ..."`)
- `z-40` is correct ✅

### ⚠️ BE CAREFUL
- `backdrop-blur-glass` is a custom Tailwind class defined in `tailwind.config.js`. Keep it — don't add redundant inline blur.
- The bar must remain `sticky top-[57px]` to sit under the nav.
- `isolation: isolate` needed to prevent z-index bleed.

### Files to modify

#### [MODIFY] [FilterBar.tsx](file:///c:/Users/sulod/solen/components/FilterBar.tsx)
**Line 95–100** — outer motion.div wrapper

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
  className="sticky top-[57px] z-40 isolate"
  style={{ background: "rgba(250,246,239,.82)", backdropFilter: "blur(28px) saturate(1.3)",
           WebkitBackdropFilter: "blur(28px) saturate(1.3)",
           boxShadow: "inset 0 -1px 0 rgba(26,18,9,.06), 0 1px 3px rgba(26,18,9,.04)" }}>
```

**Git commit:** `git add components/FilterBar.tsx && git commit -m "CP-P3: filter bar → glass Tier 1 inline spec, warm bottom shadow, isolate"`

---

## Phase 4 — Filter Pills: Height, Font, Spacing Fix

### Current state (FilterBar.tsx lines 38–43)
```tsx
const pillBase =
  "px-3 py-1.5 min-h-12 rounded-pill text-xs font-body font-medium whitespace-nowrap transition-all duration-200 border flex items-center";
```
- `min-h-12` = 48px height — way too tall for a filter pill (should be ~32–36px)
- `font-body font-medium` — pills must use `font-heading font-bold` per V3
- `text-xs` ✅
- `rounded-pill` ✅

### ⚠️ BE CAREFUL
- The same `pillBase`/`pillActive`/`pillInactive` classes are also used in `HomeSearchBar.tsx`. Changes here will affect the search bar too — verify both still look correct.
- `min-h-12` was likely added for accessibility (minimum touch target). Replace with explicit touch target approach: keep `min-h-[36px]` with `py-2` for comfortable tap.

### Files to modify

#### [MODIFY] [FilterBar.tsx](file:///c:/Users/sulod/solen/components/FilterBar.tsx)
**Lines 38–43** — pill constants

```tsx
const pillBase =
  "px-3.5 py-2 min-h-[36px] rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5";
const pillActive =
  "bg-s-coral text-white border-s-coral"
  + " " + "shadow-[0_2px_4px_rgba(232,98,74,.25),0_4px_16px_rgba(232,98,74,.15)]";
const pillInactive =
  "text-s-ink/65 dark:text-s-dm-text/65 border-s-ink/[0.08] dark:border-white/10"
  + " bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm"
  + " hover:border-s-coral/40 hover:bg-white/90 dark:hover:bg-s-dm-raised/90"
  + " shadow-[0_1px_2px_rgba(26,18,9,.06)]";
```

**Also update** `components/ui/HomeSearchBar.tsx` to import the same constants (or duplicate with same values) to keep them in sync.

**Git commit:** `git add components/FilterBar.tsx components/ui/HomeSearchBar.tsx && git commit -m "CP-P4: filter pills → 36px height, font-heading uppercase, V3 shadow spec"`

---

## Phase 5 — Price Dropdown: Glass Tier 2

### Current state (FilterBar.tsx lines 150–155)
```tsx
<div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-glass rounded-card shadow-glass border border-white/60 dark:border-white/10 z-50">
```
- `shadow-glass` — cold shadow token (NEVER rule #16)
- `rounded-card` — should be `rounded-[20px]`
- Missing inset highlight

### Files to modify

#### [MODIFY] [FilterBar.tsx](file:///c:/Users/sulod/solen/components/FilterBar.tsx)
**Lines 150–155** — price dropdown

```tsx
<div className="absolute top-full left-0 mt-2 w-64 p-5 z-50 rounded-[20px]"
  style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
           WebkitBackdropFilter: "blur(24px) saturate(1.3)",
           border: "1px solid rgba(255,255,255,.80)",
           boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>
  <PriceSlider />
</div>
```

**Git commit:** `git add components/FilterBar.tsx && git commit -m "CP-P5: price dropdown → glass Tier 2, warm shadow, inset highlight"`

---

## Phase 6 — Sort Dropdown: Glass Tier 2 + Row Hover

### Current state (FilterBar.tsx lines 241–254)
```tsx
<div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-s-dm-surface shadow-warm-lg rounded-card border border-s-ink/5 dark:border-white/10 py-1 z-50">
```
- `bg-white` — flat, no glass
- `shadow-warm-lg` — warm shadow ✅ but still should be inset-highlight glass
- Row hover: `hover:bg-s-bg-surface` — no radius

### Files to modify

#### [MODIFY] [FilterBar.tsx](file:///c:/Users/sulod/solen/components/FilterBar.tsx)
**Lines 240–254** — sort dropdown

```tsx
<div className="absolute top-full right-0 mt-2 w-52 z-50 rounded-[20px] overflow-hidden py-1"
  style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
           WebkitBackdropFilter: "blur(24px) saturate(1.3)",
           border: "1px solid rgba(255,255,255,.80)",
           boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.90)" }}>
  {SORT_OPTIONS.map(({ value, label }) => (
    <button key={value}
      onClick={() => { setParam("sort", value); setSortOpen(false); }}
      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/70 hover:bg-s-coral/[0.06] hover:text-s-coral transition-colors rounded-[10px] mx-0.5 w-[calc(100%-4px)]">
      {label}
      {activeSort === value && <Check className="w-3.5 h-3.5 text-s-coral" />}
    </button>
  ))}
</div>
```

**Git commit:** `git add components/FilterBar.tsx && git commit -m "CP-P6: sort dropdown → glass Tier 2, coral row hover, uppercase font"`

---

## Phase 7 — DirectoryCard: Remove Blob Morph (CRITICAL NEVER RULE)

### Current state (CategoryPage.tsx lines 61–103)
```tsx
className="rounded-blob-d hover:rounded-blob-b blob-interactive bg-white ..."
```
- `rounded-blob-d` — NEVER rule #6: NO blob shapes on ANY container
- `hover:rounded-blob-b blob-interactive` — NEVER rule #6 + #9: NO morphing on hover ON containers
- Card uses `opacity-80` — looks broken/disabled. Directory cards should be clearly differentiated from registered salons, but NOT visually degraded.

### ⚠️ BE CAREFUL
- `blob-interactive` class is still used on decorative elements elsewhere — DO NOT delete it from `globals.css`. Only remove it from this component.
- The "Nicht buchbar" badge should stay — it communicates the directory card's limited status correctly.
- Replace `opacity-80` with a subtle bottom border or dashed border to communicate the "not on Solen yet" state instead.

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 61–103** — `DirectoryCard` component

```tsx
function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  return (
    <motion.div variants={itemVariants}
      className="rounded-[20px] overflow-hidden hover:-translate-y-[3px] transition-all duration-[250ms]"
      style={{ border: "1.5px dashed rgba(26,18,9,.12)",
               background: "rgba(255,255,255,.55)",
               boxShadow: "0 1px 3px rgba(26,18,9,.06)" }}>
      {/* Photo */}
      <div className="h-36 relative overflow-hidden bg-s-bg-sunken">
        {entry.photo_url ? (
          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-s-ink/20">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        {/* Directory badge */}
        <span className="absolute top-2 right-2 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn"
          style={{ background: "rgba(26,18,9,.55)", color: "rgba(255,255,255,.85)" }}>
          Nicht buchbar
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-heading font-semibold text-s-ink text-sm leading-tight mb-1">{entry.name}</h3>
        {entry.address && <p className="text-xs text-s-ink/50 truncate font-body mb-2">{entry.address}</p>}
        {entry.google_rating != null && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3 h-3 fill-s-amber text-s-amber" />
            <span className="text-xs data-text font-bold text-s-ink/70">{entry.google_rating}</span>
            {entry.google_review_count > 0 && (
              <span className="text-xs text-s-ink/35">({entry.google_review_count})</span>
            )}
            <span className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/30 ml-1">Google</span>
          </div>
        )}
        <div className="flex gap-2">
          {entry.phone && (
            <a href={`tel:${entry.phone}`}
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-all">
              <Phone className="w-3 h-3 inline mr-1" />Anrufen
            </a>
          )}
          {entry.website && (
            <a href={entry.website} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-all">
              <Globe className="w-3 h-3 inline mr-1" />Website
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P7: DirectoryCard — remove rounded-blob-d/blob-interactive NEVER violations, dashed border style"`

---

## Phase 8 — SalonCard: Hover Physics + Warm Shadows (R32 execution here)

### Current state (SalonCard.tsx)
- `cardPopIn` animation variant — need to check if it uses spring physics
- Hover: currently `whileHover={{ y: -5 }}` or scale — need to confirm exact values
- Card bg: flat `bg-white` — needs glass Tier 2 per Zone 2 rules
- Box shadow: need to verify warm vs cold

### ⚠️ BE CAREFUL — SalonCard is used across the ENTIRE platform (Homepage, Category, Search, Salon Profile).
- Any change to SalonCard affects every section that shows salon listings.
- Test all variant="default" and variant="compact" after changes.
- Don't touch the `onCompareToggle`, `onFavoriteToggle`, `stampProgress` logic — functional-only.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)

**Card base container** — upgrade to Zone 2 glass:
```tsx
// Default variant main wrapper:
<motion.div
  variants={cardPopIn}
  whileHover={{ y: -5 }}  // translateY only — NO scale per NEVER rule
  transition={{ type: "spring", stiffness: 320, damping: 28 }}
  className="group rounded-[20px] overflow-hidden cursor-pointer"
  onClick={() => router.push(href)}
  onMouseEnter={() => { if (!prefetched.current) { router.prefetch(href); prefetched.current = true; } }}
  style={{ background: "rgba(255,255,255,.80)", backdropFilter: "blur(16px) saturate(1.2)",
           WebkitBackdropFilter: "blur(16px) saturate(1.2)",
           border: "1px solid rgba(255,255,255,.55)",
           boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
```

**Hover shadow upgrade** — add to the motion.div via `whileHover` style:
```tsx
whileHover={{
  y: -5,
  boxShadow: "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08), inset 0 1px 0 rgba(255,255,255,.80)",
}}
```

**Availability pill** (when `availability?.status === "available"`):
```tsx
<span className="inline-flex items-center gap-1.5 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn"
  style={{ background: "#EBF5EE", color: "#2E5E3A",
           boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
  <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF6F]" />
  {availability.slotsToday} frei heute
</span>
```

**Off-peak pill** (when `offPeakToday`):
```tsx
<span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn"
  style={{ background: "#EDE5D7", color: "#6B4005",
           boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
  -{offPeakToday.discount_percent}% Nebenzeit
</span>
```

**Git commit:** `git add components/SalonCard.tsx && git commit -m "CP-P8: SalonCard → glass Tier 2, spring hover, warm shadow upgrade, sage/amber availability pills"`

---

## Phase 9 — SalonCard Category Tags: V3 Inline Colours

### Current state (SalonCard.tsx lines 46–53)
```tsx
const CAT_COLOURS = {
  coiffeur: { bg: "bg-s-yellow-subtle", text: "text-s-yellow-text" },
  ...
};
```
- Uses Tailwind utility classes — BUT `bg-s-yellow-subtle` and `text-s-yellow-text` may not match the exact V3 token values.
- Verify in `tailwind.config.js` that these resolve to the correct warm values.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)
**Lines 46–53** — Replace with inline style spec to guarantee exact values:

```tsx
const CAT_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "rgba(212,135,10,.12)",  text: "#7A4A00" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(232,98,74,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2A5438" },
  makeup:     { bg: "rgba(201,169,110,.14)", text: "#6B4005" },
  waxing:     { bg: "rgba(107,163,200,.15)", text: "#1A4D72" },
};

// Usage in JSX — switch from className to inline style:
<span key={cat}
  className="text-[9px] font-heading font-bold uppercase tracking-[.10em] px-2 py-0.5 rounded-btn"
  style={{ background: CAT_COLOURS[cat]?.bg ?? "rgba(232,98,74,.10)",
           color: CAT_COLOURS[cat]?.text ?? "#7A2415",
           boxShadow: "0 1px 2px rgba(26,18,9,.05)" }}>
  {cat}
</span>
```

**Git commit:** `git add components/SalonCard.tsx && git commit -m "CP-P9: SalonCard category tags → exact inline colour spec per category"`

---

## Phase 10 — Map/List Toggle: V3 Pill Toggle

### Current state (CategoryPage.tsx lines 244–258)
```tsx
<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/10 text-sm font-body font-medium ...">
```
- `font-body font-medium` — should be `font-heading font-bold uppercase`
- `text-sm` — should be `text-xs tracking-[.06em]`

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 244–258** — Map/List toggle row

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-3">
  {/* Results count — left */}
  {!loading && salons.length > 0 && (
    <p className="text-[11px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/40">
      {salons.length} von {total} Salons
    </p>
  )}

  <div className="flex items-center gap-2 ml-auto">
    <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
    {/* Toggle pill */}
    <button
      onClick={() => { /* ... same logic ... */ }}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-all"
      style={{ border: "1px solid rgba(26,18,9,.10)",
               background: isMapView ? "#E8624A" : "rgba(255,255,255,.80)",
               color: isMapView ? "#fff" : "rgba(26,18,9,.65)",
               boxShadow: isMapView
                 ? "0 2px 4px rgba(232,98,74,.25)"
                 : "0 1px 2px rgba(26,18,9,.06)" }}>
      {isMapView ? <List size={14} /> : <MapIcon size={14} />}
      {isMapView ? "Liste" : "Karte"}
    </button>
  </div>
</div>
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P10: map/list toggle → V3 pill, results count, coral active state"`

---

## Phase 11 — Quartier Personalisation Banner: Glass Tier 2

### Current state (CategoryPage.tsx lines 226–237)
```tsx
<div className="flex items-center justify-between bg-s-coral/10 border border-s-coral/20 rounded-card px-4 py-2.5">
```
- Flat tinted bg
- `rounded-card` → `rounded-[16px]`
- Missing inset highlight

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 227–237**:
```tsx
<div className="flex items-center justify-between px-4 py-3 rounded-[16px]"
  style={{ background: "rgba(232,98,74,.08)", border: "1px solid rgba(232,98,74,.18)",
           boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.50)" }}>
  <span className="text-xs font-heading font-bold text-s-coral">
    📍 {topQuartierBanner} — dein meistbesuchtes Quartier
  </span>
  <button onClick={() => setBannerDismissed(true)}
    className="text-s-coral/60 hover:text-s-coral ml-4 text-[10px] font-heading uppercase tracking-[.08em]">
    ✕
  </button>
</div>
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P11: quartier banner → glass, coral border, uppercase dismiss"`

---

## Phase 12 — Salon Grid: Gap + Skeleton Polish

### Current state (CategoryPage.tsx lines 279–295)
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` ✅ good
- Skeleton: `<Skeleton variant="card" />` — check if Skeleton component uses `rounded-[20px]`

### ⚠️ BE CAREFUL
- Don't change grid columns — 3-col on desktop is correct.
- Only verify skeleton variant="card" uses the `rounded-[20px]` radius that matches the new SalonCard.

### Files to modify

#### Check [Skeleton.tsx](file:///c:/Users/sulod/solen/components/ui/Skeleton.tsx)
- If `variant="card"` has `rounded-card` → change to `rounded-[20px]`
- Keep the `animate-pulse` skeleton shimmer ✅

**Git commit:** `git add components/ui/Skeleton.tsx && git commit -m "CP-P12: skeleton card variant → rounded-[20px] to match SalonCard"`

---

## Phase 13 — Load More Button: V3 Pill

### Current state (CategoryPage.tsx lines 332–337)
```tsx
<button className="flex items-center gap-2 px-7 py-3 rounded-btn bg-white border border-s-ink/10 text-sm font-body font-medium ...">
```
- `font-body font-medium` → `font-heading font-bold uppercase`
- `bg-white border` → glass Tier 3 ambient

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 332–337** — Load more button:
```tsx
<button onClick={handleLoadMore} disabled={loadingMore}
  className="flex items-center gap-2 px-8 py-3 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em] transition-all disabled:opacity-50"
  style={{ border: "1px solid rgba(26,18,9,.10)",
           background: "rgba(255,255,255,.70)", backdropFilter: "blur(8px)",
           WebkitBackdropFilter: "blur(8px)",
           color: "rgba(26,18,9,.70)",
           boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
  {loadingMore ? <Spinner size="sm" /> : null}
  {loadingMore ? "Lade mehr…" : `${total - salons.length} weitere Salons`}
</button>
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P13: load more button → glass ambient, uppercase font-heading"`

---

## Phase 14 — Empty State: V3 Brand Empty State

### Current state (CategoryPage.tsx lines 282–288)
- `<EmptyState icon={Scissors} title=... message=...>` — generic

### Files to modify

#### Check [EmptyState.tsx](file:///c:/Users/sulod/solen/components/ui/EmptyState.tsx)
- Icon container should use `rounded-[20px]` with `bg-s-coral/10`
- Title: `font-heading font-bold`
- Message: `font-body italic text-s-ink/50`
- Add a coral pill CTA button: "Filter zurücksetzen" that calls `router.replace(pathname)`

**Git commit:** `git add components/ui/EmptyState.tsx && git commit -m "CP-P14: EmptyState → V3 branded, coral icon box, reset filter CTA"`

---

## Phase 15 — Per-Category Hero Gradients: Differentiated Palette

### Current state (CategoryPage.tsx lines 32–39)
```tsx
const categoryGradients = {
  coiffeur: "from-s-coral/10 via-white to-transparent",
  barbershop: "from-s-ink/5 via-white to-transparent",
  nails: "from-s-coral/8 via-white to-transparent",  // same as coiffeur!
  spa: "from-s-coral/8 via-white to-transparent",    // same!
  ...
};
```

### Files to modify

#### [MODIFY] [CategoryPage.tsx](file:///c:/Users/sulod/solen/components/CategoryPage.tsx)
**Lines 32–39** — Replace gradient map:

```tsx
const categoryGradients: Record<SalonCategory, string> = {
  coiffeur:   "from-[rgba(232,98,74,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
  barbershop: "from-[rgba(74,30,60,0.10)] via-[rgba(250,246,239,0.80)] to-transparent",
  nails:      "from-[rgba(232,98,74,0.10)] via-[rgba(242,193,68,0.06)] to-transparent",
  spa:        "from-[rgba(123,166,136,0.14)] via-[rgba(250,246,239,0.80)] to-transparent",
  makeup:     "from-[rgba(212,135,10,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
  waxing:     "from-[rgba(107,163,200,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
};
```

**Git commit:** `git add components/CategoryPage.tsx && git commit -m "CP-P15: per-category hero gradients — differentiated colours, not all coral"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Hero Bebas Neue + eyebrow | ✅ |
| P3 | FilterBar glass | ✅ |
| P4 | Filter pill constants | ✅ — but triggers HomeSearchBar check too |
| P5 | Price dropdown glass | ✅ |
| P6 | Sort dropdown glass | ✅ |
| P7 | DirectoryCard blob fix | ✅ — **highest priority** |
| P8 | SalonCard hover + glass | ⚠️ Touch last — affects all pages |
| P9 | SalonCard category tags | After P8 (same file) |
| P10 | Map/List toggle | ✅ |
| P11 | Quartier banner | ✅ |
| P12 | Skeleton `rounded-[20px]` | ✅ |
| P13 | Load more button | ✅ |
| P14 | Empty state | ✅ |
| P15 | Category gradients | ✅ |

> P1, P3–P7, P10–P15 can ALL run simultaneously.
> P8 (SalonCard) is the riskiest and affects all pages — run separately, verify thoroughly.
> P9 must run AFTER P8 (same file).

---

## Final Verification

```bash
npm run build

# Test all 6 category pages:
# /de/coiffeur, /de/barbershop, /de/nails, /de/spa, /de/makeup, /de/waxing
# Each should have the correct gradient + Bebas Neue H1

# Test filtering:
# - Select a Quartier pill → coral active style ✅
# - Open Price dropdown → glass floats correctly ✅
# - Open Sort dropdown → glass dropdown ✅
# - Click "Filter löschen" → pills reset ✅

# SalonCard:
# - Hover on desktop → translateY(-5px) only, NO scale ✅
# - Verify no blob shapes on DirectoryCard ✅
# grep -rn "rounded-blob" components/CategoryPage.tsx  # → 0 results

# Mobile:
# - Filter bar scrolls horizontally with pills ✅
# - SalonCard is full-width, single column ✅
```
