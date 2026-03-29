# V5 Zone 7 Roadmap — Section Layout & Page Rhythm
`_tasks/roadmap-v5-zone7-layout.md`

> **Scope:** `components/HomePage.tsx` section spacing + alternating backgrounds
> **Target:** Tighten spacing from `py-16/24` to `py-10/14`. Alternate white/cream section bands. Standardize section heading pattern.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 7.1 | 🟢 SAFE | Nothing | Just spacing numbers |
| 7.2 | 🟢 SAFE | Nothing | Background colors only |
| 7.3 | 🟢 SAFE | Nothing | Heading markup only |

---

## 🤖 Phase 7.1 — Tighten all section vertical padding

**File**: `[MODIFY] components/HomePage.tsx`

Find every `py-16`, `py-24`, `md:py-24`, `md:py-16` in HomePage.tsx and replace:

| Before | After |
|---|---|
| `py-16 md:py-24` | `py-10 md:py-14` |
| `py-16` | `py-10` |
| `py-24` | `py-14` |
| `py-8 md:py-12` | `py-6 md:py-10` |
| `pt-10 sm:pt-16` (hero) | `pt-14 sm:pt-20` — keep slightly larger |
| `pb-6 sm:pb-10` (hero) | `pb-10 sm:pb-14` |

Run verification:
```bash
grep -n "py-16\|py-24\|md:py-24\|md:py-16" components/HomePage.tsx
# Expected after fix: 0 results
```

✅ DO: `py-10 md:py-14` — 40px mobile / 56px desktop (Airbnb-level tightness)
❌ DON'T: drop below `py-8` (32px) — sections need breathing room even if tighter

**Commit**: `git commit -m "phase 7.1: tighten section spacing from py-16/24 to py-10/14"`

---

## 🤖 Phase 7.2 — Alternating section backgrounds

**File**: `[MODIFY] components/HomePage.tsx`

Currently all sections are on the same background. Add visual section separation:

```
[Hero] — hero-cinematic
[Categories] — bg-[--base] (cream, subtle warmth)
[Discover Carousel] — bg-[--raised] (white)
[Featured Salons] — bg-[--base]
[Trending] — bg-[--raised]
[Last Minute] — bg-s-ink text-white (dark accent band — like Airbnb's "Top rated" section)
[New Salons] — bg-[--base]
[Reviews] — bg-[--raised]
[Partner CTA] — bg-s-coral/[0.05] (warm tinted)
```

Implementation — add background class to each `<section>`:
```tsx
{/* Hero */}
<section className="relative overflow-hidden hero-cinematic pt-14 sm:pt-20 pb-10 sm:pb-14">

{/* Categories */}
<section className="bg-[--base] max-w-5xl mx-auto px-4 py-10 md:py-14">

{/* Discover */}
<section className="bg-[--raised] py-10 md:py-14 overflow-hidden">
```

> ⚠️ **BE CAREFUL**: The `max-w-5xl mx-auto px-4` should be INSIDE the section's full-bleed background. Pattern:
> ```tsx
> <section className="bg-[--base] py-10 md:py-14">   {/* full-bleed bg */}
>   <div className="max-w-5xl mx-auto px-4">         {/* constrained content */}
>     ...
>   </div>
> </section>
> ```
> NOT: `<section className="max-w-5xl mx-auto bg-[--base]">` — this clips the background at `max-w-5xl`

**Commit**: `git commit -m "phase 7.2: alternating section backgrounds for page rhythm"`

---

## 🤖 Phase 7.3 — Standardize section heading pattern

**File**: `[MODIFY] components/HomePage.tsx`

Every section should follow the same heading structure:
```tsx
<div className="flex items-end justify-between mb-6 gap-4">
  <div>
    {eyebrow && (
      <span className="block font-body font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-2">
        {eyebrow}
      </span>
    )}
    <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em" }}>
      {title}
    </h2>
  </div>
  {ctaHref && (
    <Link
      href={ctaHref}
      className="text-sm font-heading font-bold text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral transition-colors duration-150 shrink-0"
    >
      {ctaLabel} →
    </Link>
  )}
</div>
```

Audit EVERY section in HomePage.tsx:
- Featured: `eyebrow={t("featured.eyebrow")}` title left, "Alle ansehen" on right ✅ already has this pattern
- Trending: add eyebrow`t("trending.eyebrow")` if missing
- New Salons: add eyebrow if missing
- Last Minute: eyebrow `t("lastMinute.eyebrow")`
- Reviews: `text-white` override (dark section)

✅ DO: consistent `mb-6` below heading block, `clamp(22px, 3vw, 32px)` font size
❌ DON'T: mix centered headings and left-aligned headings on the same page

**Commit**: `git commit -m "phase 7.3: standardize section heading pattern across HomePage"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 7.1 | 🤖 | Tighten spacing | Nothing |
| Phase 7.2 | 🤖 | Alternating backgrounds | Nothing |
| Phase 7.3 | 🤖 | Standardize headings | Nothing |

All three phases are independent and can run in parallel.
