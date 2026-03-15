// ─────────────────────────────────────────────────────────────────────────────
// lib/types.ts — Single source of truth for all TypeScript types.
// Every type mirrors the database schema exactly.
// Devs 2 and 3 import from here. Dev 1 maintains it.
// ─────────────────────────────────────────────────────────────────────────────

// ── Union / Enum types ────────────────────────────────────────────────────────

export type SalonCategory =
  | "coiffeur"
  | "barbershop"
  | "nails"
  | "spa"
  | "makeup"
  | "waxing";

export type Quartier =
  | "grossbasel"
  | "kleinbasel"
  | "gundeli"
  | "st_johann"
  | "iselin"
  | "bruderholz"
  | "breite";

export type HairType = "straight" | "wavy" | "curly" | "coily" | "unknown";
export type AgeGroup = "child" | "teenager" | "adult" | "senior";
export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type UserRole = "customer" | "salon_owner" | "admin";

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type SlotStatus = "available" | "booked" | "blocked";
export type MessageType = "text" | "image" | "booking_link";
export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "custom";
export type PreferredDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// ── Database table types ──────────────────────────────────────────────────────

export interface Profile {
  id: string; // uuid, FK → auth.users.id
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  hair_type: HairType | null;
  age_group: AgeGroup | null;
  gender: Gender | null;
  is_first_visit_default: boolean;
  locale: "de" | "en";
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string; // timestamptz ISO string
  updated_at: string;
}

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface Salon {
  id: string;
  owner_id: string; // FK → profiles.id
  name: string;
  slug: string;
  description_de: string | null;
  description_en: string | null;
  categories: SalonCategory[];
  quartier: Quartier;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  instagram_url: string | null;
  cover_photo_url: string | null;
  gallery_urls: string[];
  opening_hours: Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", OpeningHours | null>;
  average_rating: number;
  review_count: number;
  is_active: boolean;
  last_verified_at: string;
  verification_warnings: number;
  last_minute_discount_percent: number;
  last_minute_window_hours: number;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name_de: string;
  name_en: string;
  category: SalonCategory;
  duration_minutes: number;
  price: number;
  description_de: string | null;
  description_en: string | null;
  suitable_for: AgeGroup[];
  suitable_gender: ("male" | "female" | "non_binary")[];
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  salon_id: string;
  service_id: string;
  staff_member_id: string | null;
  starts_at: string; // timestamptz ISO string
  ends_at: string;
  status: SlotStatus;
  price_override: number | null;
  booked_by: string | null;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  salon_id: string;
  service_id: string;
  staff_member_id: string | null;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  status: BookingStatus;
  is_first_visit: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  is_recurring: boolean;
  recurring_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringBookingRule {
  id: string;
  user_id: string;
  salon_id: string;
  service_id: string;
  staff_member_id: string | null;
  frequency: RecurringFrequency;
  custom_interval_days: number | null;
  preferred_day: PreferredDay | null;
  preferred_time: string | null; // "14:30"
  next_booking_date: string; // date ISO string
  is_active: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  salon_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count_customer: number;
  unread_count_salon: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  salon_id: string;
  user_id: string;
  booking_id: string;
  staff_member_id: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  favorite_quartier_ids: string[];
  favorite_service_slugs: string[];
  quartier_visit_counts: Record<Quartier, number>;
  last_booked_service: string | null;
  booking_intervals: Record<string, number>; // service_slug → avg days
  dismissed_nudges: Record<string, boolean>;
  view_preference: "list" | "map";
  created_at: string;
  updated_at: string;
}

// ── Joined / computed types ───────────────────────────────────────────────────

/** Availability slot with denormalized salon + service data — for the Last-Minute page */
export interface LastMinuteSlot extends AvailabilitySlot {
  salon: Pick<
    Salon,
    | "id"
    | "name"
    | "slug"
    | "cover_photo_url"
    | "quartier"
    | "average_rating"
    | "last_minute_discount_percent"
  >;
  service: Pick<Service, "id" | "name_de" | "name_en" | "duration_minutes" | "price" | "category">;
  staff_member: Pick<StaffMember, "id" | "name" | "avatar_url"> | null;
  discounted_price: number;
}

/** Full salon profile returned by GET /api/salons/[slug] */
export interface SalonProfile extends Salon {
  services: Service[];
  staff: StaffMember[];
  reviews: Review[];
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ── Supabase Database type (used by the Supabase client generic) ──────────────
// Minimal shape — extend with generated types from `supabase gen types` later.

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      salons: { Row: Salon; Insert: Partial<Salon>; Update: Partial<Salon> };
      staff_members: { Row: StaffMember; Insert: Partial<StaffMember>; Update: Partial<StaffMember> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      availability_slots: { Row: AvailabilitySlot; Insert: Partial<AvailabilitySlot>; Update: Partial<AvailabilitySlot> };
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
      recurring_booking_rules: { Row: RecurringBookingRule; Insert: Partial<RecurringBookingRule>; Update: Partial<RecurringBookingRule> };
      conversations: { Row: Conversation; Insert: Partial<Conversation>; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      user_preferences: { Row: UserPreferences; Insert: Partial<UserPreferences>; Update: Partial<UserPreferences> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
