// =============================================================================
// lib/types.ts — Single source of truth for all TypeScript types
// Maintained by Developer 1. Devs 2 and 3 import from here.
// Every type mirrors the database schema exactly.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

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

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "custom";

export type MessageType = "text" | "image" | "booking_link" | "price_offer";

export type HairType = "straight" | "wavy" | "curly" | "coily" | "unknown";

export type AgeGroup = "child" | "teenager" | "adult" | "senior";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type UserRole = "customer" | "salon_owner" | "admin";

export type SlotStatus = "available" | "booked" | "blocked";

export type PreferredDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  hair_type: HairType | null;
  age_group: AgeGroup | null;
  gender: Gender | null;
  is_first_visit_default: boolean;
  locale: "de" | "en" | "fr";
  notification_email: boolean;
  notification_sms: boolean;
  phone_number: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  // Megabuild extensions
  staff_salon_id?: string | null;
  birthday?: string | null;
}

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface Salon {
  id: string;
  owner_id: string;
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
  opening_hours: Record<string, OpeningHours | null>;
  average_rating: number;
  review_count: number;
  is_active: boolean;
  last_verified_at: string;
  verification_warnings: number;
  last_minute_discount_percent: number;
  last_minute_window_hours: number;
  created_at: string;
  updated_at: string;
  // Megabuild extensions
  cancellation_fee_percent?: number;
  cancellation_window_hours?: number;
  auto_assign_method?: AutoAssignMethod;
  auto_complete_enabled?: boolean;
}

export interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  // Megabuild extensions
  user_id?: string | null;
  can_edit_schedule?: boolean;
  can_view_own_bookings?: boolean;
  can_manage_portfolio?: boolean;
  average_rating?: number;
  review_count?: number;
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
  suitable_gender: Gender[];
  is_active: boolean;
  created_at: string;
  // Megabuild extensions
  buffer_minutes?: number;
  processing_minutes?: number;
  finishing_minutes?: number;
  photo_urls?: string[];
  daily_limit_per_staff?: number | null;
}

