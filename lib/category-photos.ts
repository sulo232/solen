// V3-D340 (W11, 2026-05-28): placeholder Unsplash URLs for category landing heroes.
// T6 photo strategy doc DEFERRED — user picks CDN + AI provider + real photo source AM.
// These swap when real Solen photos arrive (or AM-picked AI placeholder set).

export const CATEGORY_PHOTOS = {
  coiffeur: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
  barbershop: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80",
  nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1600&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
  makeup: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1600&q=80",
  waxing: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
} as const;

export type Category = keyof typeof CATEGORY_PHOTOS;
