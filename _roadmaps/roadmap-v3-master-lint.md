# V3 Master Lint — Platform-Wide Compliance Certification

> **When to run:** After ALL 20 roadmaps have been executed and `npm run build` passes.
> **Purpose:** Certify zero V3 violations remain in `app/` and `components/`. Every check is read-only (grep). Fix any hits before declaring V3 complete.

---

## 🔴 NEVER Rules (Zero Tolerance)

### N1 — No scale animations on completion states
```bash
grep -rn "animate-\[scale\|animate-bounce.*complete\|scale-\[0\.\|scale-\[1\." \
  --include="*.tsx" --include="*.ts" app/ components/ lib/animations.ts
# Expected: 0 results
# If hits: check lib/animations.ts P1 from roadmap-token-sweep
```

### N2 — No blob morphing keyframes
```bash
grep -rn "rounded-blob-d\|blob-morph\|border-radius:.*%.*%.*%" \
  --include="*.tsx" --include="*.css" app/ components/
# Expected: 0 results
```

### N3 — No cold black shadows
```bash
grep -rn "rgba(0,0,0\|rgba(0, 0, 0\|shadow-black\|drop-shadow.*black" \
  --include="*.tsx" --include="*.css" app/ components/
# Expected: 0 results
# Cold shadow = rgba(0,0,0,x). Warm = rgba(26,18,9,x)
```

### N4 — No non-Bebas display headings (check font-heading is applied)
```bash
# Headings that use font-sans, font-body, or no font class:
grep -rn "text-4xl\|text-5xl\|text-3xl" --include="*.tsx" app/ components/ \
  | grep -v "font-heading"
# Expected: all hits should also contain font-heading
```

---

## 🟠 Token Violations

### T1 — No banned rounded-button (8px) token
```bash
grep -rn "rounded-button\b" --include="*.tsx" --include="*.css" app/ components/
# Expected: 0 results (use rounded-btn = 99px instead)
```

### T2 — No rounded-card token (replaced with explicit radius)
```bash
grep -rn "rounded-card\b" --include="*.tsx" app/ components/
# Expected: 0 results
# All cards use rounded-[12px], rounded-[14px], rounded-[16px], rounded-[18px]
```

### T3 — No shadow-card token (replaced with inline warm shadows)
```bash
grep -rn "shadow-card\b" --include="*.tsx" app/ components/
# Expected: 0 results
```

### T4 — No non-standard opacity shorthand variants
```bash
# These Tailwind variants require explicit config — likely not present:
grep -rn "s-coral/[0-9]\b\|s-ink/[0-9]\b\|s-sage/[0-9]\b" \
  --include="*.tsx" app/ components/
# Expected: 0 results (use /[0.xx] format or inline rgba)
```

### T5 — No font-medium on interactive elements
```bash
# font-medium is only allowed inside font-body prose blocks
grep -rn "font-medium" --include="*.tsx" app/ components/ \
  | grep -v "font-body\|prose\|article\|p className"
# Inspect results — should be near 0
```

### T6 — No hover:bg-s-coral/90 (use hover:brightness instead)
```bash
grep -rn "hover:bg-s-coral/90\|hover:bg-s-coral-hover" --include="*.tsx" app/ components/
# Expected: 0 results
# V3 CTAs use: hover:brightness-[1.06]
```

### T7 — No hardcoded hex colors or cold grays
```bash
grep -rn "#00A19C\|#F59E0B\|#6B7280\|#0F0F0F\|#1A1A1A\|#2D2D2D\|#E5E7EB" --include="*.tsx" --include="*.css" app/ components/
# Expected: 0 results (Use s-coral, s-warning, s-ink/50, and s-dm-* variants instead)
```

---

## 🟡 Typography Rules

### TY1 — Font heading on all CTAs
```bash
# Buttons with rounded-btn that don't have font-heading:
grep -rn "rounded-btn" --include="*.tsx" app/ components/ \
  | grep -v "font-heading"
# Inspect — most should contain font-heading
```