export interface AvailabilitySlot {
  id: string;
  salon_id: string;
  service_id: string;
  staff_member_id: string | null;
  starts_at: string;
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
  // Megabuild extensions
  payment_status?: PaymentStatus;
  paid_amount?: number | null;
  platform_fee?: number | null;
  refunded_amount?: number;
  completed_at?: string | null;
  group_booking_id?: string | null;
  paid_via?: PaidVia;
  acquisition_source?: string | null;
  stripe_setup_intent_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_method_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
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
  next_booking_date: string; // date string
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
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  favorite_quartier_ids: string[];
  favorite_service_slugs: string[];
  quartier_visit_counts: Record<string, number>;
  last_booked_service: string | null;
  booking_intervals: Record<string, number>;
  dismissed_nudges: Record<string, boolean>;
  view_preference: "list" | "map";
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Composite / Derived Types
// ---------------------------------------------------------------------------

/** Availability slot enriched with salon + service data — used for Last-Minute page */
export interface LastMinuteSlot extends AvailabilitySlot {
  salon: Pick<Salon, "id" | "name" | "slug" | "cover_photo_url" | "quartier" | "average_rating">;
  service: Pick<Service, "id" | "name_de" | "name_en" | "category" | "duration_minutes">;
  staff_member: Pick<StaffMember, "id" | "name" | "avatar_url"> | null;
  discounted_price: number;
}

export interface SalonBadge {
  icon: string;
  name_de: string;
  color: string;
  bg_color: string;
}

/** Salon card — enriched with services count for list views */
export interface SalonCard extends Salon {
  services?: Service[];
  staff?: StaffMember[];
  reviews?: Review[];
  avg_price?: number | null;
  badges?: SalonBadge[];
  next_available_slot?: string;
  distance_km?: number;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  code: string;
}

export interface ApiSuccess<T = void> {
  data: T;
}

// ---------------------------------------------------------------------------
// Discovery Types
// ---------------------------------------------------------------------------

export type DiscoveryCategory = "hair" | "beard" | "nails" | "makeup" | "waxing";
export type DiscoveryContentType = "curated" | "tiktok" | "salon" | "user";
export type DiscoveryMediaType = "photo" | "tiktok";
export type DiscoveryStatus = "staging" | "published" | "flagged" | "archived";
export type DiscoverySource = "unsplash" | "pexels" | "pixabay" | "admin" | "salon" | "user" | "tiktok";
export type DiscoveryTexture = "straight" | "wavy" | "curly" | "coily" | "protective" | "bald";
export type DiscoveryGender = "male" | "female" | "unisex";

export interface DiscoveryItem {
  id: string;
  category: DiscoveryCategory;
  content_type: DiscoveryContentType;
  name: string | null;
  name_de: string | null;
  name_en: string | null;
  name_fr: string | null;
  name_it: string | null;
  description: string | null;
  description_de: string | null;
  description_en: string | null;
  description_fr: string | null;
  description_it: string | null;
  image_url: string | null;
  tiktok_url: string | null;
  tiktok_embed_html: string | null;
  tiktok_thumbnail_url: string | null;
  media_type: DiscoveryMediaType;
  source: DiscoverySource;
  source_id: string | null;
  source_url: string | null;
  author_name: string | null;
  author_url: string | null;
  alt_text: string | null;
  gender: DiscoveryGender;
  texture: DiscoveryTexture | null;
  length_category: string | null;
  style_name: string | null;
  nail_shape: string | null;
  nail_style: string | null;
  makeup_style: string | null;
  skin_tone: string | null;
  wax_area: string | null;
  tags: string[];
  vibe: string | null;
  occasion: string | null;
  maintenance: string | null;
  face_shapes: string[];
  salon_script: string | null;
  salon_script_de: string | null;
  salon_script_fr: string | null;
  salon_script_it: string | null;
  cut_guide: string | null;
  price_min: number | null;
  price_max: number | null;
  like_count: number;
  save_count: number;
  view_count: number;
  status: DiscoveryStatus;
  flag_reason: string | null;
  is_active: boolean;
  sort_order: number;
  owner_user_id: string | null;
  owner_salon_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryBoard {
  id: string;
  name: string;
  name_de: string | null;
  name_en: string | null;
  name_fr: string | null;
  name_it: string | null;
  slug: string;
  description: string | null;
  category: string | null;
  texture: string | null;
  style_name: string | null;
  gender: string | null;
  cover_images: string[];
  pin_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DiscoveryStagingItem {
  id: string;
  category: DiscoveryCategory | null;
  image_url: string | null;
  thumbnail_url: string | null;
  tiktok_url: string | null;
  tiktok_embed_html: string | null;
  media_type: DiscoveryMediaType;
  source: DiscoverySource;
  source_id: string;
  source_url: string | null;
  author_name: string | null;
  author_url: string | null;
  alt_text: string | null;
  auto_gender: string | null;
  auto_texture: string | null;
  auto_style: string | null;
  auto_category: string | null;
  auto_tags: string[];
  api_tags: string[];
  ai_description: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  rejected_reason: string | null;
  batch_id: string | null;
  created_at: string;
}

export interface DiscoveryComment {
  id: string;
  user_id: string;
  item_id: string;
  text: string;
  is_flagged: boolean;
  flag_reason: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface DiscoveryCollection {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
}

export interface DiscoveryFeedResponse {
  items: DiscoveryItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface DiscoveryFilters {
  category?: DiscoveryCategory;
  gender?: DiscoveryGender;
  texture?: DiscoveryTexture;
  style?: string;
  search?: string;
  creator?: string;
}

export interface AIVisionResult {
  category: DiscoveryCategory;
  gender: DiscoveryGender;
  texture: DiscoveryTexture | null;
  style_name: string | null;
  tags: string[];
  description_de: string;
  description_en: string;
  description_fr: string;
  description_it: string;
  salon_script_de: string | null;
  cut_guide: string | null;
}

// ---------------------------------------------------------------------------
// Megabuild Types (Phase 5)
// ---------------------------------------------------------------------------

export type PaymentStatus = 'pending' | 'card_saved' | 'deposit_held' | 'paid' | 'none' | 'refunded' | 'partially_refunded' | 'disputed';
export type AutoAssignMethod = 'least_booked_week' | 'least_booked_today' | 'round_robin' | 'manual_priority';
export type AdjustmentStatus = 'pending' | 'accepted' | 'disputed' | 'expired';
export type GroupEventType = 'bridal' | 'birthday' | 'corporate' | 'other';
export type PhotoType = 'before' | 'after' | 'progress';
export type IntakeTemplateKey = 'hair_consultation' | 'nail_consultation' | 'waxing_consultation' | 'makeup_consultation' | 'spa_consultation';
export type PaidVia = 'stripe' | 'package' | 'gift_card' | 'walk_in';

export interface StaffInvite {
  id: string;
  salon_id: string;
  email: string;
  staff_name: string | null;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_member_id: string;
  salon_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_alternate_week: boolean;
  alternate_week_parity: number;
  is_active: boolean;
}

export interface StaffBreak {
  id: string;
  staff_member_id: string;
  salon_id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
}

export interface StaffTimeOff {
  id: string;
  staff_member_id: string;
  salon_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  approved_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface SalonClosure {
  id: string;
  salon_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface StaffService {
  staff_member_id: string;
  service_id: string;
}

export interface GuestBooking {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  account_created: boolean;
  created_at: string;
}

export interface GroupBooking {
  id: string;
  organizer_user_id: string | null;
  organizer_name: string;
  organizer_phone: string | null;
  salon_id: string;
  group_size: number;
  event_type: GroupEventType | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  total_amount: number | null;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  salon_id: string;
  service_id: string;
  name: string;
  total_sessions: number;
  bonus_sessions: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface PackagePurchase {
  id: string;
  package_id: string;
  user_id: string;
  salon_id: string;
  sessions_total: number;
  sessions_used: number;
  stripe_payment_intent_id: string | null;
  purchased_at: string;
  expires_at: string | null;
}

export interface ClientFormula {
  id: string;
  salon_id: string;
  customer_id: string;
  booking_id: string | null;
  brand: string | null;
  product_line: string | null;
  mix_formula: string;
  developer_volume: string | null;
  processing_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntakeFormResponse {
  id: string;
  salon_id: string;
  customer_id: string;
  template_key: IntakeTemplateKey;
  responses: Record<string, unknown>;
  ai_recommendation: string | null;
  filled_at: string;
}

export interface ClientPhoto {
  id: string;
  salon_id: string;
  customer_id: string;
  booking_id: string | null;
  photo_url: string;
  photo_type: PhotoType;
  published_to_discovery: boolean;
  discovery_item_id: string | null;
  created_at: string;
}

export interface Tip {
  id: string;
  booking_id: string;
  staff_member_id: string | null;
  salon_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface GiftCard {
  id: string;
  salon_id: string;
  code: string;
  original_amount: number;
  remaining_amount: number;
  purchaser_user_id: string | null;
  purchaser_email: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  message: string | null;
  stripe_payment_intent_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

