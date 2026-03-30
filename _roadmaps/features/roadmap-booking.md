# Booking & Checkout Roadmap (`/checkout` & `ServiceCart.tsx`)

> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting. 

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Zone 3 Enforcement| 🟢 SAFE | Visual regressions | Remove all `backdrop-blur` utilities. Use strict `--raised` and `shadow-warm-lg`. |
| Phase 2: Form & Stripe Sync| 🔴 HIGH | Stripe Payment Intent / Iframe rendering | The `appearance` object passed to Stripe Elements must be perfectly valid JSON/CSS config. Changing radii requires exact matching with Next.js classes. |
| Phase 3: Promo UI Upgrade | 🟡 MEDIUM | Form submission loops | Ensure the `handlePromoValidate` async function does not block or conflict with the Stripe `handleSubmit` event. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Verify TWINT and credit card test transactions work post-design update.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Design — Zone 3 Strict Enforcement (Strip Glassmorphism)
- Phase 2: Design — V3 Strict Tokens & Stripe Sync
- Phase 3: Feature — Interactive Hover States for Promo Codes
- Phase 4: Post-Execution Smoke Test

---

## Phase 1: Design — Zone 3 Strict Enforcement

The Booking and Checkout pipeline is strictly **Zone 3: Clean Functional** according to `UI_RULES.md` §27. Absolutely zero decorative elements, blobs, or glassmorphism are allowed here.

#### Exact Files
- `[MODIFY]` `app/[locale]/checkout/page.tsx`

#### Instructions
1. Find all instances of `bg-white/80 backdrop-blur-xl`.
2. Replace them with pure, solid white: `bg-white` (or `bg-s-bg-raised`).
3. Ensure the cards pop heavily against the `bg-s-bg-surface` by applying `shadow-warm-lg` instead of the weak default `shadow-[0_4px_12px_rgba...]`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="bg-white rounded-card border border-s-ink/5 shadow-warm-lg p-5">
```

❌ **DON'T**
```tsx
// Banned in Zone 3
<div className="bg-white/80 backdrop-blur-xl rounded-card shadow-card p-5">
```

---

## Phase 2: Design — V3 Tokens & Stripe Sync

#### Exact Files
- `[MODIFY]` `app/[locale]/checkout/page.tsx`
- `[MODIFY]` `components/booking/ServiceCart.tsx`

#### Instructions
1. **Buttons**: Replace all instances of `rounded-button` on primary actions (Jetzt buchen, Reservieren) with `rounded-btn` (99px).
2. **Inputs**: Replace all instances of `rounded-button` on text inputs (Promo code, Gift Card) with `rounded-input` (12px radius, specific form styling block).
3. **Stripe Frame Sync**: Stripe Elements is configured via the `appearance` object in `page.tsx`. Update its `borderRadius` to mathematically match the new input radius so the iframe looks native. Update its border colors to match `var(--b2)`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<Elements
  stripe={stripePromise}
  options={{
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#E8624A",
        colorDanger: "#A32D2D",
        borderRadius: "12px", // Matches rounded-input
        colorBorder: "#EAE2D6", // Matches var(--b2)
        fontFamily: "DM Sans, sans-serif",
      },
    },
  }}
>
```

❌ **DON'T**
```tsx
borderRadius: "8px", // V1 legacy design
```

---

## Phase 3: Feature — Interactive Promo UI

#### Exact Files
- `[MODIFY]` `app/[locale]/checkout/page.tsx`

#### Instructions
1. The promo code input currently looks like a flat box that changes state abruptly. 
2. Let's upgrade the "Anwenden" (Apply) button to use the `InteractiveHoverButton` pattern (from `@/components/ui/InteractiveHoverButton` if it exists, or replicate the smooth sliding border behavior). Wait, `CLAUDE.md` mentions `InteractiveHoverButton` for ALL primary CTAs. We should apply it to both the Promo Apply button AND the final "Jetzt buchen" checkout button.

> ⚠️ **BE CAREFUL**: If `InteractiveHoverButton` cannot accept a `type="submit"` prop for the Stripe form safely, use a standard V3 button with `shadow-coral-glow` instead to prevent breaking form submission.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Strip Glassmorphism | Nothing |
| Phase 2 | 🤖 | V3 Tokens & Stripe | Phase 1 |
| Phase 3 | 🤖 | Interactive UI | Phase 2 |
| Phase 4 | 🤖 | Smoke Test | All phases |
