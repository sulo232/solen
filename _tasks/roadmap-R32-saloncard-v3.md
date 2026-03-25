# R32 — SalonCard V3 Hardening

> Fix every V3 rulebook violation in SalonCard: remove blob morph (NEVER rule #6), fix category tag colours, fix availability pill to sage style, fix card hover to translateY only.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — Remove blob morph, fix hover | 🔴 High | Changes all card hover animations everywhere (homepage, search, profile) |
| Phase 2 — Category tag colours | 🟢 Low | Visual-only, no logic change |
| Phase 3 — Availability pill style | 🟢 Low | Visual-only, no data change |
| Phase 4 — Shadow upgrade | 🟢 Low | CSS values only |

---

## Phase 1 — Remove Blob Morph + Fix Card Hover Physics

### ⚠️ BE CAREFUL
- Current `SalonCard.tsx` uses `style={{ borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%" }}` on the `motion.div` wrapper — this makes the card a BLOB. This is NEVER rule #6.
- `whileHover={{ borderRadius: "60% 40% 45% 55% / ..." }}` makes it MORPH on hover — NEVER rule #9.
- Replace with: `rounded-[20px]` container, `whileHover={{ y: -5 }}`, `transition-shadow duration-[250ms]`, border-color upgrade on hover via CSS `group-hover`.
- The `overflow-hidden` on the `Link` inside must stay — it clips the cover photo.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)
**Lines 85–98** — Replace blob motion.div with correct V3 card

✅ DO:
```tsx
<motion.div
  variants={cardPopIn}
  initial="hidden"
  animate="visible"
  className={`relative rounded-[20px] shadow-warm-sm transition-all duration-[250ms] hover:shadow-warm-float hover:-translate-y-[5px] will-change-transform ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
  onMouseEnter={() => { if (!prefetched.current) { prefetched.current = true; router.prefetch(href); } }}
>
```

❌ DON'T:
```tsx
// NEVER blob radius on a card
style={{ borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%" }}
// NEVER morph on hover
whileHover={{ borderRadius: "60% 40% 45% 55% / 50% 60% 40% 50%" }}
// NEVER just y: -4 without shadow upgrade
whileHover={{ y: -4 }}
```

**Also fix:** `Line 115` — the Link wrapper `bg-white dark:bg-s-dm-surface shadow-card` → update to `bg-s-bg-raised dark:bg-s-dm-raised rounded-[20px] overflow-hidden` (keep overflow-hidden for photo clip).

**Verification:** `npm run build` — Cards render as 20px rounded rects everywhere. Hover is translateY only, no shape morph.

**Git commit:** `git add components/SalonCard.tsx && git commit -m "R32-P1: remove blob morph, fix card hover to translateY(-5px) + shadow-warm-float"`

---

## Phase 2 — Category Tag Colours Per Rulebook

### ⚠️ BE CAREFUL
- Tags are currently rendered as glass pills on photo bottom: `bg-s-ink/50 backdrop-blur-sm text-white` (Line 150). These are on the photo overlay — fine for photo context.
- The tags in the card BODY below the photo (if any) must follow the colour-per-category system.
- The availability badge `bg-s-success text-white` (Line 135) must become sage-s/sage-t pill.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)
**Lines 146–155** — Photo overlay category pills (keep glass, acceptable on photo):
```tsx
// Keep as-is — glass pills on photo are fine per rulebook Ch8
// "Glass pill on photo" = acceptable as mini glass element
```

**Lines 204–270** — Body section: add category tags with correct colour system:
```tsx
// Add category tag row in card body (after the rating row)
const CAT_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "bg-s-yellow-subtle", text: "text-s-yellow-text" },
  barbershop: { bg: "bg-s-plum/[0.12]",  text: "text-s-plum" },
  nails:      { bg: "bg-s-coral-subtle",  text: "text-s-coral-text" },
  spa:        { bg: "bg-s-sage-subtle",   text: "text-s-sage-text" },
  makeup:     { bg: "bg-s-amber-subtle",  text: "text-s-amber-text" },
  waxing:     { bg: "bg-s-blue-subtle",   text: "text-s-blue-text" },
};

