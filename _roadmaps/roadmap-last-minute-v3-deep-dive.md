# Last-Minute Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/last-minute/page.tsx` (224 lines). The inner `LastMinuteCard` component is the star of this page — treat it like SalonCard: **do not touch it**.
> **Zone: 2 (Soft Maximalist)** — Urgency-driven discovery. The live dot pulse (`animate-pulse`) and realtime slot removal are key UX features — keep them. The surrounding chrome (hero, filters, empty state, load more) gets V3 treatment.
>
> ⚠️ **CRITICAL:** `FilterBar`, `LastMinuteCard`, `EmptyState` — read before touching. The Supabase realtime `channel` subscription (lines 72–92) must remain completely untouched.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| Hero gradient (line 113) | `from-s-coral/8` — non-standard `/8` opacity variant (not in config) | → inline rgba |
| Hero h1 (line 116) | No eyebrow above; `text-2xl sm:text-4xl` — jump is inconsistent | Add coral eyebrow, fix to `text-[clamp(24px,4vw,40px)]` |
| Hero availability label (line 122) | `text-sm font-body` | → `text-xs font-heading uppercase tracking` |
| Live dot (line 119) | `animate-pulse` on `bg-s-coral rounded-full` — compliant ✅ | Keep |
| Category chips (line 137) | `text-xs font-medium rounded-pill` | → `font-heading uppercase tracking-[.06em]` |
| Category chip active (line 139) | `bg-s-coral text-white` ✅ — add coral glow | → add inline glow style |
| Category chip inactive bg (line 140) | `hover:bg-s-sand` — `s-sand` is a color not a bg token | → `hover:bg-s-bg-sunken` |
| Price chips (lines 153–157) | `data-text font-medium` | → `font-heading font-bold` |
| Clear filter button (line 165) | Plain `text-s-ink/40` no border | → add pill border outline |
| Loading state (lines 175–178) | `<Spinner size="lg" />` full-page | → skeleton grid |
| EmptyState CTA (line 187) | `font-body font-medium` | → `font-heading font-bold uppercase` |
| Load More button (line 211) | `font-body font-medium border-s-ink/10` | → `font-heading font-bold` + warm border |
| `motion.div layout` grid (line 195) | `layout` prop on motion.div — realtime card removal uses exit animations | ✅ Keep as-is |

---

## Phase 1 — Hero: Eyebrow + Warm Gradient

### Current state (lines 113–125)
```tsx
<div className="bg-gradient-to-b from-s-coral/8 via-white to-transparent pt-8 pb-6">
  <div className="flex items-center gap-3">
    <h1 className="font-heading font-bold text-2xl sm:text-4xl text-s-ink">
      Last-Minute Angebote
    </h1>
    <span className="w-2.5 h-2.5 rounded-full bg-s-coral animate-pulse" />
  </div>
  {total > 0 && <p className="text-sm text-s-ink/50 font-body">{total} verfügbare Termine heute</p>}
```

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 113–125** — hero block:
```tsx
<div className="pt-8 pb-6" style={{ background: "linear-gradient(180deg, rgba(232,98,74,.07) 0%, rgba(255,255,255,0) 100%)" }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-coral mb-2">
      letzte freie Termine
    </p>
    <div className="flex items-center gap-3">
      <h1 className="font-heading font-bold text-[clamp(24px,4vw,40px)] leading-tight text-s-ink dark:text-s-dm-text">
        Last-Minute Angebote
      </h1>
      {/* Live indicator dot — keep animate-pulse */}
      <span className="w-2.5 h-2.5 rounded-full bg-s-coral animate-pulse shrink-0" aria-label="Live" />
    </div>
    {total > 0 && (
      <p className="text-[10px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mt-2">
        {total} verfügbare Termine heute
      </p>
    )}
  </div>
</div>
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P1: hero → coral eyebrow, inline warm gradient, font-heading slot count"`

---

## Phase 2 — Category Filter Chips: font-heading + Glow

