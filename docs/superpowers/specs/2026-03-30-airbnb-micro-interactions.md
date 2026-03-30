# Specification: Hardware-Accelerated Micro-Interactions

## Context
Native iOS experiences feel "solid" because buttons physically react to touch before the finger lifts. To mirror this on the web, we use CSS `:active` transforms to provide immediate tactile feedback.

## Core Rules

1. **The Active Press (`active:scale-*`)**:
   - For all card links, large buttons, and category tiles, applying an `active:scale-[0.97]` or `active:scale-[0.98]` transform provides a deeply satisfying "push" effect when tapped.

2. **Transition Tightness**:
   - The down-press should be nearly instantaneous (`duration-75` or `duration-100`).
   - The release should smoothly spring back using our custom bezier.

3. **Color Flash on Touch (Optional but Recommended)**:
   - A very subtle grey overlay (`active:brightness-95`) can pair well with the scale.

```tsx
// ✅ DO: Apply via Tailwind directly
className="active:scale-[0.98] transition-all duration-100 ease-out"
```

> **Warning**: Never apply `active:scale` to the raw `<Link>` wrapper if it causes the surrounding Grid/Flex gap to expand awkwardly. Apply it to the rigid inner container.
