# Discover Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/discover/page.tsx` (269 lines), `components/discovery/CategoryPills.tsx`, `components/discovery/GenderToggle.tsx`, `components/discovery/SearchBar.tsx`, `components/discovery/FeaturedBoards.tsx`, `components/discovery/ForYouSection.tsx`, `components/discovery/FilterDrawer.tsx`, `components/discovery/StyleNamePills.tsx`, `components/discovery/PatternSelector.tsx`, `components/discovery/DiscoveryEmptyState.tsx`, `components/discovery/DiscoveryErrorState.tsx`, `components/discovery/PostFromDiscover.tsx`.
> **Zone: 2 (Soft Maximalist)** — Discovery is inspirational, visual-heavy. Glass Tier 2 allowed on interactive filter elements. Max 1 ambient blob, 50% opacity. Bebas Neue NOT allowed (this is editorial, not headline).
>
> ⭐ **CARD PRESERVATION RULE: `ItemCard.tsx`, `VideoCard.tsx`, and `MasonryGrid.tsx` are COMPLETELY OFF-LIMITS. Do not touch them. Do not read them. The user explicitly wants these preserved exactly as they are.**

---

## Key Principle for Discover

> The cards ARE the product. Everything else — header, filters, boards, empty states — is **scaffolding** that must recede and serve the cards. Clean, minimal scaffolding → cards pop more.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Page header + subline | 🟢 Low | Typography only, no logic |
| P2 — DiscoverySearchBar | 🟢 Low | Debounce logic untouched, style only |
| P3 — CategoryPills | 🟢 Low | Visual only, no logic |
| P4 — GenderToggle | 🟢 Low | Visual only, no logic |
| P5 — PatternSelector | 🟡 Medium | Read file first — unknown structure |
| P6 — StyleNamePills | 🟡 Medium | Read file first — unknown structure |
| P7 — FeaturedBoards section label | 🟢 Low | Typography only |
| P8 — FeaturedBoards cards | 🟡 Medium | hover translate — preserve, just fix rounded-card |
| P9 — ForYouSection | 🟡 Medium | Read file first — renders its own sub-feed |
| P10 — FilterDrawer | 🔴 High | Mobile-only drawer — read before touching |
| P11 — DiscoveryEmptyState | 🟢 Low | Small component |
| P12 — DiscoveryErrorState | 🟢 Low | Small component |
| P13 — Infinite scroll loading indicator | 🟢 Low | Replace Spinner with dots |
| P14 — PostFromDiscover FAB | 🟡 Medium | Floating action button — read first |
| P15 — ProfileSetupModal | 🟡 Medium | Modal on first visit — read GlassModal spec |

---

## Phase 1 — Page Header: Eyebrow + Subline

### Current state (discover/page.tsx lines 168–172)
```tsx
<div className="mb-6 flex items-start justify-between">
  <div>
    <h1 className="font-heading font-bold text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-s-ink mb-1">Discover</h1>
    <p className="text-sm text-s-ink/40">Find your next look</p>
  </div>
  <FilterDrawer ... />  {/* Mobile only */}
</div>
```
**Issues:**
- `h1` — `clamp(28px,4vw,44px)` is correct ✅ but missing eyebrow above
- Subline: `"Find your next look"` — English on a German platform. Change to `"Dein nächster Look"` or the translation key
- Subline: `text-sm font-body` → `text-xs font-heading uppercase tracking-[.10em]`

### ⚠️ BE CAREFUL — `FilterDrawer` is a sibling in this flex row. Keep it exactly where it is.

### Files to modify

#### [MODIFY] [discover/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/discover/page.tsx)
**Lines 167–185** — header block:
```tsx
<div className="mb-6 flex items-start justify-between gap-4">
  <div>
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
      solen discover
    </p>
    <h1 className="font-heading font-bold text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
      Discover
    </h1>
    <p className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mt-1.5">
      Dein nächster Look
    </p>
  </div>
  <FilterDrawer ... />
</div>
```

**Git commit:** `git add app/[locale]/discover/page.tsx && git commit -m "DISC-P1: header → coral eyebrow, German subline, font-heading uppercase"`

---

## Phase 2 — DiscoverySearchBar: V3 Input Spec

