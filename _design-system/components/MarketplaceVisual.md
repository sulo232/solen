# MarketplaceVisual

**File:** [app/[locale]/_components/business/MarketplaceVisual.tsx](../../app/[locale]/_components/business/MarketplaceVisual.tsx)
**Layer:** 1 (chrome — pure decoration; no semantic color or interaction)
**Locked since:** V3-D218 (2026-05-26 · /business rebuild)
**SOURCE.md links:** [§8 card grammar](../SOURCE.md) · [§9 imagery](../SOURCE.md)

---

## Purpose

Decorative 3-card stack used in the `/business` page's "Marktplatz" pitch section. Mimics the visual grammar of the real `<SalonCard>` so partners immediately recognize "this is what my salon looks like on Solen" — without importing the real SalonCard (which carries availability state, photo data, click targets we don't need here).

Three faux cards with perspective rotation:
- Center card: front, full opacity, no rotation
- Left card: -8° rotation, translated left, 70% opacity
- Right card: +8° rotation, translated right, 70% opacity

Pure CSS, no JS state, no motion.

---

## Public API

```ts
// No props. Component is parameterless — uses 3 hardcoded faux salon entries
// (Atelier Haarwerk Basel / Salon Maria Zürich / Studio Nove Bern) that
// mirror real Swiss salon-name shapes for credibility.
export function MarketplaceVisual(): JSX.Element;
```

The fake salon data is intentionally NOT made configurable. This is a decorative chrome element — config'ing it would imply it's a real surface, which encourages misuse.

---

## Visual signature

```
       ┌─────────┐
   ┌─────────┐
   │         │  ┌─────────┐
   │  Card 2 │  │         │
   │  -8°    │  │ Card 1  │  ← front-and-center, no rotation
   │  70% op │  │ 100% op │
   │         │  │         │
   └─────────┘  │         │  ┌─────────┐
                │         │  │         │
                │         │  │ Card 3  │  ← +8° rotation
                │         │  │ 70% op  │
                │         │  │         │
                └─────────┘  └─────────┘
```

**Container:**
- `aspect-[4/3] max-w-[420px]` (constrained so it sits cleanly in the marketplace section)
- `perspective: 1200` (gives the rotation a slight depth feel without going full 3D)
- `aria-hidden` (decorative)

**Card primitive (`FauxSalonCard`):**
- `w-[180px]` fixed width (matches real SalonCard mobile width)
- `rounded-card` (16px — same token as real SalonCard)
- `bg-white shadow-elevation-2`
- Photo placeholder: `aspect-[4/5]` tinted with `bg-s-ink/[0.04 | 0.06 | 0.08]` (no real images — three grey-weight tiers add visual variety)
- Heart icon (top-right) and Star rating (right of name) match real SalonCard chrome

---

## Use for

- "We're a marketplace" / "Kund:innen finden dich" pitch sections on B2B landing surfaces
- Future "this is what your listing looks like" preview moments

## Don't reuse for

- Real salon listings — use `<SalonCard>` directly
- Other contexts where the user might mistake the cards for clickable destinations (these are intentionally non-interactive — no `<Link>`, no `onClick`)
- Sections where dynamic salon data is needed (this is hardcoded mockup data)

---

## A11y

- `aria-hidden` on the wrapper — entirely decorative. Screen readers skip the whole stack.
- The section's heading (`<h2>Kund:innen finden dich. Du musst nicht akquirieren.</h2>`) and accompanying body copy carry the actual semantic meaning.
- No focus targets, no click targets, no tabindex.