### TY2 — Uppercase tracking on small labels
```bash
# Labels under text-xs that are uppercase but missing tracking:
grep -rn "uppercase" --include="*.tsx" app/ components/ \
  | grep "text-\[9px\]\|text-\[10px\]\|text-xs" \
  | grep -v "tracking"
# Expected: 0 results (all uppercase labels need tracking)
```

---

## 🟢 Motion Compliance

### M1 — prefers-reduced-motion in globals.css
```bash
grep -n "prefers-reduced-motion" app/globals.css
# Expected: present — covers all CSS transitions
```

### M2 — No framer-motion scale on completions
```bash
grep -rn "scale:" --include="*.tsx" app/ components/ \
  | grep -v "active:scale-\[0.98\]\|whileHover\|hover:scale\|0.98\|1.01\|1.02"
# Inspect — scale: 0 and scale: 1 are fine; scale: 0.7, 0.8, 1.1 etc are not
```

### M3 — All motion.div use opacity+y (no x-axis on page enters)
```bash
grep -rn "initial.*x:" --include="*.tsx" app/ components/
# Expected: 0 results (all page entries use y-axis or opacity only)
```

---

## 🔵 Zone Compliance Spot Check

### Z1 — Booking/Auth/Checkout have zero glass
```bash
grep -rn "backdrop-blur\|bg-white/\|bg-s-dm-surface/\|glass-tier" \
  --include="*.tsx" \
  app/\[locale\]/booking/ app/\[locale\]/auth/ app/\[locale\]/checkout/ \
  app/\[locale\]/tip/ app/\[locale\]/walk-in-pay/
# Expected: 0 results (Zone 3 = no glass)
```

### Z2 — Homepage/Warum Solen/Discover have warm gradients (not from-gray)
```bash
grep -rn "from-gray\|from-slate\|from-zinc\|from-neutral" \
  --include="*.tsx" \
  app/\[locale\]/page.tsx \
  app/\[locale\]/discover/ \
  app/\[locale\]/warum-solen/
# Expected: 0 results (Zone 1/2 = warm coral/sand gradients only)
```

---

## 🏁 Full Platform Build Certification

```bash
# Clean build — zero type errors, zero missing imports:
npm run build 2>&1 | tail -20
# Expected: "✓ Compiled successfully" or equivalent

# Bundle size check (no regressions >10KB over baseline):
npm run build 2>&1 | grep "First Load JS"
```

---

## Summary Report Template

After running all checks, fill in this table:

| Check | Result | Files needing fix |
|---|---|---|
| N1 — No scale animations | ✅ / ❌ | |
| N2 — No blob morphing | ✅ / ❌ | |
| N3 — No cold shadows | ✅ / ❌ | |
| N4 — Headings use font-heading | ✅ / ❌ | |
| T1 — rounded-button gone | ✅ / ❌ | |
| T2 — rounded-card gone | ✅ / ❌ | |
| T3 — shadow-card gone | ✅ / ❌ | |
| T4 — No non-standard opacity | ✅ / ❌ | |
| T5 — font-medium removed | ✅ / ❌ | |
| T6 — No hover:bg-s-coral/90 | ✅ / ❌ | |
| T7 — No hardcoded hex colors | ✅ / ❌ | |
| TY1 — CTAs use font-heading | ✅ / ❌ | |
| TY2 — Uppercase has tracking | ✅ / ❌ | |
| M1 — Reduced motion in CSS | ✅ / ❌ | |
| M2 — No forbidden scales | ✅ / ❌ | |
| M3 — No x-axis page enters | ✅ / ❌ | |
| Z1 — Zone 3 = no glass | ✅ / ❌ | |
| Z2 — Zone 1/2 = warm gradients | ✅ / ❌ | |
| Build passes | ✅ / ❌ | |

**All rows ✅ = V3 Certified. Push to production.**

```bash
git push
```
