# 🎨 PROMPT 2 of 3: Header Morph + Animations + Homepage Polish

> **Read `CLAUDE.md` (Section 12: Rules 15-19) and `UI_RULES.md` BEFORE starting.**
> **Prerequisite:** Prompt 1 must be complete.
> Verify:
> ```bash
> grep -Ern "bg-mesh-teal|shadow-teal-glow|accent-teal|teal" components/ app/ --include="*.tsx" | grep -v "node_modules\|s-coral\|//" | head -3
> grep -Ercn "dark:bg-dm-|dark:text-dm-" components/ app/ --include="*.tsx" | wc -l
> grep -rn '"/de/' components/ app/ --include="*.tsx" | grep -v "messages/\|redirect" | wc -l
> ```
> ALL must return 0.

---

## ⚠️ WCAG CONTRAST RULE

`text-s-coral` ONLY for large text (≥18px bold / ≥24px), icons, badges, buttons.
For body text on cream: use `text-s-coral-text` (`#7A2415`).

---

## 🚦 Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 5 (header) | 🔴 HIGH | Nav scroll | Test at scrollY=0, 50, 500 |
| 6 (hover) | 🟢 SAFE | Nothing | CSS only |
| 7 (homepage) | 🟡 MED | Layout | Move JSX, not logic |
| 7.8 (quartier API) | 🟡 MED | 404 | curl test |
| 8 (buttons) | 🟢 SAFE | Nothing | CSS only |

---

## 🤖 PHASE 5 — Header Scroll Morph (1.5 hours)

#### [MODIFY] `components/layout/Header.tsx`

### 5.1 — Scroll listener

```tsx
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 50);
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}, []);
```

### 5.2 — Morph classes

```tsx
<header className="sticky top-0 z-50 w-full">
  <div className={cn(
    "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
    scrolled
      ? "mt-4 max-w-3xl glass rounded-full shadow-warm-sm py-2.5 px-5 sm:px-8 dark:bg-s-dm-surface/80 dark:border-white/5"
      : "max-w-5xl bg-s-bg-base/80 backdrop-blur-lg rounded-none py-4 px-6 sm:px-8 dark:bg-s-dm-bg/80"
  )}>
```

✅ DO: Use CSS transitions for the morph
❌ DON'T: Change `sticky` to `fixed` — breaks layout

### 5.3 — Spacing: Logo `gap-3`, nav `gap-6`, right actions `gap-4`

### 5.4 — Mobile menu animation

```tsx
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="md:hidden mt-2 rounded-2xl glass p-4 dark:bg-s-dm-surface/90"
    />
  )}
</AnimatePresence>
```

> ⚠️ **BE CAREFUL**: Mobile menu must be OUTSIDE the flex row, not nested inside logo/nav/actions.

```bash
npm run build
git add -A && git commit -m "prompt 2 phase 5: header scroll morph + mobile animation" && git push
git tag polish-ph5 && git push origin polish-ph5
```

---

## 🤖 PHASE 6 — Nav Hover Effects (30 min)

#### [MODIFY] `components/layout/Header.tsx`

**Nav links — bg pill on hover:**
```tsx
className={cn(
  "text-sm font-medium transition-all duration-200 rounded-full px-3 py-1.5",
  isActive
    ? "text-s-coral bg-s-coral/8"
    : "text-s-ink/70 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/70 dark:hover:bg-white/5"
)}
```

**Icons — circular hover:** `rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5`
**Account — scale:** `hover:scale-[1.02] active:scale-[0.98]`
**Mobile links — coral accent:** `hover:text-s-coral hover:pl-2 hover:border-l-2 hover:border-s-coral`

```bash
npm run build
git add -A && git commit -m "prompt 2 phase 6: nav hover effects" && git push
git tag polish-ph6 && git push origin polish-ph6
```

---

## 🤖 PHASE 7 — Homepage Micro-Interactions (1.5 hours)

#### [MODIFY] `components/HomePage.tsx`

### 7.1 — Blob animations
Add `animate-blob-float` class to decorative blobs (class exists in globals.css).

#### [MODIFY] `components/ui/BackgroundBlobs.tsx`
Same — add animation class.

### 7.2 — Reveal stagger
Add `className="reveal-stagger"` on category grid, salon grids, quartier container.

### 7.3 — Section reorder
```
1. Hero + Search → 2. Social Proof → 3. Categories ← UP → 4. Weather Banner
→ 5. Rebook → 6. Recently Viewed → 7. Featured → 8. Reviews → 9. New
→ 10. Last-Minute → 11. Quartiers
```
✅ DO: Move JSX blocks only ❌ DON'T: Change data fetching

### 7.4 — Category grid dark mode
```diff
-bg-white/80 border border-gray-100
+bg-white/80 dark:bg-s-dm-surface/80 border border-s-ink/5 dark:border-white/5
```

### 7.5 — Quartier tiles hover
`hover:shadow-warm-md hover:scale-[1.02] transition-all duration-300`

### 7.6 — SearchBar focus

#### [MODIFY] `components/ui/SearchBar.tsx`
`focus:shadow-warm-sm focus:border-s-coral/30 transition-shadow`
Add `id="tour-search"` to the input.

### 7.7 — Footer

#### [MODIFY] `components/layout/Footer.tsx`

Add `so.len` logo:
```tsx
<span className="font-display text-4xl tracking-[0.06em] uppercase text-white/90">
  so<span className="text-s-coral">.</span>len
</span>
```
Add `hover:underline underline-offset-4` to all links.

### 7.8 — Quartier dynamic images

#### [NEW] `app/api/salons/quartier-featured/route.ts`

For each quartier, return top-rated salon's first image. Cache 1h. Fallback: null (gradient).

In HomePage quartier section:
```tsx
{q.image ? <Image src={q.image} fill className="object-cover" /> : <div className={gradient} />}
```

> ⚠️ **BE CAREFUL**: Check what column the `salons` table uses for images. grep `lib/types.ts` for the field name.

### 7.9 — Barbershop icon
Use different lucide icon than Coiffeur (e.g., `ScissorsLineDashed`).

```bash
npm run build
git add -A && git commit -m "prompt 2 phase 7: homepage animations, reorder, quartier images, footer" && git push
git tag polish-ph7 && git push origin polish-ph7
```

---

## 🤖 PHASE 8 — Buttons, Toast, Cards (45 min)

### 8.1 — CTA scale
Add to ALL `bg-s-coral` buttons: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`

#### [MODIFY] `components/ui/interactive-hover-button.tsx`
`bg-s-bg-raised dark:bg-s-dm-surface` + scale

#### [MODIFY] `components/ui/AnimatedButton.tsx`
Dark mode tokens

### 8.2 — SalonCard dark mode
Wobbly blob morph stays ✅. Just verify dark mode tokens are in place.

### 8.3 — Toast animation

#### [MODIFY] `components/ui/Toast.tsx`

```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} />
```

Dark mode tokens.

```bash
npm run build
git add -A && git commit -m "prompt 2 phase 8: button scale, toast animation, card polish" && git push
git tag polish-ph8 && git push origin polish-ph8
```

---

**Prompt 2 total: ~4.5 hours. Run Prompt 3 next.**