// In JSX after rating row:
<div className="flex gap-1.5 flex-wrap mt-2">
  {salon.categories.slice(0, 2).map(cat => {
    const colours = CAT_COLOURS[cat] ?? { bg: "bg-s-bg-sunken", text: "text-s-ink/60" };
    return (
      <span key={cat} className={`inline-flex px-2 py-0.5 rounded-btn ${colours.bg} ${colours.text} text-[10px] font-heading font-bold uppercase tracking-[.06em] shadow-warm-xs`}>
        {cat}
      </span>
    );
  })}
</div>
```

**Verification:** `npm run build` — category tags in card body show per-category colour pairs (not all white/glass).

**Git commit:** `git add components/SalonCard.tsx && git commit -m "R32-P2: category tag colours per V3 rulebook ch16"`

---

## Phase 3 — Availability Pill: Sage Pill Style

### ⚠️ BE CAREFUL
- Current availability display (Line 241–245) shows `text-xs text-s-coral font-medium` — plain coral text, no pill.
- Must become: sage-s background, sage-t text, with clock SVG icon, pill shape.
- Format: "Heute 14:30 frei" or the slot string from `salon.next_available_slot`.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)
**Lines 241–245** — Replace plain availability text with sage pill

✅ DO:
```tsx
{showAvailability && salon.next_available_slot && (
  <div className="mt-2">
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-s-sage-text bg-s-sage-subtle px-2.5 py-1 rounded-btn shadow-warm-xs">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      {salon.next_available_slot}
    </span>
  </div>
)}
```

❌ DON'T:
```tsx
<span className="text-xs text-s-coral font-medium font-body">{salon.next_available_slot}</span>
```

**Verification:** `npm run build` — availability shows as sage pill with clock icon across all card usages.

**Git commit:** `git add components/SalonCard.tsx && git commit -m "R32-P3: availability → sage-s/sage-t pill with clock icon"`

---

## Phase 4 — Card Shadow Upgrade (warm tokens)

### ⚠️ BE CAREFUL
- `shadow-card` and `shadow-card-hover` in `tailwind.config.js` use cold `rgba(0,0,0)` — banned.
- Global sweep: replace `shadow-card` → `shadow-warm-sm`, `shadow-card-hover` → `shadow-warm-float` throughout SalonCard + any other component references.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)
```tsx
// All instances:
shadow-card → shadow-warm-sm
shadow-card-hover → shadow-warm-float
```

#### [MODIFY] [tailwind.config.js](file:///c:/Users/sulod/solen/tailwind.config.js)
**Lines 54–63** — Keep cold tokens as deprecated aliases but add correct warm equivalents:
```js
// Add these (warm system):
"warm-xs": "0 1px 2px rgba(26,18,9,.06)",
"warm-sm": "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
"warm-md": "0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)",
"warm-lg": "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)",
"warm-xl": "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)",
"coral-glow": "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)",
"coral-glow-hover": "0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22)",
"amber-glow": "0 2px 4px rgba(212,135,10,.22), 0 4px 16px rgba(212,135,10,.14)",
"pressed": "0 1px 1px rgba(26,18,9,.12), inset 0 1px 2px rgba(26,18,9,.06)",
```

**Verification:** `npm run build` + visually confirm cards no longer have cold black shadows.

**Git commit:** `git add components/SalonCard.tsx tailwind.config.js && git commit -m "R32-P4: warm shadow tokens, remove cold rgba(0,0,0) shadows"`

---

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 | Must be first — affects all downstream rendering |
| Phase 2–3 | Phase 1 complete (need correct container shape first) |
| Phase 4 | tailwind.config changes affect entire app |
