# Step

**File:** [app/[locale]/_components/business/Step.tsx](../../app/[locale]/_components/business/Step.tsx)
**Layer:** 1 (chrome — the numeral is muted ink `s-ink-3`, NOT accent. Accent is functional-only per CANON §2.)
**Locked since:** V3-D218 (2026-05-26 · /business rebuild) · **CANON sweep:** 2026-06-01 (numeral de-accented)
**SOURCE.md links:** [§3 typography](../SOURCE.md) · [§2 accent rule](../SOURCE.md)

---

## Purpose

3-step "how it works" card primitive used in `/business` page's `<section id="how">`. Extracted from inline JSX so the same pattern can serve future "how it works" / "process" sections.

The giant numeral (`text-s-ink-3`) reads as a quiet, semi-decorative "data emphasis." It is muted ink, NOT accent blue: CANON §2 bans accent on decorative text / step numerals (accent is functional-only — focus ring / spinner / input).

---

## Public API

```ts
export interface StepProps {
  n: string;      // "01" / "02" / "03" — caller controls digits + leading zero
  title: string;  // step title, e.g. "Anmelden"
  copy: string;   // single-line description (kept terse for the 3-col grid)
}
```

---

## Visual signature

```
┌──────────────────────────────┐
│                              │
│   01                         │  ← font-display 40px (mobile) / 48px (desktop)
│                              │     font-semibold (600), text-s-ink-3
│   Anmelden                   │  ← font-display clamp(16,1.6vw,18), font-semibold (600)
│   60 Sekunden Formular…      │  ← font-body 14px, font-normal (400)
│                              │
└──────────────────────────────┘
   ↑
   rounded-card · bg-s-bg-sunken · p-7 md:p-8
```

**Typography (numeral):**
- `font-display text-[40px] md:text-[48px] font-semibold` (Inter Tight 600 — NEVER 800)
- `leading-none tracking-[-0.03em]`
- `text-s-ink-3` (muted ink → reads as quiet decorative emphasis; NOT accent, per CANON §2)
- `tabular-nums` (aligned digits across all 3 cards)

**Typography (h3):**
- `font-display text-[clamp(16px,1.6vw,18px)] font-semibold` (section heading = Inter Tight 600 per CANON §3)
- `tracking-[-0.03em]`
- `text-s-ink`
- `mt-5` (20px gap below numeral)

**Typography (body p):**
- `font-body text-[14px] font-normal leading-[1.55]` (Inter 400 — body default per CANON §3)
- `text-s-ink-2`
- `mt-2` (8px gap below h3)

---

## Use for

- 3-step "Wie es funktioniert" sections (currently `/business`)
- Future "process" / "onboarding" callouts where you want a numbered card with a title + 1-line description

## Don't reuse for

- Feature cards (use `<BentoCard>` — Step is intentionally smaller, no visual slot)
- Long-form numbered list items (this is for SHORT, scannable steps; if the copy needs 3+ lines, use a different pattern)

---

## Layout

The 3-step section uses `<ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">` around 3 `<Step>` elements. The grid wrapper lives in the calling site, not inside `Step` itself — `Step` is a single `<li>` so it composes cleanly into any grid the caller wants.

---

## A11y

- Renders as `<li>` — assumes the caller wraps in `<ol>` (semantic ordered list for step ordering).
- No interactive elements — pure information surface.
- Numeral has no aria — it's text content (`<p>`), screen readers will read "Zero one" / "Zero two" / "Zero three" naturally. If a future variant needs to skip the numeral (e.g. screen reader users get "Step 1 of 3" from the parent), wrap the numeral in `<span aria-hidden>` and lift the ordinal into the visible `<h3>` instead.