### Current state (lines 136–145)
```tsx
className={[
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors",
  selected ? "bg-s-coral text-white" : "bg-s-bg-sunken ... hover:bg-s-sand",
]}
```
**Issues:**
- `font-medium` → `font-heading font-bold uppercase tracking-[.06em]`
- `py-1.5` → `py-2` (better tap target)
- Active: add coral glow shadow
- Inactive hover: `hover:bg-s-sand` → `hover:bg-s-bg-sunken` (valid token)

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 136–145** — category chip className:
```tsx
className={[
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-all",
  selectedCategories.includes(key)
    ? "bg-s-coral text-white"
    : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.07] dark:hover:bg-white/[0.10]",
].join(" ")}
style={selectedCategories.includes(key) ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P2: category chips → font-heading uppercase, coral glow active, hover token fix"`

---

## Phase 3 — Price Filter Chips: font-heading

### Current state (lines 153–157)
```tsx
className={[
  "px-3 py-1.5 rounded-pill text-xs data-text font-medium transition-colors",
  selected ? "bg-s-coral text-white" : "... hover:bg-s-sand",
]}
```
- `data-text font-medium` → `font-heading font-bold`
- `py-1.5` → `py-2` (sync with category chips)

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 152–160** — price chip className:
```tsx
className={[
  "px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold transition-all",
  maxPrice === price
    ? "bg-s-coral text-white"
    : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.07] dark:hover:bg-white/[0.10]",
].join(" ")}
style={maxPrice === price ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P3: price chips → font-heading font-bold, coral glow active, sync with P2"`

---

## Phase 4 — Clear Filter Button

### Current state (lines 163–170)
```tsx
<button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-pill text-xs text-s-ink/40 hover:text-s-ink/60">
  <X size={12} /> Zurücksetzen
</button>
```
No border, pure text — hard to perceive as a button.

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 163–170** — reset button:
```tsx
<button
  onClick={() => { setSelectedCategories([]); setMaxPrice(null); }}
  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pill border border-s-ink/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/45 hover:border-s-ink/20 hover:text-s-ink/65 transition-colors">
  <X size={11} />
  Zurücksetzen
</button>
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P4: clear filter → outlined pill button, font-heading uppercase"`

---

## Phase 5 — Loading Skeleton Grid

### Current state (lines 175–178)
```tsx
{loading ? (
  <div className="flex justify-center py-20">
    <Spinner size="lg" />
  </div>
```
Replace with a skeleton grid that mirrors the 4-column `LastMinuteCard` layout.

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 175–178** — loading state:
```tsx
{loading ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="rounded-[16px] overflow-hidden bg-s-bg-surface dark:bg-s-dm-surface">
        {/* Image area */}
        <div className="aspect-[3/4] bg-s-bg-sunken dark:bg-s-dm-raised" />
        {/* Content area */}
        <div className="p-3 space-y-2">
          <div className="h-2.5 w-3/4 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
          <div className="h-2 w-1/2 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
          <div className="h-6 w-full bg-s-bg-sunken dark:bg-s-dm-raised rounded-full mt-3" />
        </div>
      </div>
    ))}
  </div>
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P5: loading → 4-col card skeleton grid, no spinner"`

---

## Phase 6 — Empty State CTA

### Current state (lines 179–192)
```tsx
<EmptyState
  icon={Clock}
  title="Gerade keine Last-Minute Slots"
  message="..."
  action={
    <Link className="... bg-s-coral text-white text-sm font-body font-medium ...">
      Coiffeure entdecken
    </Link>
  }
/>
```
- `font-body font-medium` → `font-heading font-bold uppercase`
- `text-sm` → `text-xs`

### ⚠️ Read `EmptyState` component before touching it — only the `action` prop changes here

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 185–190** — empty state action:
```tsx
action={
  <Link href={`/${locale}/coiffeur`}
    className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
    style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}>
    Coiffeure entdecken
  </Link>
}
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P6: empty state CTA → font-heading uppercase, coral inline style"`

---

## Phase 7 — Load More Button

### Current state (lines 208–215)
```tsx
<button className="flex items-center gap-2 px-6 py-2.5 rounded-btn bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-sm font-body font-medium text-s-ink ... hover:border-s-coral ...">
  {loadingMore ? <Spinner size="sm" /> : null}
  {loadingMore ? "Lade mehr…" : "Mehr laden"}
</button>
```
- `font-body font-medium text-sm` → `font-heading font-bold uppercase text-xs`
- `py-2.5` → `py-3`
- `border-s-ink/10` → `border-s-ink/[0.08]` (warm token)
- `hover:border-s-coral` ✅ — keep

