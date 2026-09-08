/**
 * Shared types + helpers for SalonDetailV3 component split (V2-D53.3).
 *
 * Pulled out of the monolithic SalonDetailV3.tsx during the Fresha 1:1
 * rewrite. Lets each section component import what it needs without the
 * orchestrator becoming a re-export bottleneck.
 */

import { SALON_CATEGORY_SLUGS } from "@/lib/validations";

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

/**
 * Round 10 Y3: the salon owner's reply to a review. `review_replies.review_id`
 * is UNIQUE, so PostgREST (and the Supabase JS client, same wire protocol)
 * treats the reviews -> review_replies join as a TO-ONE embed and returns a
 * single OBJECT when a reply exists, never an array (confirmed live on
 * /api/salons/cuts-and-culture). Read it through publicReply() below, never
 * `.length` / `[0]` directly (that assumption is exactly the bug that
 * silently dropped every rendered reply, fixed 2026-07-25).
 */
export type ReviewReply = { reply_text: string; is_public: boolean; created_at: string };

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  // Legacy compat — older API returned `comment_de` / `comment_en`
  comment_de?: string | null;
  comment_en?: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
  staff_member_id?: string | null;
  staff_members?: { id: string; name: string } | null;
  // Round 10 Y3: the salon owner's reply, embedded so ReviewCard (SalonReviews.tsx)
  // can render it inline. PostgREST returns this as an OBJECT (to-one embed,
  // review_replies.review_id is UNIQUE) when present, not an array. Read it
  // via publicReply(), never `.length` / `[0]` directly.
  review_replies?: ReviewReply | ReviewReply[] | null;
}

/**
 * Normalises a `review_replies` embed (object, the live PostgREST to-one
 * shape; array, the shape every render site used to assume; or
 * null/undefined) down to "the one public reply, or null". Every reply
 * render site must call this instead of hand-rolling
 * `.length > 0 && [0].is_public`: that check is always falsy on the object
 * shape (`.length` is `undefined` on a plain object), which is why owner
 * replies never rendered despite being in the DB, the API payload, and the
 * SSR HTML.
 */
export function publicReply(
  raw: ReviewReply | ReviewReply[] | null | undefined
): ReviewReply | null {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return candidate && candidate.is_public ? candidate : null;
}

/** Only expose a stylist when the review and its booking agree within this Store.
 * The write route historically accepted staff_member_id from the client. Never
 * turn that unchecked value, a moved stylist or an inactive profile into a link.
 * The private booking embed and Store IDs stay at the read boundary.
 */
