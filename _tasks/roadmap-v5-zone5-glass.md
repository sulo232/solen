# V5 Zone 5 Roadmap — Glassmorphism (Medium Tier)
`_tasks/roadmap-v5-zone5-glass.md`

> **Scope:** `app/globals.css`, `components/ui/FilterBar.tsx`, `components/ui/HomeSearchBar.tsx`, tooltip in `SalonCard.tsx`, bottom sheets
> **Target:** Apply `.glass-pill` to filter chips, `.glass-search` to search bar, `.glass-frost` to bottom sheets + tooltips. All Zone 1+2 only.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 5.1 | 🟢 SAFE | Nothing | CSS addition |
| 5.2 | 🟢 SAFE | Filter pills look different | Visual change only, no logic |
| 5.3 | 🟢 SAFE | Nothing | Tooltip style only |
| 5.4 | 🟡 MEDIUM | Bottom sheet layout shift | Test on iOS Safari |

---

## 🤖 Phase 5.1 — Add `.glass-pill` dark variant to `globals.css`

Already added `.glass-pill` light class in Zone 1 roadmap. This phase adds the dark variant if missing:

**File**: `[MODIFY] app/globals.css`

```css
/* Verify these exist — add if missing */
.glass-pill {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid rgba(26, 18, 9, 0.09);
  box-shadow: 0 1px 2px rgba(26,18,9,.06);
}

.dark .glass-pill {
  background: rgba(30, 23, 16, 0.65);
  border: 1px solid rgba(245, 238, 228, 0.09);
}

/* glass-pill active state (when filter is selected) */
.glass-pill-active {
  background: rgba(232, 98, 74, 0.12);
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  border: 1px solid rgba(232, 98, 74, 0.30);
  color: #7A2415;
}

.dark .glass-pill-active {
  background: rgba(232, 98, 74, 0.20);
  border: 1px solid rgba(232, 98, 74, 0.35);
  color: #F07560;
}
```

**Commit**: `git commit -m "phase 5.1: add glass-pill and glass-pill-active CSS tokens"`

---

## 🤖 Phase 5.2 — Apply glass to FilterBar pills

**File**: `[MODIFY] components/ui/FilterBar.tsx` (lines 75–99)

BEFORE (inactive pill):
```tsx
'bg-white/60 backdrop-blur-sm border border-s-ink/[0.06] text-s-ink/70 dark:text-s-dm-text/70 hover:bg-s-coral-subtle hover:border-s-coral/30'
```

AFTER:
```tsx
'glass-pill text-s-ink/65 dark:text-s-dm-text/65 hover:border-s-coral/30 hover:text-s-ink dark:hover:text-s-dm-text'
```

BEFORE (active pill):
```tsx
'bg-s-coral text-white border border-s-coral shadow-coral-glow'
```

AFTER:
```tsx
'glass-pill-active shadow-coral-glow'
```

The `ChevronDown` on pills:
```tsx
// No change needed — inherits text color
```

Filter chips (the `activeFilters` chip row, lines 127–142):
```tsx
// BEFORE:
className="flex items-center gap-1 px-3 py-1 rounded-pill bg-s-coral-subtle text-s-coral-text text-xs"

// AFTER:
className="flex items-center gap-1 px-3 py-1 rounded-pill glass-pill-active text-xs font-body"
```

✅ DO: use `.glass-pill` + `.glass-pill-active` CSS classes — no inline backdrop-filter
❌ DON'T: add `glass-pill` to the FilterDrawer or FilterBottomSheet content cards — those are solid content, not floating pills

> ⚠️ **BE CAREFUL**: FilterBar is used in Zone 1 (homepage) AND Zone 2 (category pages). Both allow glass. However, if FilterBar is ever used in Zone 3 (booking flow), `glass-pill` must NOT apply. The `zone` prop on FilterBar can gate this: `zone <= 2 ? 'glass-pill' : 'bg-[--raised] border border-s-ink/[0.06]'`

**Commit**: `git commit -m "phase 5.2: FilterBar pills use glass-pill and glass-pill-active tokens"`

---

## 🤖 Phase 5.3 — Glass tooltip in SalonCard

**File**: `[MODIFY] components/SalonCard.tsx` (lines 290–296, AI reason tooltip)

BEFORE:
```tsx
<div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-white dark:bg-s-dm-surface rounded-card shadow-elevation-3 border border-s-ink/5 ...">
```

AFTER:
```tsx
<div className="absolute bottom-full right-0 mb-2 px-3 py-2 glass-frost rounded-card shadow-elevation-3 text-xs text-s-ink dark:text-s-dm-text w-48 ...">
```

`glass-frost` replaces `bg-white` — the tooltip is floating UI, so glass is allowed here.

**Commit**: `git commit -m "phase 5.3: SalonCard AI tooltip uses glass-frost"`

---

## 🤖 Phase 5.4 — Glass bottom sheets and filter drawer

**File**: `[MODIFY] components/ui/FilterBottomSheet.tsx`
**File**: `[MODIFY] components/ui/FilterDrawer.tsx`

Both of these are floating overlays — they qualify for `.glass-frost`.

On the outer wrapper/container of each:

BEFORE (common pattern):
```tsx
className="... bg-white dark:bg-s-dm-surface ..."
```

AFTER:
```tsx
className="... glass-frost ..."
```

> ⚠️ **BE CAREFUL**: 
> - FilterBottomSheet has a handle bar (`w-10 h-1 rounded-full bg-s-ink/20`) at the top — keep it unchanged
> - The content inside the sheet (filter option buttons) should NOT be glass — only the sheet container background
> - On iOS, `backdrop-filter` on a `position: fixed` element can cause glitches. Test with `position: sticky` fallback if rendering breaks.
> - `.glass-frost` on a bottom sheet that contains scrollable content — add `overflow-hidden` to the container so the blur doesn't bleed

**Commit**: `git commit -m "phase 5.4: FilterBottomSheet and FilterDrawer use glass-frost"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 5.1 | 🤖 | Add glass CSS tokens | Nothing (or Zone 1 Phase 1.1) |
| Phase 5.2 | 🤖 | FilterBar glass pills | 5.1 |
| Phase 5.3 | 🤖 | SalonCard tooltip glass | 5.1 |
| Phase 5.4 | 🤖 | Bottom sheet + drawer glass | 5.1 |

5.2, 5.3, 5.4 can all run in parallel after 5.1.
