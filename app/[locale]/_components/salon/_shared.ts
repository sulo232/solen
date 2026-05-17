/**
 * Shared types + helpers for SalonDetailV3 component split (V2-D53.3).
 *
 * Pulled out of the monolithic SalonDetailV3.tsx during the Fresha 1:1
 * rewrite. Lets each section component import what it needs without the
 * orchestrator becoming a re-export bottleneck.
 */

export interface Service {
  id: string;
  name_de: string;
  name_en: string | null;
  category: string;
  /** V2-D53.3: fine-grained grouping (e.g. "Schnitt", "Farbe", "Styling",
   * "Pflege") for filter-chip UIs. Falls back to `category` when null. */
  subcategory?: string | null;
  duration_minutes: number;
  price: number;
  description_de: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  languages?: string[] | null;
  // V2-D53.3: per-staff ratings from staff_ratings_view (joined in /api/salons/[slug])
  staff_average_rating?: number;
  staff_review_count?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  // Legacy compat — older API returned `comment_de` / `comment_en`
  comment_de?: string | null;
  comment_en?: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

export interface SiblingSalon {
  id: string;
  slug: string;
  name: string;
  cover_photo_url: string | null;
  average_rating: number | null;
  review_count: number;
  address: string;
  categories: string[];
}

export interface SalonDetail {
  id: string;
  name: string;
  slug: string;
  description_de: string | null;
  description_en: string | null;
  about_text_de: string | null;
  about_text_en: string | null;
  categories: string[];
  quartier: string;
  address: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  cover_photo_url: string | null;
  gallery_urls: string[];
  opening_hours: Record<string, { open: string; close: string }> | null;
  average_rating: number | null;
  review_count: number;
  last_minute_discount_percent: number;
  accepts_online_payment: boolean;
  free_cancel_hours: number;
  booking_confirmation_mode: string | null;
  // V2-D53 Phase A amenity flags (migration 077)
  instant_booking_enabled?: boolean;
  pet_friendly?: boolean;
  kid_friendly?: boolean;
  wheelchair_accessible?: boolean;
  near_public_transport?: boolean;
  lgbtq_friendly?: boolean;
  woman_owned?: boolean;
  family_owned?: boolean;
  student_discount?: boolean;
  // V2-D53.3 new fields (migrations 078, 079, 082)
  is_featured?: boolean;
  parent_salon_id?: string | null;
  wifi_friendly?: boolean;
  // Joined arrays from /api/salons/[slug]
  services: Service[];
  staff: StaffMember[];
  reviews: Review[];
  siblings?: SiblingSalon[];
}

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = typeof DAY_KEYS[number];

export const DAY_LABEL: Record<DayKey, string> = {
  mon: "Montag",
  tue: "Dienstag",
  wed: "Mittwoch",
  thu: "Donnerstag",
  fri: "Freitag",
  sat: "Samstag",
  sun: "Sonntag",
};

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Maps a Swiss postal code to the dominant city in that postal region.
 * First-digit only — accurate enough for city-chip labels (V2-D53.3 fix #2).
 *
 * Better than the previous `startsWith("8") ? "Zürich" : "deiner Stadt"`
 * which left every non-Zürich salon labeled "deiner Stadt".
 *
 * For sub-region accuracy a salon-table `city_id` join would be better,
 * but for the salon-detail "Andere Salons in {city}" chip this map suffices.
 */
const CH_POSTAL_CITY_PREFIX: Record<string, string> = {
  "1": "Lausanne",
  "2": "Neuchâtel",
  "3": "Bern",
  "4": "Basel",
  "5": "Aarau",
  "6": "Luzern",
  "7": "Chur",
  "8": "Zürich",
  "9": "St. Gallen",
};

export function postalToCity(postalCode: string | null | undefined): string {
  if (!postalCode) return "der Schweiz";
  const first = postalCode.charAt(0);
  return CH_POSTAL_CITY_PREFIX[first] ?? "der Schweiz";
}

export function computeOpenStatus(
  hours: Record<string, { open: string; close: string }> | null
): { isOpen: boolean; label: string; nextOpen: string | null } {
  if (!hours) return { isOpen: false, label: "Öffnungszeiten unbekannt", nextOpen: null };
  const now = new Date();
  const dayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()]) as DayKey;
  const today = hours[dayKey];
  if (!today) return { isOpen: false, label: "Heute geschlossen", nextOpen: null };
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const minsOpen = openH * 60 + openM;
  const minsClose = closeH * 60 + closeM;
  if (minsNow < minsOpen) {
    return { isOpen: false, label: `Geschlossen · Öffnet ${today.open}`, nextOpen: today.open };
  }
  if (minsNow > minsClose) {
    return { isOpen: false, label: "Heute geschlossen", nextOpen: null };
  }
  return { isOpen: true, label: `Geöffnet bis ${today.close}`, nextOpen: null };
}

/**
 * Initial-based avatar background color. Maps any character to a stable hue
 * so review avatars stay visually distinct without storing colors anywhere.
 */
const AVATAR_PALETTE = [
  { bg: "#FDE2E4", fg: "#9C2B45" }, // soft rose
  { bg: "#D4EBD9", fg: "#1F5C42" }, // emerald
  { bg: "#FAF2E5", fg: "#C97A57" }, // cream + terracotta
  { bg: "#E0E7FF", fg: "#3730A3" }, // soft indigo
  { bg: "#FEF3C7", fg: "#92400E" }, // soft amber
  { bg: "#D4DDC8", fg: "#3F6212" }, // soft olive
  { bg: "#E0F2FE", fg: "#075985" }, // soft sky
  { bg: "#FCE7F3", fg: "#9D174D" }, // soft pink
];

export function avatarColor(name: string | null | undefined): { bg: string; fg: string } {
  const ch = (name ?? "?").charCodeAt(0) || 0;
  return AVATAR_PALETTE[ch % AVATAR_PALETTE.length];
}

/**
 * Pretty date for review timestamps. Fresha format: "Fri, May 8, 2026 at 7:09 PM"
 * We emit a German equivalent: "Fr., 8. Mai 2026 um 19:09".
 *
 * Two-line variant — call this when you want a single-string label that
 * can be split via " um " into date + time if the layout needs two rows.
 */
export function formatReviewDate(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} um ${timePart}`;
  } catch {
    return iso;
  }
}

/**
 * Sections registered with the sticky tab nav. Order matches Fresha IA.
 * Each section component must render an element with `id="section-{key}"`
 * for IntersectionObserver scroll-tracking to work.
 */
export const TAB_SECTIONS = [
  { key: "photos", label: "Photos" },
  { key: "services", label: "Services" },
  { key: "team", label: "Team" },
  { key: "reviews", label: "Reviews" },
  { key: "portfolio", label: "Portfolio" },
  { key: "about", label: "About" },
  { key: "loyalty", label: "Loyalty" },
] as const;

export type TabKey = typeof TAB_SECTIONS[number]["key"];