### Current state (SearchBar.tsx lines 27–41)
```tsx
<div className="relative">
  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
  <input className="w-full pl-9 pr-8 py-2.5 rounded-pill bg-s-bg-sunken border border-s-ink/10 text-sm ..." />
```
**Issues:**
- `rounded-pill` on a search bar — correct for Discovery Zone 2 ✅
- `py-2.5` → `py-3` (slightly taller — 44px min tap target)
- Missing `focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral` — no focus ring currently
- `text-sm` → `text-sm` ✅ (search input can keep sm)
- Debounce logic (300ms) — UNTOUCHED

### Files to modify

#### [MODIFY] [SearchBar.tsx](file:///c:/Users/sulod/solen/components/discovery/SearchBar.tsx)
**Lines 29–35** — input element:
```tsx
<input
  type="search"
  value={local}
  onChange={(e) => handleChange(e.target.value)}
  placeholder={placeholder}
  className="w-full pl-9 pr-8 py-3 rounded-pill bg-s-bg-sunken dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.06] text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 dark:focus:border-s-coral transition-colors"
/>
```

**Git commit:** `git add components/discovery/SearchBar.tsx && git commit -m "DISC-P2: SearchBar → py-3, focus ring, warm border token, type=search"`

---

## Phase 3 — CategoryPills: font-heading + Active State

### Current state (CategoryPills.tsx lines 25–30)
```tsx
className={[
  "px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-colors",
  selected === key
    ? "bg-s-coral text-white"
    : "bg-s-ink/5 text-s-ink/60 hover:bg-s-ink/10",
].join(" ")}
```
**Issues:**
- `font-medium` → `font-heading font-semibold`
- `text-sm` → `text-xs` (pill labels should be compact)
- Active: `bg-s-coral text-white` ✅ but add coral glow shadow

### Files to modify

#### [MODIFY] [CategoryPills.tsx](file:///c:/Users/sulod/solen/components/discovery/CategoryPills.tsx)
**Lines 25–30** — button className:
```tsx
className={[
  "px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-all duration-150",
  selected === key
    ? "bg-s-coral text-white"
    : "bg-s-ink/[0.05] dark:bg-white/[0.07] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12]",
].join(" ")}
style={selected === key ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
```

**Git commit:** `git add components/discovery/CategoryPills.tsx && git commit -m "DISC-P3: CategoryPills → font-heading uppercase, coral glow on active"`

---

## Phase 4 — GenderToggle: font-heading + Active Styling

### Current state (GenderToggle.tsx lines 19–33)
```tsx
<div className="flex gap-1 bg-s-ink/5 rounded-pill p-0.5">
  <button className="px-3 py-1.5 rounded-pill text-xs font-medium transition-colors"
    selected: "bg-white text-s-ink shadow-warm-sm"
    inactive: "text-s-ink/40"
  />
```
- `font-medium` → `font-heading font-semibold`
- Active: `shadow-warm-sm` ✅ — correct
- Track `bg-s-ink/5` ✅ — correct
- `p-0.5` ✅ — correct

### Files to modify

#### [MODIFY] [GenderToggle.tsx](file:///c:/Users/sulod/solen/components/discovery/GenderToggle.tsx)
**Lines 24–29** — button className:
```tsx
className={[
  "px-3 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-all duration-150",
  selected === key
    ? "bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text shadow-warm-sm"
    : "text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink/60 dark:hover:text-s-dm-text/60",
].join(" ")}
```

**Git commit:** `git add components/discovery/GenderToggle.tsx && git commit -m "DISC-P4: GenderToggle → font-heading uppercase 10px, consistent with CategoryPills"`

---

## Phase 5 — PatternSelector: Read + Restyle

### ⚠️ Must read before implementing

```bash
cat components/discovery/PatternSelector.tsx
```

Expected issues:
- Texture/pattern buttons likely use `rounded-card` or `rounded-btn`
- Font probably `font-medium` or `font-body`
- Visual texture previews (images) — preserve images, restyle the frame

### Files to modify

#### [MODIFY] [PatternSelector.tsx](file:///c:/Users/sulod/solen/components/discovery/PatternSelector.tsx)

Pattern option wrapper:
```tsx
// Active pattern chip — with texture preview image:
<button className={`flex items-center gap-2 px-3 py-2 rounded-pill border text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-all ${
  selected === key
    ? "border-s-coral bg-s-coral/[0.08] text-s-coral"
    : "border-s-ink/[0.07] text-s-ink/50 hover:border-s-coral/40"
}`}>
  {/* texture preview preserved */}
  {label}
</button>
```

Section label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 mb-2">
  Textur