### Files to modify

#### [MODIFY] [last-minute/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/last-minute/page.tsx)
**Lines 208–215** — load more button:
```tsx
<button
  onClick={handleLoadMore}
  disabled={loadingMore}
  className="flex items-center gap-2 px-6 py-3 rounded-btn bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08] text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral hover:text-s-coral transition-colors disabled:opacity-50">
  {loadingMore ? <Spinner size="sm" /> : null}
  {loadingMore ? "Lade mehr…" : "Mehr laden"}
</button>
```

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P7: load more → font-heading uppercase, py-3, warm border token"`

---

## Phase 8 — FilterBar Component: Read + V3 Audit

### ⚠️ Must read `components/FilterBar.tsx` before implementing

```bash
cat components/FilterBar.tsx
```

Expected issues:
- City/area selector pills — `font-medium` → `font-heading`
- Border radius — `rounded-card` or non-token
- This component appears above the category chips on the page

After reading, apply the same chip pattern as P2:
```tsx
// FilterBar chip — V3 spec:
className="px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] border border-s-ink/[0.08] text-s-ink/55 hover:border-s-coral/50 transition-colors"
```

**Git commit:** `git add components/FilterBar.tsx && git commit -m "LM-P8: FilterBar → font-heading uppercase chips, warm border tokens"`

---

## Phase 9 — Page Background + Container

### Current state (line 111)
```tsx
<div className="min-h-screen bg-white dark:bg-s-dm-bg">
```
Zone 2 allows a very subtle warm tint on the page background. Currently solid white is fine ✅, but add a warm base:

```tsx
<div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
```

This uses `s-bg-base` (`#FAF6EF`) instead of pure white — the warm cream base per V3 tokenization.

**Git commit:** `git add app/[locale]/last-minute/page.tsx && git commit -m "LM-P9: page bg → s-bg-base (warm cream) from pure white"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P8 | FilterBar (read first) | ✅ Start here |
| P1 | Hero eyebrow + gradient | ✅ Independent |
| P5 | Loading skeleton | ✅ Independent |
| P9 | Page bg token | ✅ Independent |
| P2 | Category chips | After P1 (visual context) |
| P3 | Price chips | After P2 (sync height) |
| P4 | Clear filter button | After P3 (same row) |
| P6 | Empty state CTA | ✅ Independent |
| P7 | Load more button | ✅ Independent |

> P1, P5, P8, P9 all parallel.
> P2→P3→P4 sequential (same filter row).

---

## LAST MINUTE COMPLIANCE CHECK

```bash
npm run build

# Non-token opacity variant removed:
grep -n "s-coral/8\b" app/[locale]/last-minute/page.tsx
# Expected: 0 (replaced with rgba)

# font-medium removed from chips:
grep -n "font-medium" app/[locale]/last-minute/page.tsx
# Expected: 0

# font-body removed from CTAs:
grep -n "font-body font-medium\|font-body font-bold" app/[locale]/last-minute/page.tsx
# Expected: 0

# Realtime subscription untouched:
grep -n "channel\|postgres_changes\|availability_slots" app/[locale]/last-minute/page.tsx
# Expected: all present on lines 72–92

# Manual checklist:
# ✅ Hero: "letzte freie Termine" eyebrow, warm inline gradient, font-heading count
# ✅ Live dot: animate-pulse preserved
# ✅ Category chips: font-heading uppercase, coral glow on active
# ✅ Price chips: font-heading, coral glow, synced height
# ✅ Clear filter: outlined pill button
# ✅ Loading: 4-col card skeleton, no spinner
# ✅ Empty state: coral inline-style CTA, font-heading
# ✅ Load more: font-heading uppercase, py-3
# ✅ FilterBar: font-heading chips
# ✅ Page bg: s-bg-base (warm cream)
# ✅ LastMinuteCard: NOT TOUCHED
# ✅ Realtime subscription: NOT TOUCHED
```
