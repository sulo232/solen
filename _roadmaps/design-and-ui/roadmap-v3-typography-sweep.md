# Typography & Micro-Inconsistencies Sweep

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Typography vertical rhythm | Only remove `leading-` classes if they break the standard type scale. |
| Phase 2 | 🟢 SAFE | Nothing | Use strictly defined `--shadow-card` token. |
| Phase 3 | 🟡 MEDIUM | Image aspect ratios could clip | Ensure `object-cover` is always used with `aspect-[3/2]` or `aspect-square`. |
| Phase 4 | 🟢 SAFE | Mobile Hero overlay | Check z-index to ensure text is visible over the gradient. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🤖 CLAUDE CODE PHASES**
- Phase 1: Typography & Placeholder Sweep
- Phase 2: Shadow Standardization
- Phase 3: Image Aspect Ratio Enforcement
- Phase 4: Mobile Hero Text Overlap Fix

**🧑 MANUAL PHASES**
- None.

---

## 🤖 PHASE 1: TYPOGRAPHY & PLACEHOLDER SWEEP

**Files to Check/Modify:**
- `[MODIFY]` `components/ui/input.tsx` (and other generic inputs)
- `[MODIFY]` Global search bar inputs.

**Steps:**
1. Grep the codebase for arbitrary `leading-[value]` classes (e.g., `leading-5`, `leading-6`) on standard body text components.
2. Remove them to let the underlying text sizes (`text-sm`, `text-lg`) control their natural `line-height` standard from `UI_RULES.md`.
3. Locate all `placeholder:` classes on inputs. Ensure they match the body body line-height (e.g., `placeholder:leading-normal` or inheriting natural leading).

**✅ DO:**
```tsx
<input className="text-s-ink text-base placeholder:text-s-ink/50" />
```

**❌ DON'T:**
```tsx
<input className="text-s-ink text-base leading-7 placeholder:leading-5" />
```

> ⚠️ **BE CAREFUL**: 
> - Do NOT remove `leading-none` or specific `leading-` classes from display headings (`Bebas Neue` / `font-display`) as those require tight leading (0.85). This phase targets body text and placeholders only.
> - Verify: Start typing in an input field to ensure the cursor/text does not jump vertically compared to the placeholder.

**Verification:**
```bash
git add -A
git commit -m "phase 1: Sweep arbitrary leading and standardize placeholder line-height"
npm run build
```

---

## 🤖 PHASE 2: SHADOW STANDARDIZATION

> ⚠️ **COLLISION FIX (2026-03-25):** `shadow-card` token is **BANNED** by V3 Master Lint (T3). Use the inline warm shadow instead.

**Files to Check/Modify:**
- `[MODIFY]` `components/SalonCard.tsx`
- `[MODIFY]` Dashboard or grid card components.

**Steps:**
1. Grep for `shadow-md`, `shadow-lg`, and other non-token shadows on cards.
2. Replace all static card shadows with the inline warm shadow: `shadow-[0_4px_12px_rgba(26,18,9,0.08)]` (or check if a custom token exists in `tailwind.config.js`).
3. Ensure hover states on cards use `shadow-[0_6px_20px_rgba(26,18,9,0.12)]` or equivalent warm hover shadow.

**✅ DO:**
```tsx
<div className="rounded-[12px] shadow-[0_4px_12px_rgba(26,18,9,0.08)] hover:shadow-[0_6px_20px_rgba(26,18,9,0.12)] transition-shadow">
```

**❌ DON'T:**
```tsx
<div className="rounded-card shadow-md hover:shadow-xl">
// Also DON'T use shadow-card — it is banned by Master Lint T3
```

> ⚠️ **BE CAREFUL**: 
> - Only target CARDS in this phase. Do not modify buttons (`shadow-warm-sm`) or dropdowns (`shadow-warm-md`).
> - Verify: Load a search grid and hover over the cards. The shadow should feel warm and multi-layered, not like a generic gray drop-shadow.

**Verification:**
```bash
git add -A
git commit -m "phase 2: Standardize all cards to use warm inline shadows (no shadow-card token)"
npm run build
```

---

## 🤖 PHASE 3: IMAGE ASPECT RATIO ENFORCEMENT

> ⚠️ **COLLISION FIX (2026-03-25):** `rounded-t-card` is **BANNED** by V3 Master Lint (T2). Use `rounded-t-[12px]` instead.

**Files to Check/Modify:**
- `[MODIFY]` `components/SalonCard.tsx`
- `[MODIFY]` Any Category Tile components (e.g., `components/CategoryTile.tsx`).

**Steps:**
1. Update `<SalonCard>` image wrappers to enforce exactly `aspect-[3/2] relative overflow-hidden`.
2. Update the inner `<Image>` or `<img>` to use `object-cover`.
3. Update Category Icons/Tiles to use `aspect-square relative overflow-hidden` and `object-cover`.

**✅ DO:**
```tsx
<div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-[12px]">
  <Image src={src} fill className="object-cover" alt="Salon" />
</div>
```

**❌ DON'T:**
```tsx
<img src={src} className="w-full h-48" /> // Stretches image and breaks aspect ratio
// Also DON'T use rounded-t-card — use rounded-t-[12px] instead (Master Lint T2)
```

> ⚠️ **BE CAREFUL**: 
> - Do not use fixed heights like `h-48` or `h-64`. Let `aspect-[3/2]` and the grid system control the height fluidly.
> - Verify: Ensure images are cropped cleanly (like a profile picture) instead of stretched out of proportion.

**Verification:**
```bash
git add -A
git commit -m "phase 3: Enforce strict aspect ratios and object-cover for images"
npm run build
```

---

## 🤖 PHASE 4: MOBILE HERO TEXT OVERLAP FIX

**Files to Check/Modify:**
- `[MODIFY]` `components/HomePage.tsx` (Hero Section)

**Steps:**
1. Locate the Mobile Hero where "Von Basel, für Basel" overlaps the river background.
2. Add a gradient overlay behind the text layer (`bg-gradient-to-t from-s-bg-base/80 to-transparent`) to ensure contrast.
3. Or, tweak the background positioning explicitly for mobile (`bg-center sm:bg-[position:...]`).

**✅ DO:**
```tsx
<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-s-bg-base/90 to-transparent pointer-events-none" />
<h1 className="relative z-10 text-s-ink font-display ...">Von Basel, für Basel</h1>
```

**❌ DON'T:**
```tsx
<h1 className="text-black font-display text-shadow-md">Von Basel, für Basel</h1>
```

> ⚠️ **BE CAREFUL**: 
> - Do not break the desktop layout. Ensure the gradient or positioning logic uses responsive tailwind prefixes (`sm:`, `md:`) correctly if needed.
> - Verify: Test on a mobile viewport (Chrome DevTools). The text must have high contrast and zero legibility issues over the image background.

**Verification:**
```bash
git add -A
git commit -m "phase 4: Fix mobile hero text legibility overlay"
npm run build
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Typography sweep | Nothing |
| Phase 2 | 🤖 | Shadow standardization | Nothing |
| Phase 3 | 🤖 | Aspect ratio enforcement | Nothing |
| Phase 4 | 🤖 | Mobile hero overlap fix | Nothing |

---

## 🏁 POST-EXECUTION SMOKE TEST
1. **Build passes**: `npm run build` with 0 errors
2. **Type check passes**: `npx tsc --noEmit` with 0 errors
3. Mobile homepage hero looks premium and text is legible.
4. Salon and category images do not stretch.
5. Placeholder text aligns perfectly when typing begins.