</p>
```

**Git commit:** `git add components/discovery/PatternSelector.tsx && git commit -m "DISC-P5: PatternSelector → font-heading uppercase pills, eyebrow label"`

---

## Phase 6 — StyleNamePills: Read + Restyle

### ⚠️ Must read before implementing

```bash
cat components/discovery/StyleNamePills.tsx
```

Expected issues:
- Style name chips (Bob, Pixie, Balayage etc) similar to CategoryPills
- Font probably `font-body` or `text-xs font-medium`

### Files to modify

#### [MODIFY] [StyleNamePills.tsx](file:///c:/Users/sulod/solen/components/discovery/StyleNamePills.tsx)

Style name pill:
```tsx
<button className={`px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap border transition-all duration-150 ${
  selected === style
    ? "border-s-amber bg-s-amber/[0.08] text-s-amber"
    : "border-s-ink/[0.07] text-s-ink/50 hover:border-s-amber/40"
}`}>
  {style}
</button>
```

> Using amber for styles (not coral) to visually distinguish style tags from category filter tags.

Section label:
```tsx
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 mb-2">
  Style
</p>
```

**Git commit:** `git add components/discovery/StyleNamePills.tsx && git commit -m "DISC-P6: StyleNamePills → amber active pills, font-heading uppercase, eyebrow label"`

---

## Phase 7 — FeaturedBoards Section Label

### Current state (FeaturedBoards.tsx line 35)
```tsx
<h3 className="text-sm font-medium text-s-ink/60 mb-2">Featured Collections</h3>
```
**Issues:**
- `text-sm font-medium` → eyebrow style
- `"Featured Collections"` → German: `"Empfohlene Kollektionen"` or use i18n

### Files to modify

#### [MODIFY] [FeaturedBoards.tsx](file:///c:/Users/sulod/solen/components/discovery/FeaturedBoards.tsx)
**Line 34–35** — section header:
```tsx
<div className="mb-3 flex items-center gap-2">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30">
    Kollektionen
  </p>
</div>
```

**Git commit:** `git add components/discovery/FeaturedBoards.tsx && git commit -m "DISC-P7: FeaturedBoards label → eyebrow 9px uppercase, German label"`

---

## Phase 8 — FeaturedBoards Cards: rounded-card Fix

### Current state (FeaturedBoards.tsx lines 45–58)
```tsx
<button className="flex-shrink-0 w-36 rounded-card overflow-hidden border border-s-ink/5 hover:shadow-warm-lg hover:-translate-y-[5px] transition-all duration-250">
  <div className="grid grid-cols-2 gap-0.5 aspect-square bg-s-ink/5">
    {board.cover_images.slice(0, 4).map(img => ...)}
  </div>
  <div className="p-2">
    <p className="text-xs font-medium text-s-ink truncate">{board.name}</p>
    <p className="text-[10px] text-s-ink/40">{board.pin_count} pins</p>
  </div>
</button>
```
**Issues:**
- `rounded-card` → `rounded-[12px]`
- `hover:-translate-y-[5px]` ✅ — lift hover is correct for Zone 2
- `hover:shadow-warm-lg` ✅ — correct warm shadow on lift
- `font-medium` → `font-heading font-semibold`
- Pin count → eyebrow micro label
- Board width `w-36` (144px) — consider `w-40` (160px) for better image mosaic proportions

### Files to modify

#### [MODIFY] [FeaturedBoards.tsx](file:///c:/Users/sulod/solen/components/discovery/FeaturedBoards.tsx)
**Lines 45–58** — board card:
```tsx
<button key={board.id}
  onClick={() => onBoardSelect({ ... })}
  className="flex-shrink-0 w-40 rounded-[12px] overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.05] hover:shadow-warm-lg hover:-translate-y-[6px] active:scale-[0.98] transition-all duration-250">
  {/* 2x2 image mosaic — preserved */}
  <div className="grid grid-cols-2 gap-px aspect-square overflow-hidden"
    style={{ background: "rgba(26,18,9,.05)" }}>
    {board.cover_images.slice(0, 4).map((img, i) => (
      <div key={i} className="relative">
        <Image src={img} alt="" fill className="object-cover" sizes="80px" />
      </div>
    ))}
  </div>
  {/* Board info */}
  <div className="px-3 py-2.5">
    <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{board.name}</p>
    <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35 mt-0.5">
      {board.pin_count} Pins
    </p>
  </div>
