# FAQItem

**File:** [app/[locale]/_components/business/FAQItem.tsx](../../app/[locale]/_components/business/FAQItem.tsx)
**Layer:** 1 (chrome — neutral surface, no semantic color)
**Locked since:** V3-D218 (2026-05-26 · /business rebuild)
**SOURCE.md links:** [§3 typography](../SOURCE.md) · [§6 motion](../SOURCE.md)

---

## Purpose

Single FAQ accordion item — native `<details><summary>` disclosure widget. Used on `/business` page's FAQ section and reusable on any "questions + answers" surface.

Picked native `<details>` instead of a Radix/headlessui custom accordion because:
1. Keyboard interaction (Enter/Space) works for free.
2. `aria-expanded` is auto-managed by the browser.
3. Focus indicator works on `<summary>` natively.
4. Zero JS state — server-renderable.
5. Browsers handle screen-reader semantics correctly.

---

## Public API

```ts
export interface FAQItemProps {
  q: string;                       // question (displayed in <summary>)
  a: string | React.ReactNode;     // answer (revealed when open)
  defaultOpen?: boolean;           // optional initial-open state
}
```

---

## Visual signature

```
┌───────────────────────────────────────────────────────────┐
│  Wie viel kostet Solen?                              ⌄    │  ← summary (15px, 600)
└───────────────────────────────────────────────────────────┘
   ↓ click ↓
┌───────────────────────────────────────────────────────────┐
│  Wie viel kostet Solen?                              ⌃    │  ← chevron rotates 180°
│                                                           │
│  Kostenlose Anmeldung, keine Setup-Gebühr, keine          │  ← answer body
│  monatliche Grundgebühr. Du zahlst nur pro vermitteltem   │     (14px, 300)
│  Termin — fair und transparent.                           │
└───────────────────────────────────────────────────────────┘
```

**Typography (question):**
- `font-body text-[15px] font-semibold` (Hanken Grotesk 600)
- `text-s-ink`

**Typography (answer):**
- `font-body text-[14px] font-light leading-[1.55]` (Hanken Grotesk 300)
- `text-s-ink-2`
- `mt-3` (12px gap below question when open)

**Container:**
- `py-5` (20px top/bottom padding inside each item)
- Outer wrapper (in caller) handles divider lines via `divide-y divide-s-border`

**Chevron:**
- `lucide ChevronDown` size 18, strokeWidth 2.5
- `text-s-ink-3` (muted by default)
- `transition-transform duration-200 ease-glide`
- `group-open:rotate-180` (rotates on disclosure open)

---

## Motion

| Phase | Duration | Easing | Property |
|---|---|---|---|
| Chevron rotate | 200ms | ease-glide | rotate 0° → 180° |
| Content reveal | instant | — | (native `<details>` open) |

The instant content reveal is intentional — animating `<details>` height without JS is non-trivial (requires JS measuring on toggle + height interpolation). The v1 default is instant; if the design later needs height animation, swap to a Radix Accordion + reduced-motion fallback.

---

## Use for

- FAQ sections on landing pages / docs / help centers
- Any 5-20 item Q&A list where users will mostly scan headers and expand 1-3

## Don't reuse for

- Tooltip / hover-reveal copy (use a `<Tooltip>` primitive instead)
- Long-form content with required-reveal (FAQ is for scannable Q+A; if content is paragraphs of essential prose, just render it inline)
- Modal-style disclosure (use `<MorphingDialog>` for that)

---

## A11y

- `<details><summary>` is a native disclosure widget — keyboard support, `aria-expanded`, and focus management come for free.
- Chevron is `aria-hidden` — screen readers read only the question text in `<summary>`.
- Caller wraps items in `<div className="divide-y divide-s-border">` for visual separation; no role/landmark needed on the wrapper (the FAQ section's `<h2>` provides the heading anchor).
- Focus indicator: the browser default outline on `<summary>` is preserved; do NOT add `outline-none` without replacing with a `focus-visible` ring.