export function publicReviewStylist(raw: {
  staff_member_id?: string | null;
  bookings?: { salon_id?: string; staff_member_id?: string | null } | null;
  staff_members?: { id: string; name: string; salon_id?: string; is_active?: boolean } | null;
}, salonId: string): { staff_member_id: string | null; staff_members: { id: string; name: string } | null } {
  const staff = raw.staff_members;
  const booking = raw.bookings;
  if (!raw.staff_member_id || !booking || !staff ||
      booking.salon_id !== salonId || staff.salon_id !== salonId ||
      booking.staff_member_id !== raw.staff_member_id || staff.id !== raw.staff_member_id ||
      staff.is_active !== true || !staff.name?.trim()) {
    return { staff_member_id: null, staff_members: null };
  }
  return { staff_member_id: staff.id, staff_members: { id: staff.id, name: staff.name } };
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

// AMENITIES_SELF_REPORTED (see the nine amenity fields below: pet_friendly, kid_friendly,
// wheelchair_accessible, near_public_transport, lgbtq_friendly, woman_owned, family_owned,
// student_discount, wifi_friendly). They were seeded from a hash of each salon's own id
// (supabase/migrations/20260530_seed_salon_amenities.sql), not a real answer any salon
// gave. Verified on prod 2026-07-16: 7 salons falsely claimed wheelchair access and 8
// falsely claimed LGBTQ+ welcome purely as a function of their UUID; those values were
// nulled on prod the same day (supabase/migrations/20260716150000_null_fabricated_salon_amenities.sql
// reproduces that on a fresh reset). Keep this false until salons can self-report these
// facts via onboarding/dashboard (not built yet, a separate task): flipping it to true
// is the ONLY change needed to bring back the badges (SalonAdditionalInfo.tsx) and the
// search filter facets (SearchTemplate.tsx / FilterSheet.tsx).
export const AMENITIES_SELF_REPORTED = false;

export interface SalonDetail {
  id: string;
  name: string;
  slug: string;
  description_de: string | null;
  description_en: string | null;
  about_text_de: string | null;
  about_text_en: string | null;
  // Additional locale variants (migration-backed columns, not surfaced in the UI
  // yet, kept optional so the /api/salons/[slug] + server-loader response shape
  // can be typed exactly without an `any` cast).
  about_text_fr?: string | null;
  about_text_it?: string | null;
  categories: string[];
  quartier: string;
  address: string;
  postal_code: string;
  // A6-address-locality (2026-07-27): joined from salons.city_id -> cities.id
  // so JSON-LD (lib/seo.ts generateSalonSchema) can render the salon's real
  // city instead of a hardcoded "Basel". Null when a salon has no city set.
  city_id?: string | null;
  cities?: { name_de: string; name_en: string; name_fr: string; name_it: string } | null;
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
  // Book/Walk-in toggle gate for barbershops (SalonDetailV3's walk-in panel).
  walkin_enabled?: boolean;
  // IANA timezone (migration 20260602120000_walkin_foundations, default
  // 'Europe/Zurich'). Read server-side ONLY (lib/salon-detail.ts) to compute
  // open/closed status in the salon's own local time; not rendered directly.
  timezone?: string | null;
  // Visibility/ownership fields the server loader reads to decide whether the
  // salon is visible to the current viewer. Not rendered by any section, kept
  // optional + typed here (instead of `any`) since /api/salons/[slug] and the
  // server page both spread the raw `salons` row into this shape.
  owner_id?: string;
  is_active?: boolean;
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
 * GAP #5 (2026-07-18): carries a searched date through to a booking link. `date`
 * comes straight from `useSearchParams().get("date")` on the PDP (itself forwarded
 * by SalonResultCard/MapSalonDetail from the search results), so it is untrusted
 * input , only a strict YYYY-MM-DD shape is appended, anything else is dropped
 * silently (no crash, no malformed param forwarded). The booking page re-validates
 * server-side before it ever seeds the picker.
 */
export function withDateParam(href: string, date: string | null | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}date=${date}`;
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

export type SalonCardCategory = "coiffeur" | "barbershop" | "nails" | "spa";

/**
 * Bridges a salon's multi-value `categories` DB column to the single
 * category SalonCard needs for its colorway/label. Falls back to "coiffeur"
 * when the first entry is missing or outside the 4 card categories (e.g. a
 * legacy/off-taxonomy value) rather than surfacing an unsupported category
 * to the card. Single shared implementation (moved out of SalonOfMonth.tsx,
 * 2026-07-16) so every caller that renders SalonCard from a live
 * `categories` column bridges it the same way.
 */
export function safeCategory(categories: string[] | null | undefined): SalonCardCategory {
  const first = categories?.[0]?.toLowerCase();
  return (SALON_CATEGORY_SLUGS.includes(first ?? "")
    ? first
    : "coiffeur") as SalonCardCategory;
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

export type OpenStatus = { isOpen: boolean; label: string; nextOpen: string | null };

/**
 * Resolves "now" in a given IANA timezone (salons.timezone, default
 * 'Europe/Zurich') as a plain Date whose UTC getters (getUTCDay,
 * getUTCHours, getUTCMinutes) read as that timezone's local wall-clock
 * time. Used so open/closed status is based on the SALON's local time, not
 * the server's or the visitor's.
 *
 * Must be read back with the UTC getters, not the local ones: this Date's
 * underlying instant is built via Date.UTC() to encode the target
 * timezone's wall-clock fields, so `.getHours()` (which re-projects through
 * the RUNNING PROCESS's own local timezone) would silently return the wrong
 * value whenever the server process's timezone differs from the target
 * (e.g. a UTC-timezone serverless function reading an Europe/Zurich salon).
 * computeOpenStatus() below always reads this Date via the UTC getters.
 *
 * Hydration-fix (2026-07-04): this is called ONCE, server-side (see
 * lib/salon-detail.ts loadSalonDetail), and the resulting computeOpenStatus()
 * output is passed down as a plain serializable prop. computeOpenStatus must
 * never be called again in a component render body: doing so re-evaluates
 * `new Date()` on the client with a different clock/timezone than the server
 * used for the SSR HTML, which is exactly the hydration mismatch this fixes.
 */
export function nowInTimezone(timezone?: string | null): Date {
  const tz = timezone || "Europe/Zurich";
  try {
    // en-US + these options gives numeric fields we can re-parse into a Date
    // whose UTC getters (getUTCDay, getUTCHours, getUTCMinutes) equal the
    // target timezone's local wall-clock time.
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    // hour12:false can format midnight as "24"; normalize to 0.
    const hour = Number(get("hour")) % 24;
    return new Date(
      Date.UTC(
        Number(get("year")),
        Number(get("month")) - 1,
        Number(get("day")),
        hour,
        Number(get("minute")),
        Number(get("second")),
      ),
    );
  } catch {
    // Unknown/invalid timezone string: fall back to the (UTC-encoded)
    // Europe/Zurich wall-clock time, same shape as the success path so the
    // caller's UTC getters keep working.
    return nowInTimezone("Europe/Zurich");
  }
}

/**
 * i18n (2026-09-05 fix): computeOpenStatus is a plain helper, not a component, so it takes a
 * translator argument instead of importing `useTranslations`. The caller is
 * `lib/salon-detail.ts`'s `loadSalonDetailWithStatus`, which resolves it via
 * `getTranslations({ locale, namespace: "salonDetail" })`. Keys used: hoursUnknown, closedToday,
 * closedOpensAt, closedOpensOnDay (also calls `t(dayKey)` for the weekday name, reusing the
 * same salonDetail.mon..sun keys SalonOpeningTimes already renders with), openUntil.
 */
type StatusKey =
  | "hoursUnknown"
  | "closedToday"
  | "closedOpensAt"
  | "closedOpensOnDay"
  | "openUntil"
  | DayKey;
type StatusTranslator = (key: StatusKey, params?: Record<string, string | number>) => string;

export function computeOpenStatus(
  hours: Record<string, { open: string; close: string }> | null,
  now: Date = nowInTimezone(),
  t: StatusTranslator,
): OpenStatus {
  if (!hours) return { isOpen: false, label: t("hoursUnknown"), nextOpen: null };
  // `now` is a nowInTimezone()-shaped Date (UTC fields = target timezone's
  // wall clock), so it must be read with the UTC getters, not local ones.
  const dayIdx = now.getUTCDay();
  const dayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIdx]) as DayKey;
  const today = hours[dayKey];

  // V3-D210: "Heute geschlossen" path — look ahead to the next open weekday.
  if (!today) {
    const next = findNextOpening(hours, dayIdx);
    if (next) {
      return {
        isOpen: false,
        label: t("closedOpensOnDay", { day: t(next.day), time: next.open }),
        nextOpen: next.open,
      };
    }
    return { isOpen: false, label: t("closedToday"), nextOpen: null };
  }

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const minsOpen = openH * 60 + openM;
  const minsClose = closeH * 60 + closeM;
  if (minsNow < minsOpen) {
    return { isOpen: false, label: t("closedOpensAt", { time: today.open }), nextOpen: today.open };
  }
  if (minsNow > minsClose) {
    // V3-D210: after today's close — look ahead instead of "Heute geschlossen".
    const next = findNextOpening(hours, dayIdx);
    if (next) {
      return {
        isOpen: false,
        label: t("closedOpensOnDay", { day: t(next.day), time: next.open }),
        nextOpen: next.open,
      };
    }
    return { isOpen: false, label: t("closedToday"), nextOpen: null };
  }
  return { isOpen: true, label: t("openUntil", { time: today.close }), nextOpen: null };
}

/**
 * Initial-based avatar background color. Canonical palette now lives in the
 * Avatar primitive (V3-D202 4-tone B&W ramp); re-exported here so existing
 * `avatarColor` importers keep working off the single source of truth.
 */
export { avatarColor } from "../primitives/Avatar";

/**
 * Locale tag lookup for date formatting, same map used elsewhere in the app
 * (e.g. app/[locale]/walk-in-pay/page.tsx LOCALE_TAG). Defaults to "de-CH"
 * for an unrecognised or missing value.
 */
// Routed through the sweep's own resolver 2026-07-26 (was en-GB here, en-CH there; the
// resolveSwissLocale docstring names that exact inconsistency as the thing it exists to kill).
const DATE_LOCALE_TAG: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

/**
 * Pretty date for review timestamps: DATE ONLY (owner, 2026-07-25, verbatim
 * "I don't like how the dates, it's so detailed, how many hours and what
 * weekday it is. We don't need that. We need just, like, the sixth June
 * twenty twenty six. That's enough."). Was "Fr., 8. Mai 2026 um 19:09"
 * (weekday + time); now e.g. "8. Mai 2026" , day, spelled month, year, and
 * nothing else. A review-list date is a DATE, not a timestamp: no weekday,
 * no time, no relative "vor 2 Tagen".
 *
 * `locale` selects the Intl tag via DATE_LOCALE_TAG above; defaults to "de"
 * so existing single-argument call sites keep compiling.
 */
export function formatReviewDate(iso: string, locale?: string | null): string {
  try {
    const tag = DATE_LOCALE_TAG[locale ?? "de"] ?? "de-CH";
    return new Date(iso).toLocaleDateString(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
// A5 B-3/A-3 (2026-07-03): `bundles` + `products` tabs added between Services and Team.
// Labels are the German fallback the other tabs use; the section components themselves
// render fully i18n'd headings via useTranslations("salonDetail"). Both auto-hide when
// the salon has no active bundles/products (availableSections gating in SalonDetailV3).
// labelKey resolves against the salonDetail namespace at the render site
// (SalonStickyTabNav.tsx). The old German `label` strings shipped to every locale , the sticky
// tab nav said "Bewertungen" on the English PDP, which is what the owner spotted on 2026-07-28.
// A constant at module scope cannot call a hook, so it carries the KEY and the component
// resolves it.
export const TAB_SECTIONS = [
  { key: "photos", labelKey: "photos" },
  { key: "about", labelKey: "aboutUs" },
  { key: "services", labelKey: "services" },
  { key: "bundles", labelKey: "bundles" },
  { key: "products", labelKey: "products" },
  { key: "team", labelKey: "team" },
  { key: "reviews", labelKey: "reviews" },
] as const;

export type TabKey = typeof TAB_SECTIONS[number]["key"];

// MetaDot lives in MetaDot.tsx (JSX requires .tsx, _shared.ts is types/data only).