</button>
```

**Git commit:** `git add components/discovery/FeaturedBoards.tsx && git commit -m "DISC-P8: FeaturedBoards cards → rounded-[12px], w-40, font-heading, German pin count"`

---

## Phase 9 — ForYouSection: Read + Section Header

### ⚠️ Must read before implementing

```bash
cat components/discovery/ForYouSection.tsx
```

Expected issues:
- Section header: `font-medium text-sm` → eyebrow
- Loading state: spinner or skeleton
- The item grid inside: **do NOT touch** if it renders ItemCard/VideoCard

### Files to modify

#### [MODIFY] [ForYouSection.tsx](file:///c:/Users/sulod/solen/components/discovery/ForYouSection.tsx)

Section header:
```tsx
<div className="mb-4 flex items-center gap-2">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30">
    Für dich
  </p>
  <div className="flex-1 h-px bg-s-ink/[0.05]" />
</div>
```

If there's a loading state, replace spinner with:
```tsx
<div className="flex gap-3 overflow-hidden">
  {[...Array(3)].map((_, i) => (
    <div key={i} className="flex-shrink-0 w-40 aspect-[3/4] rounded-[12px] bg-s-bg-sunken animate-pulse" />
  ))}
</div>
```

**Git commit:** `git add components/discovery/ForYouSection.tsx && git commit -m "DISC-P9: ForYouSection → eyebrow 'Für dich', divider line, skeleton loading"`

---

## Phase 10 — FilterDrawer: Read + V3 Drawer Style

### ⚠️ Must read `components/discovery/FilterDrawer.tsx` before implementing

```bash
cat components/discovery/FilterDrawer.tsx
```

Expected issues:
- Trigger button: probable `rounded-btn` or `rounded-card`
- Drawer panel: likely `rounded-card glass` or `bg-white` — needs Zone 2 treatment
- Filter labels inside: `font-body` → `font-heading`
- Apply/reset buttons: check style

### Files to modify

#### [MODIFY] [FilterDrawer.tsx](file:///c:/Users/sulod/solen/components/discovery/FilterDrawer.tsx)

Trigger button (mobile filter icon):
```tsx
<button onClick={() => setOpen(true)}
  className="flex items-center gap-1.5 px-3 py-2.5 rounded-pill border border-s-ink/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors"
  style={hasActiveFilters ? { borderColor: "rgba(232,98,74,.40)", color: "#E8624A", background: "rgba(232,98,74,.06)" } : undefined}>
  <SlidersHorizontal size={13} />
  Filter {hasActiveFilters && <span className="ml-0.5 text-s-coral">·</span>}
</button>
```

Drawer panel:
```tsx
<div className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-s-dm-surface shadow-warm-float flex flex-col">
  {/* Header */}
  <div className="px-5 py-4 border-b border-s-ink/[0.06] flex items-center justify-between">
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30">Filter</p>
      <p className="font-heading font-bold text-base text-s-ink">Suche verfeinern</p>
    </div>
    <button onClick={() => setOpen(false)} className="p-2 rounded-[8px] hover:bg-s-ink/[0.04]">
      <X size={16} className="text-s-ink/50" />
    </button>
  </div>
  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
    {/* Filter groups — preserve CategoryPills, GenderToggle etc inside */}
  </div>
  {/* Footer */}
  <div className="px-5 py-4 border-t border-s-ink/[0.06] flex gap-2">
    <button onClick={onReset}
      className="flex-1 py-3 rounded-btn border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/50 hover:border-s-ink/20 transition-colors">
      Zurücksetzen
    </button>
    <button onClick={() => setOpen(false)}
      className="flex-1 py-3 rounded-btn text-white text-xs font-heading font-bold"
      style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
      Anwenden
    </button>
  </div>
