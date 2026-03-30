# Specification: Pristine Skeleton Loaders

## Context
Jumpy loading states destroy user trust. The "Airbnb feel" relies on the loading state occupying the *exact* pixel dimensions that the final populated card will occupy. 

## Core Rules

1. **Dimensional Parity**: 
   Skeletons MUST have the exact same aspect ratio, border-radius, and gap spacing as the real component they represent. 

2. **No Text Scaling Layout Shifts**:
   When simulating text, ensure the height of the skeleton pill exactly matches the line-height of the final typography. 

3. **Motion (The Shimmer)**:
   - Use `animate-pulse` or a custom CSS shimmer mask. 
   - `bg-s-ink/5` (or a very light `#f1f1f1` equivalent) on light mode should be used. Skeletons should be subtle, not high-contrast black/grey blocks.

```tsx
// ✅ DO:
<div className="flex flex-col gap-3 w-full">
  <div className="w-full aspect-[20/19] rounded-card bg-s-ink/5 animate-pulse" /> // Matches image
  <div className="w-2/3 h-5 bg-s-ink/5 animate-pulse rounded-md" /> // Matches title
  <div className="w-1/3 h-4 bg-s-ink/5 animate-pulse rounded-md" /> // Matches subtitle
</div>
```
