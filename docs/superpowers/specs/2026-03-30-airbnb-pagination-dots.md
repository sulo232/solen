# Specification: Native Carousel Pagination Dots

## Context
Airbnb's signature mobile interaction is horizontal swiping through listing photos *without* leaving the feed. The pagination dots at the bottom of the image indicate how many photos exist and which one is active.

## Core Rules

1. **Scroll-Snap Driven (No Heavy JS)**:
   - Make the image track a native scroll container using `overflow-x-auto snap-x snap-mandatory scrollbar-hide`.
   - The dots should update dynamically based on the scroll position via an `onScroll` intersection observer or simple math (`Math.round(scrollLeft / clientWidth)`).

2. **Visual Positioning**:
   - Bottom-center aligned, overlaid on top of the image container.
   - Requires a subtle CSS gradient overlay on the bottom edge of the image so white dots are visible against white photos.

3. **Active/Inactive State**:
   - Active dot: Pure white `bg-white opacity-100 scale-100`.
   - Inactive dot: Translucent white `bg-white/50 opacity-60 scale-75`.
   - Limit visible dots to 5. If there are >5 images, the edge dots should shrink sequentially.

```tsx
// ✅ DO:
<div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
  {images.map((img, i) => (
    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-1.5 bg-white opacity-100' : 'w-1.5 bg-white/50 opacity-60 scale-75'}`} />
  ))}
</div>
```