</div>
```

**Git commit:** `git add components/discovery/FilterDrawer.tsx && git commit -m "DISC-P10: FilterDrawer → warm white panel, eyebrow header, coral apply CTA"`

---

## Phase 11 — DiscoveryEmptyState

### ⚠️ Read file before implementing

```bash
cat components/discovery/DiscoveryEmptyState.tsx
```

Expected structure: icon + message + reset CTA. Replace with Zone 2 warm empty state.

### Files to modify

#### [MODIFY] [DiscoveryEmptyState.tsx](file:///c:/Users/sulod/solen/components/discovery/DiscoveryEmptyState.tsx)
```tsx
export default function DiscoveryEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-5"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <Search size={26} className="text-s-coral/60" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-2">
        Kein Ergebnis
      </p>
      <p className="font-heading font-semibold text-base text-s-ink mb-1">Nichts gefunden</p>
      <p className="text-xs font-body text-s-ink/40 mb-5 max-w-xs">
        Versuche einen anderen Filter oder setze die Suche zurück.
      </p>
      {onReset && (
        <button onClick={onReset}
          className="px-5 py-3 rounded-btn border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors">
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
```

**Git commit:** `git add components/discovery/DiscoveryEmptyState.tsx && git commit -m "DISC-P11: DiscoveryEmptyState → coral icon box, eyebrow, German text"`

---

## Phase 12 — DiscoveryErrorState

### ⚠️ Read file first

```bash
cat components/discovery/DiscoveryErrorState.tsx
```

### Files to modify

#### [MODIFY] [DiscoveryErrorState.tsx](file:///c:/Users/sulod/solen/components/discovery/DiscoveryErrorState.tsx)
```tsx
export default function DiscoveryErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <AlertCircle size={24} className="text-s-coral" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-2">
        Fehler
      </p>
      <p className="font-heading font-semibold text-base text-s-ink mb-1">Laden fehlgeschlagen</p>
      <p className="text-xs font-body text-s-ink/40 mb-5">Überprüfe deine Verbindung und versuche es erneut.</p>
      <button onClick={onRetry}
        className="px-5 py-3 rounded-btn text-white text-xs font-heading font-bold"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}>
        Erneut versuchen
      </button>
    </div>
  );
}
```

**Git commit:** `git add components/discovery/DiscoveryErrorState.tsx && git commit -m "DISC-P12: DiscoveryErrorState → coral icon box, eyebrow, coral retry CTA"`

---

## Phase 13 — Infinite Scroll Loading Indicator

### Current state (discover/page.tsx lines 250–254)
```tsx
{loading && items.length > 0 && (
  <div className="flex justify-center py-8">
    <Spinner size="md" />
  </div>
)}
```
- Replace Spinner with animated dots — more consistent with the visual/editorial aesthetic of Discover

### Files to modify

#### [MODIFY] [discover/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/discover/page.tsx)
**Lines 250–254** — infinite scroll indicator:
```tsx
{loading && items.length > 0 && (
  <div className="flex items-center justify-center gap-1.5 py-10">
    {[0, 1, 2].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50"
        style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
    ))}
  </div>
)}
```

Add keyframe to globals.css:
```css
@keyframes pulse-dot {
  0%, 100% { opacity: .3; transform: scale(1); }
  50%       { opacity: 1;  transform: scale(1.4); }
}
```

Or use existing Tailwind `animate-pulse` with staggered delays via inline style.

**Git commit:** `git add app/[locale]/discover/page.tsx && git commit -m "DISC-P13: infinite scroll → coral pulse dots, remove Spinner"`

---

## Phase 14 — PostFromDiscover FAB

### ⚠️ Must read `components/discovery/PostFromDiscover.tsx` before implementing

```bash
cat components/discovery/PostFromDiscover.tsx
```

Expected issues:
- FAB button: probably coral circle — check for `hover:scale` (NEVER)
- If `hover:scale-110` → replace with `hover:brightness-110`

### Files to modify

#### [MODIFY] [PostFromDiscover.tsx](file:///c:/Users/sulod/solen/components/discovery/PostFromDiscover.tsx)

FAB button:
```tsx
<button onClick={() => setOpen(true)}
  className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-[0.96] transition-all"
  style={{
    background: "#E8624A",
    boxShadow: "0 4px 12px rgba(232,98,74,.40), 0 12px 32px rgba(232,98,74,.22)"
  }}>
  <Plus size={20} strokeWidth={2.5} />
