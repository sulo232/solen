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
  // service_ids this staff performs (from staff_services) — drives staff↔service filtering.
  service_ids?: string[];
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

/**
 * Walks `hours` forward from `startIdx` (Sun=0..Sat=6 ordering used by
 * Date.getDay()) and returns the next day that has open hours. Caps at 7
 * iterations to avoid infinite loops if the data is bad.
 *
 * V3-D210 (verifier #2): closed-state pill needs to surface "next time the
 * salon opens" — matches Fresha PDP pattern "Geschlossen · Öffnet Mittwoch
 * um 09:30". Previously `computeOpenStatus` returned `nextOpen: null` when
 * closed-after-today's-close; now it looks ahead through the week.
 */
function findNextOpening(
  hours: Record<string, { open: string; close: string }>,
  startDayIdx: number,
): { day: DayKey; open: string } | null {
  const ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  for (let i = 1; i <= 7; i++) {
    const day = ORDER[(startDayIdx + i) % 7] as DayKey;
    const slot = hours[day];
    if (slot?.open) return { day, open: slot.open };
  }
  return null;
}

export function computeOpenStatus(
  hours: Record<string, { open: string; close: string }> | null
): { isOpen: boolean; label: string; nextOpen: string | null } {
  if (!hours) return { isOpen: false, label: "Öffnungszeiten unbekannt", nextOpen: null };
  const now = new Date();
  const dayIdx = now.getDay();
  const dayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIdx]) as DayKey;
  const today = hours[dayKey];

  // V3-D210: "Heute geschlossen" path — look ahead to the next open weekday.
  if (!today) {
    const next = findNextOpening(hours, dayIdx);
    if (next) {
      return {
        isOpen: false,
        label: `Geschlossen · Öffnet ${DAY_LABEL[next.day]} um ${next.open}`,
        nextOpen: next.open,
      };
    }
    return { isOpen: false, label: "Heute geschlossen", nextOpen: null };
  }

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const minsOpen = openH * 60 + openM;
  const minsClose = closeH * 60 + closeM;
  if (minsNow < minsOpen) {
    return { isOpen: false, label: `Geschlossen · Öffnet ${today.open}`, nextOpen: today.open };
  }
  if (minsNow > minsClose) {
    // V3-D210: after today's close — look ahead instead of "Heute geschlossen".
    const next = findNextOpening(hours, dayIdx);
    if (next) {
      return {
        isOpen: false,
        label: `Geschlossen · Öffnet ${DAY_LABEL[next.day]} um ${next.open}`,
        nextOpen: next.open,
      };
    }
    return { isOpen: false, label: "Heute geschlossen", nextOpen: null };
  }
  return { isOpen: true, label: `Geöffnet bis ${today.close}`, nextOpen: null };
}

/**
 * Initial-based avatar background color. Canonical palette now lives in the
 * Avatar primitive (V3-D202 4-tone B&W ramp); re-exported here so existing
 * `avatarColor` importers keep working off the single source of truth.
 */
export { avatarColor } from "../primitives/Avatar";

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
 *
 * V3-D202 (2026-05-26, salon Phase A · A1): labels migrated to German per
 * §17 i18n rule. Future: wire to `useTranslations("salonDetail.tabs")` once
 * the messages file has these keys.
 */
// V3-D211 (verifier #5): Fresha IA puts "Über uns" SECOND (right after Fotos),
// then services/team/reviews. V3-D237 (2026-05-27, golden-route capture): DROPPED
// `portfolio` and `loyalty` tabs to match real Fresha 5-tab IA captured at
// les-mains-basel (Photos · Services · Team · Reviews · About). Portfolio
// folded into hero gallery + lightbox per Fresha; loyalty was Solen-only and
// added page noise without changing user behavior. Section components stay
// rendered below — only the sticky-nav surface drops them.
export const TAB_SECTIONS = [
  { key: "photos", label: "Fotos" },
  { key: "about", label: "Über uns" },
  { key: "services", label: "Services" },     // identical in German
  { key: "team", label: "Team" },             // identical in German
  { key: "reviews", label: "Bewertungen" },
] as const;

export type TabKey = typeof TAB_SECTIONS[number]["key"];

// MetaDot lives in MetaDot.tsx (JSX requires .tsx, _shared.ts is types/data only).
