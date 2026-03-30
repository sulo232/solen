# Search Flow Redesign — Design Spec
Date: 2026-03-30

## Overview

Redesign `components/ui/GuidedSearch.tsx` to match the Airbnb-style bottom-sheet search pattern described in the Search Flow Spec. The component already exists as a modal overlay — this spec is a targeted refactor, not a rebuild.

---

## What Changes

### 1. Trigger Pill — 3-segment (Was · Wo · Wann)

**Current:** Single unified bar with a search icon and one placeholder line.

**New:** Three segments separated by vertical dividers, each showing its own label + current value. Applied universally (mobile + desktop).

Spec:
- Container: `bg-white`, `border: 1px solid rgba(26,18,9,0.10)`, `border-radius: 999px`, height `56px`, `box-shadow: 0 2px 12px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.04)`
- Each segment: `flex: 1`, padding `10px 16px`. Label (top): Syne 9px 700 uppercase `#111`. Value (bottom): DM Sans 12px, muted when empty, ink when filled.
- Divider: `1px solid #E8E8E8`, height `24px`, vertically centred.
- Search button (right): coral circle `36×36px`, magnifying glass icon 16px white.
- Tapping a segment opens the sheet with that step pre-focused.

Default values: Was → "Coiffeur, Nails…" (muted), Wo → last city from localStorage (default "Basel"), Wann → "Flexibel".
Filled state: values show selection in ink weight 600.

### 2. Step Order — Was → Wo → Wann (3 steps, not 4)

**Current:** 4 steps — Wo → Kategorie → Service → Datum.

**New:** 3 steps:
- Step 1: Was? (category + service combined)
- Step 2: Wo? (city selection)
- Step 3: Wann? (date + time-of-day)

The service sub-selection lives inside Step 1, not as its own step. After tapping a category the list animates to show services within that category. A "← Alle Kategorien" back link returns to categories.

### 3. Step 1 (Was?) — Vertical list replaces icon grid

**Current:** 3-column icon grid at ~28px icons per cell.

**New:** Clean vertical list rows:
- Row height: `56px`
- Icon container: `36×36px`, background `rgba(255,107,107,.08)`, `border-radius: 10px`
- Icon: 20px, Lucide (fallback to existing category icons), stroke `s-coral`
- Category name: Syne 14px 700, `s-ink`
- Sub-description: DM Sans 12px, `s-ink/50`
- Separator: `1px solid #F5F5F5`
- Selected state: row bg `s-coral/[0.06]`, checkmark right side
- First option always: "Egal / Alle Services" — skips category

After category selection, the list slides to service rows (same visual style). A back link above the list returns to categories. Selecting any service auto-advances to Step 2.

### 4. Collapsed Step Rows

When the user is on Step 2 or Step 3, previously completed steps collapse to a single row:
- Content: Label ("Was" / "Wo") + selected value on same line
- "Ändern" link on the right → re-expands that step
- Row height: `44px`, separator `1px solid #F0F0F0`

### 5. Bottom-Sheet Animation (mobile) / Top-Center Panel (desktop)

**Mobile (< md):**
- Sheet slides up from `translateY(100%)` → `translateY(0)` over `320ms cubic-bezier(0.32, 0.72, 0, 1)` — iOS spring curve
- Closes: slides down over `240ms ease-in`
- Max height: `88svh`, internally scrollable
- Border-radius: `24px 24px 0 0`
- Drag handle: `36×4px`, `#E0E0E0`, margin `12px auto 20px`
- Dragging down past 40% of sheet height → close

**Desktop (≥ md):**
- Stays as top-center panel (current behavior) — `md:top-24 md:left-1/2 md:-translate-x-1/2 md:w-[600px]`
- Uses current enter animation: `opacity 0→1, y -10→0, scale 0.98→1` over `220ms`

### 6. Step Progress Indicator

3 dots (not 4). Inactive: `6×6px` circle `#E0E0E0`. Completed: `#111`. Current: coral `20×6px` pill. Width transition `200ms ease`.

### 7. Wann? Step (Step 3) — Minor fixes only

Keep existing date pills and time-of-day pills. Style fix:
- Selected pill: `bg-s-ink text-white border-s-ink` (currently uses coral fill for date, no selected state for time pills)
- Time-of-day pills need selected state wired up (currently buttons are rendered but selection is not tracked)
- Track `timeKey` state alongside `dateKey`

### 8. Search Button

Always visible at bottom of sheet. Active (can navigate) shows coral with glow shadow. Disabled (nothing selected): opacity 35%, non-interactive. Text: "Salons finden" with search icon.

---

## What Does NOT Change

- The underlying navigation logic (`navigate()` function)
- AI/query search (Mode B — type something → detect-category)
- City data, service data, date data (`lib/guided-search-data.ts`, `lib/cities.ts`)
- Scroll lock, localStorage city persistence
- Dark mode support
- i18n keys structure (new keys needed for "Was", "Wo", collapsed state labels — see below)

---

## New i18n Keys Needed

Add to `home.guidedSearch` namespace in all 4 locale files:

```json
"steps.what.title": "Was suchst du?",
"steps.what.allServices": "Egal / Alle Services",
"steps.what.backToCategories": "← Alle Kategorien",
"steps.what.skipLabel": "Überspringen",
"collapsed.change": "Ändern",
"trigger.what": "Was",
"trigger.whatPlaceholder": "Coiffeur, Nails…",
"trigger.where": "Wo",
"trigger.when": "Wann",
"trigger.whenDefault": "Flexibel",
"steps.date.time.any": "Egal",
"steps.date.time.morning": "Morgens",
"steps.date.time.afternoon": "Nachmittags",
"steps.date.time.evening": "Abends"
```

(English, French, Italian equivalents required.)

---

## Files Touched

| File | Change |
|---|---|
| `components/ui/GuidedSearch.tsx` | Main refactor (trigger pill, step order, list vs grid, collapsed rows, animation) |
| `messages/de.json` | New i18n keys |
| `messages/en.json` | New i18n keys |
| `messages/fr.json` | New i18n keys |
| `messages/it.json` | New i18n keys |

No new files. No API routes. No DB changes.

---

## What Is NOT in Scope

- Sticky nav compact pill (mentioned in spec §02 — deferred, adds complexity to Header)
- The separate `app/[locale]/search/page.tsx` route is untouched (it still exists for direct URL access)
- SplitView / SearchResultGrid — not touched
