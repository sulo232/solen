// lib/demo-data.ts
// DEMO DATA — replace with real content once salons/discovery items are seeded in the DB

import type { SalonCard } from "@/lib/types";

/**
 * Demo salons shown in category carousels when no real salon data exists.
 * SalonHeroCard only reads: id, slug, name, quartier, city_name,
 * cover_photo_url, gallery_urls, average_rating, review_count,
 * min_price, categories, last_minute_discount_percent.
 * All other Salon fields are cast away via `as unknown as SalonCard`.
 */
export const DEMO_SALONS: SalonCard[] = [
  {
    id: "demo-1", slug: "demo-1", name: "Atelier Lumière",
    quartier: "Altstadt", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&q=80",
    average_rating: 4.9, review_count: 87, min_price: 65,
    categories: ["coiffeur"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-2", slug: "demo-2", name: "Nails & Grace",
    quartier: "Gundeldingen", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=480&q=80",
    average_rating: 4.8, review_count: 42, min_price: 45,
    categories: ["nails"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-3", slug: "demo-3", name: "The Barber Society",
    quartier: "St. Johann", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=480&q=80",
    average_rating: 4.7, review_count: 124, min_price: 35,
    categories: ["barbershop"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-4", slug: "demo-4", name: "Serenity Spa Basel",
    quartier: "Bruderholz", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&q=80",
    average_rating: 4.9, review_count: 61, min_price: 90,
    categories: ["spa"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
  {
    id: "demo-5", slug: "demo-5", name: "Glam Studio",
    quartier: "Bachletten", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=480&q=80",
    average_rating: 4.6, review_count: 33, min_price: 55,
    categories: ["makeup"], gallery_urls: [], last_minute_discount_percent: 0,
  } as unknown as SalonCard,
];

/**
 * Demo discover items shown in DiscoverCarousel when /api/discovery/feed returns empty.
 * These match the 9:16 TikTok-card format used by the carousel.
 */
export const DEMO_DISCOVER_ITEMS = [
  { id: "dd-1", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80", label: "Coiffeur" },
  { id: "dd-2", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80", label: "Nails" },
  { id: "dd-3", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80", label: "Barbershop" },
  { id: "dd-4", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80", label: "Spa" },
  { id: "dd-5", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80", label: "Makeup" },
];
