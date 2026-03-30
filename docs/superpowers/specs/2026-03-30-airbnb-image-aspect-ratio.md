# Specification: Airbnb-Style Image Aspect Ratios

## Context
High-end booking platforms like Airbnb strictly control the aspect ratio of the primary listing imagery to ensure mathematical uniformity. Unguided image heights cause layout shift (CLS) and a messy, unpolished look.

## Core Rules

1. **Mobile Ratio (`aspect-[20/19]`)**: 
   On screens smaller than `md:`, salon card image carousels MUST be fixed to `aspect-[20/19]`. This gives a tall, almost square but slighly vertical feel, maximizing screen real estate for immersive browsing.
   
2. **Desktop Ratio (`aspect-square` or `aspect-[4/3]`)**:
   On screens `md:` and above, the carousels should switch to `md:aspect-square` (1:1) or `md:aspect-[4/3]`. This keeps cards uniform in grid view without overpowering the monitor height.

3. **CSS Implementation**:
   - `object-cover` MUST be applied to the `img` tags to ensure images fill this fixed space without distortion.
   - The outer container MUST specify this aspect ratio and hide overflow.
   
```tsx
// ✅ DO:
<div className="relative w-full aspect-[20/19] md:aspect-square overflow-hidden rounded-xl">
  <Image src={...} className="object-cover w-full h-full" />
</div>

// ❌ DON'T:
<div className="w-full h-48"> <!-- Hardcoded heights look terrible on wide screens -->
```