</button>
```

> No `hover:scale` — use `active:scale-[0.96]` for tap feedback only.

**Git commit:** `git add components/discovery/PostFromDiscover.tsx && git commit -m "DISC-P14: PostFromDiscover FAB → coral glow shadow, no hover scale, active:scale-[0.96]"`

---

## Phase 15 — ProfileSetupModal: Zone 2 Modal

### ⚠️ Must read `components/discovery/ProfileSetupModal.tsx` before implementing

```bash
cat components/discovery/ProfileSetupModal.tsx
```

Expected issues (8622 bytes suggests a multi-step flow):
- Modal panel: likely `rounded-card glass` → upgrade to warm background, no cold glass
- Step indicators: dots or progress bar
- CTA buttons: `font-body font-medium` → `font-heading font-bold uppercase`

### Files to modify

#### [MODIFY] [ProfileSetupModal.tsx](file:///c:/Users/sulod/solen/components/discovery/ProfileSetupModal.tsx)

Modal card:
```tsx
<div className="relative w-full max-w-md rounded-[18px] overflow-hidden"
  style={{
    background: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(26,18,9,.12), 0 32px 72px rgba(26,18,9,.10)"
  }}>
  {/* Header */}
  <div className="px-6 pt-6 pb-4 border-b border-s-ink/[0.06]">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-coral mb-1">
      Profil einrichten
    </p>
    <h2 className="font-heading font-bold text-lg text-s-ink">Dein Discover-Profil</h2>
    <p className="text-xs font-body text-s-ink/45 mt-1">Personalisiere deinen Feed einmalig</p>
  </div>
  <div className="px-6 py-5">
    {children}
  </div>
</div>
```

Step option pills:
```tsx
<button className={`px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-all ${
  selected ? "border-s-coral bg-s-coral/[0.08] text-s-coral" : "border-s-ink/[0.08] text-s-ink/55 hover:border-s-coral/40"
}`}>
  {label}
</button>
```

CTA:
```tsx
<button onClick={onNext}
  className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
  Weiter
</button>
```

**Git commit:** `git add components/discovery/ProfileSetupModal.tsx && git commit -m "DISC-P15: ProfileSetupModal → warm white modal, eyebrow, coral step pills, coral CTA"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Page header eyebrow | ✅ Start here |
| P2 | SearchBar focus ring | ✅ Independent |
| P3 | CategoryPills | ✅ Independent |
| P4 | GenderToggle | ✅ Independent (with P3) |
| P5 | PatternSelector (read first) | ✅ Independent |
| P6 | StyleNamePills (read first) | ✅ Independent |
| P7 | FeaturedBoards label | ✅ Independent |
| P8 | FeaturedBoards cards | After P7 (same file) |
| P9 | ForYouSection (read first) | ✅ Independent |
| P10 | FilterDrawer (read first) | ✅ Independent — most complex |
| P11 | DiscoveryEmptyState | ✅ Independent |
| P12 | DiscoveryErrorState | ✅ Independent (with P11) |
| P13 | Infinite scroll dots | ✅ Independent |
| P14 | PostFromDiscover FAB (read first) | ✅ Independent |
| P15 | ProfileSetupModal (read first) | Last — largest file |

> P1–P9, P11–P14 can run in parallel across multiple tabs.
> P10 and P15 sequential within themselves (read → implement).
> **ItemCard, VideoCard, MasonryGrid: DO NOT TOUCH.**

---

## DISCOVER PAGE COMPLIANCE CHECK

```bash
npm run build

# Cards preserved:
grep -rn "ItemCard\|VideoCard\|MasonryGrid" app/[locale]/discover/page.tsx
# Expected: still imported and used unchanged

# No font-medium on discover filter components:
grep -rn "font-medium\b" components/discovery/CategoryPills.tsx components/discovery/GenderToggle.tsx components/discovery/FeaturedBoards.tsx
# Expected: 0 results

# No rounded-card:
grep -rn "rounded-card" components/discovery/
# Expected: 0 results

# No hover:scale on FAB:
grep -rn "hover:scale" components/discovery/PostFromDiscover.tsx
# Expected: 0 results

# Manual checklist:
# ✅ Header: coral "solen discover" eyebrow, German subline
# ✅ SearchBar: focus ring visible, py-3 height
# ✅ CategoryPills: uppercase font-heading, coral glow on active
# ✅ GenderToggle: uppercase font-heading, consistent height w/ CategoryPills
# ✅ FeaturedBoards: "Kollektionen" label, 12px radius cards, hover lift preserved
# ✅ ForYouSection: "Für dich" eyebrow with divider
# ✅ FilterDrawer: warm white panel, coral Apply CTA
# ✅ EmptyState: coral icon box, German, outlined reset button
# ✅ ErrorState: coral icon box, German, coral retry CTA
# ✅ Infinite scroll: coral pulse dots (no spinner)
# ✅ FAB: coral glow, no hover scale
# ✅ ItemCard / VideoCard / MasonryGrid: COMPLETELY UNCHANGED
```
