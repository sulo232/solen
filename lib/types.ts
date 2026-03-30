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

export type CitySlug = "basel" | "zuerich" | "bern";

export type BookingStatus = "pending" | "pending_approval" | "confirmed" | "cancelled" | "completed" | "no_show";

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

export interface BeautyProfile {
  hair?: {
    texture?: 'straight' | 'wavy' | 'curly';
    thickness?: 'fine' | 'thick';
    length?: 'short' | 'long';
    condition?: 'dry' | 'normal';
  };
  nails?: {
    shape?: 'almond' | 'square' | 'coffin' | 'stiletto' | 'round';
    type?: 'gel' | 'natural' | 'acrylic';
    length?: 'short' | 'medium' | 'long';
  };
  skin?: {
    type?: 'normal' | 'dry' | 'oily' | 'sensitive' | 'mixed';
  };
  stylist?: {
    gender?: 'female' | 'male' | 'no-preference';
  };
  style?: {
    vibes?: ('minimal' | 'natural' | 'bold' | 'edgy')[];
  };
}

export interface CustomerPreferences {
  allergies?: string;
  skinType?: string;
  stylistGender?: 'male' | 'female' | 'no-preference';
  accessibilityNeeds?: string;
  language?: string;
  notes?: string;
  beauty?: BeautyProfile;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  hair_type: HairType | null;
  age_group: AgeGroup | null;
  gender: Gender | null;
  is_first_visit_default: boolean;
  locale: "de" | "en" | "fr" | "it";
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
  customer_preferences?: CustomerPreferences;
  preferred_city?: CitySlug | null;
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
  description_fr?: string | null;
  description_it?: string | null;
  about_text_de?: string | null;
  about_text_en?: string | null;
  about_text_fr?: string | null;
  about_text_it?: string | null;
  categories: SalonCategory[];
  city_id: string | null; // References cities.id
  address: string;
  postal_code?: string | null;
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
  is_test?: boolean;
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
  booking_confirmation_mode?: "instant" | "manual_approval";
  is_top_pick?: boolean;
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
  bio?: string | null;
  languages?: string[];
  instagram_url?: string | null;
  years_experience?: number | null;
  commission_rate?: number;
}

export interface Service {
  id: string;
  salon_id: string;
  name_de: string;
  name_en: string;
  name_fr?: string | null;
  name_it?: string | null;
  category: SalonCategory;
  duration_minutes: number;
  price: number;
  description_de: string | null;
  description_en: string | null;
  description_fr?: string | null;
  description_it?: string | null;
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

export interface PricingRule {
  id: string;
  salon_id: string;
  rule_type: 'weekend_surcharge' | 'last_minute_discount' | 'peak_hour_surcharge' | 'off_peak_discount' | 'holiday_surcharge';
  day_of_week: number | null; // 0-6 (Sunday-Saturday), null for all days
  modifier_type: 'fixed_chf' | 'percentage';
  modifier_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  is_flagged?: boolean;
  is_hidden?: boolean;
  moderation_status?: "active" | "under_review" | "removed";
  removal_reason?: string | null;
  admin_response?: string | null;
  admin_response_at?: string | null;
  score_ergebnis?: number | null;       // 1-5 Ergebnis (quality of result)
  score_atmosphaere?: number | null;    // 1-5 Atmosphäre (friendliness)
  score_preis_leistung?: number | null; // 1-5 Preis-Leistung (value for money)
  created_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string | null;
  target_type: 'salon' | 'review' | 'user';
  target_id: string;
  reason: 'inappropriate' | 'spam' | 'fake' | 'ip_violation' | 'other';
  details: string | null;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalonDocument {
  id: string;
  salon_id: string;
  document_type: 'trade_license' | 'professional_cert' | 'hygiene_cert' | 'id_proof' | 'address_proof' | 'other';
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  uploaded_at: string;
}

export interface AccountAction {
  id: string;
  salon_id: string;
  action_type: 'warning' | 'demotion' | 'suspension' | 'removal' | 'reinstatement';
  reason: string;
  admin_id: string;
  resolved_at: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  favorite_service_slugs: string[];
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
  salon: Pick<Salon, "id" | "name" | "slug" | "cover_photo_url" | "average_rating">;
  service: Pick<Service, "id" | "name_de" | "name_en" | "category" | "duration_minutes">;
  staff_member: Pick<StaffMember, "id" | "name" | "avatar_url"> | null;
  discounted_price: number;
  original_price?: number;
}

export interface SalonBadge {
  icon: string;
  name_de: string;
  color: string;
  bg_color: string;
}

/** Salon card — enriched with services count for list views */
export interface SalonCard extends Salon {
  city_slug?: CitySlug;
  city_name?: string;
  services?: Service[];
  staff?: StaffMember[];
  reviews?: Review[];
  avg_price?: number | null;
  min_price?: number | null;
  quartier?: string | null;
  solen_score?: number | null;
  badges?: SalonBadge[];
  next_available_slot?: string;
  distance_km?: number;
  available_on_date?: boolean;
  next_available_date?: string;
  pricing_surcharge?: { amount: number; label: string } | null;
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
export type DiscoveryMediaType = "photo" | "tiktok" | "video";
export type DiscoveryStatus = "staging" | "published" | "flagged" | "archived";
export type DiscoverySource = "unsplash" | "pexels" | "pixabay" | "admin" | "salon" | "user" | "tiktok";
export type DiscoveryTexture = "straight" | "wavy" | "curly" | "coily" | "protective" | "bald";
export type DiscoveryGender = "male" | "female" | "unisex" | "all";

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
  products_needed: string[];
  hair_type_match: string[];
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
  // Core identification
  style_name: string | null;
  category: DiscoveryCategory;
  gender: DiscoveryGender;
  sub_style?: string;
  texture: DiscoveryTexture | null;

  // Image analysis (what Gemini observed)
  image_analysis?: {
    hair_color_observed: string;
    hair_texture_observed: string;
    hair_density_observed: string;
    hair_length_observed: string;
    hair_condition: string;
    skin_tone_observed: string;
    face_shape_observed: string;
    age_range_observed: string;
    technique_visible: string;
  };

  // How this style works across hair textures
  works_on_textures?: {
    straight: string;
    wavy: string;
    curly: string;
    coily: string;
  };

  // Tags & maintenance
  tags: string[];
  maintenance_level: "low" | "medium" | "high" | null;
  maintenance_details?: string;
  styling_time_minutes?: number;
  grow_out_friendly?: boolean;

  // Face shapes
  face_shapes: string[];
  face_shapes_detail?: {
    oval: string;
    round: string;
    square: string;
    heart: string;
    oblong: string;
    diamond: string;
  };

  // Hair type matching
  hair_type_match: string[];
  best_for?: string;
  not_ideal_for?: string;

  // Products — new texture-adaptive format
  products_needed: {
    universal?: string[];
    straight_hair?: string[];
    wavy_hair?: string[];
    curly_hair?: string[];
    coily_hair?: string[];
  } | string[]; // backward compat: can also be flat string[]
  products_flat?: string[];

  // Color info
  color_info?: {
    has_color_treatment?: boolean;
    color_technique?: string;
    color_description?: string;
    color_maintenance?: string;
    color_price_addition_chf?: number;
    // Legacy fields
    base?: string;
    highlights?: string | null;
    technique?: string | null;
  } | null;

  // Descriptions in 4 languages
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  description_it: string | null;

  // Salon scripts
  salon_script_de: string | null;
  salon_script_en?: string;
  salon_script_fr?: string | null;
  salon_script_it?: string | null;

  // Cut guides
  cut_guide: string | null;
  cut_guide_by_texture?: {
    straight: string;
    wavy: string;
    curly: string;
    coily: string;
  };

  // Styling instructions
  styling_instructions?: {
    step_by_step: string[];
    tools_needed: string[];
    pro_tips: string[];
  };

  // Pricing
  price_min: number | null;
  price_max: number | null;
  price_breakdown?: string;

  // Search / discovery
  similar_search_queries?: string[];
  tiktok_search_queries?: string[];
  seasonal_relevance?: string;
  trending_score?: number;
  confidence?: number;

  // Legacy fields (backward compat)
  is_relevant?: boolean;
  rejection_reason?: string | null;
  lengths?: { sides: string; top: string; back: string } | null;
  estimated_time_minutes?: number | null;
}

// ---------------------------------------------------------------------------
// Megabuild Types (Phase 5)
// ---------------------------------------------------------------------------

export type PaymentStatus = 'pending' | 'card_saved' | 'deposit_held' | 'paid' | 'none' | 'refunded' | 'partially_refunded' | 'disputed';
export type AutoAssignMethod = 'least_booked_week' | 'least_booked_today' | 'round_robin' | 'manual_priority';
export type AdjustmentStatus = 'pending' | 'accepted' | 'disputed' | 'expired';

export type DisputeIssueType = 'quality' | 'no_show_by_salon' | 'wrong_service' | 'overcharge' | 'other';
export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'escalated';

export interface BookingDispute {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_id: string;
  issue_type: DisputeIssueType;
  description: string;
  status: DisputeStatus;
  salon_response?: string | null;
  salon_responded_at?: string | null;
  resolution?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  mediation_started_at?: string | null;
  mediation_deadline_at?: string | null;
  created_at: string;
  updated_at: string;
}

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

// ---------------------------------------------------------------------------
// Nail Types
// ---------------------------------------------------------------------------

export type NailShape = 'round' | 'square' | 'almond' | 'coffin' | 'stiletto' | 'oval' | 'squoval' | 'ballerina' | 'lipstick' | 'edge';
export type NailLength = 'natural' | 'short' | 'medium' | 'long' | 'extra_long';
export type NailMaterial = 'natural' | 'gel' | 'acrylic' | 'dip_powder' | 'biab' | 'shellac' | 'polygel' | 'press_on' | 'gel_x';
export type NailStyleCategory = 'french' | 'ombre' | 'chrome' | '3d' | '3d_art' | 'marble' | 'minimalist' | 'minimal' | 'glitter' | 'abstract' | 'floral' | 'geometric' | 'solid' | 'negative_space' | 'encapsulated' | 'cat_eye' | 'aurora' | 'velvet' | 'glazed_donut' | 'bridal';
export type NailAllergySeverity = 'mild' | 'moderate' | 'severe';
export type NailRetailCategory = 'cuticle_oil' | 'hand_cream' | 'press_on' | 'nail_kit' | 'polish' | 'other';
export type DynamicPricingRuleType = 'peak' | 'off_peak' | 'day_special' | 'demand' | 'segment' | 'peak_hour' | 'weekend' | 'last_minute' | 'loyalty';
export type StaffTier = 'junior' | 'standard' | 'senior' | 'master';

export interface NailDesignHistory {
  id: string;
  salon_id: string;
  customer_id: string;
  booking_id: string | null;
  staff_member_id: string | null;
  shape: NailShape | null;
  length: NailLength | null;
  material: NailMaterial | null;
  style_category: NailStyleCategory | null;
  color_primary: string | null;
  color_secondary: string | null;
  color_brand: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface NailClientPreferences {
  id: string;
  salon_id: string;
  customer_id: string;
  preferred_shape: NailShape | null;
  preferred_length: NailLength | null;
  preferred_material: NailMaterial | null;
  preferred_brand: string | null;
  allergies: string[];
  allergy_severity: NailAllergySeverity;
  allergy_notes: string | null;
  skin_sensitivity: 'normal' | 'sensitive' | 'very_sensitive' | null;
  notes: string | null;
  updated_at: string;
}

export interface NailInspoBoard {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
}

export interface NailInspoImage {
  id: string;
  user_id: string;
  board_id: string | null;
  booking_id: string | null;
  image_url: string;
  source_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface NailStation {
  id: string;
  salon_id: string;
  station_count: number;
  has_uv_lamps: boolean;
  uv_lamp_count: number;
  sterilization_buffer_minutes: number;
  created_at: string;
}

export interface NailDynamicPricingRule {
  id: string;
  salon_id: string;
  rule_type: DynamicPricingRuleType;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  price_modifier: number;
  label_de: string | null;
  label_en: string | null;
  label_fr: string | null;
  label_it: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NailRetailProduct {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: NailRetailCategory;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Barber Types
// ---------------------------------------------------------------------------

export type FadeType = 'skin' | 'low' | 'mid' | 'high' | 'taper' | 'drop' | 'temp' | 'burst' | 'none';
export type TopStyle = 'scissors' | 'textured' | 'slicked_back' | 'pompadour' | 'crew' | 'buzz' | 'flat_top' | 'mohawk' | 'freeform' | 'other';
export type BeardStyle = 'full_shape' | 'trim' | 'sculpt' | 'shave' | 'goatee' | 'stubble' | 'none';
export type WalkinStatus = 'waiting' | 'in_chair' | 'completed' | 'no_show' | 'cancelled';
export type WalkinJoinMethod = 'in_person' | 'remote' | 'kiosk';
export type LoyaltyRewardType = 'free_service' | 'chf_discount' | 'percentage_discount';
export type LoyaltyCardStatus = 'active' | 'redeemable' | 'redeemed';

export interface BarberWalkinQueue {
  id: string;
  salon_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  service_id: string | null;
  assigned_barber_id: string | null;
  preferred_barber_id: string | null;
  status: WalkinStatus;
  position: number;
  estimated_wait_minutes: number | null;
  tracking_token: string;
  joined_at: string;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  join_method: WalkinJoinMethod;
  converted_to_booking: boolean;
}

export interface BarberCutHistory {
  id: string;
  salon_id: string;
  customer_id: string | null;
  customer_name: string | null;
  booking_id: string | null;
  walkin_id: string | null;
  staff_member_id: string | null;
  side_length: string | null;
  top_style: TopStyle | null;
  fade_type: FadeType | null;
  lineup: boolean;
  beard_style: BeardStyle | null;
  hair_design: string | null;
  product_used: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface BarberLoyaltyProgram {
  id: string;
  salon_id: string;
  name: string;
  stamps_required: number;
  reward_type: LoyaltyRewardType;
  reward_value: number;
  reward_service_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BarberLoyaltyCard {
  id: string;
  program_id: string;
  salon_id: string;
  customer_id: string;
  stamps: number;
  status: LoyaltyCardStatus;
  qr_token: string;
  redeemed_at: string | null;
  created_at: string;
}

export interface BarberLoyaltyHistory {
  id: string;
  card_id: string;
  salon_id: string;
  customer_id: string;
  stamps_collected: number;
  reward_type: string;
  reward_value: number | null;
  completed_at: string;
  redeemed_at: string | null;
  created_at: string;
}

export interface BarberChairs {
  id: string;
  salon_id: string;
  chair_count: number;
  buffer_minutes: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Search Types
// ---------------------------------------------------------------------------

export interface SearchEmbedding {
  id: string;
  entity_type: "service" | "salon" | "discovery_item";
  entity_id: string;
  category: SalonCategory;
  text_content: string;
  embedding: number[];
  updated_at: string;
}

export interface SmartSearchResult {
  entity_type: "service" | "salon";
  entity_id: string;
  salon_id: string;
  name: string;
  category: SalonCategory;
  similarity: number;
}

export interface AvailableDate {
  date: string;           // ISO date (YYYY-MM-DD)
  slot_count: number;     // how many open slots
}

export interface SalonDraft {
  id: string;
  user_id: string;
  draft_data: Record<string, unknown>;
  current_step: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Filter System Types (added: roadmap-filter-pills-A-infrastructure, Phase 1)
// ---------------------------------------------------------------------------

export type FilterZone = 1 | 2 | 3 | 4;

export interface FilterPill {
  id: string;          // e.g. "nails", "hair", "lashes"
  label: string;       // Display label (translated)
  icon?: string;       // Optional lucide icon name
  subFilters?: FilterSubItem[];
}

export interface FilterSubItem {
  id: string;
  label: string;
  count?: number;      // Optional result count badge
}

export interface ActiveFilter {
  pillId: string;
  subId: string;
  label: string;       // For the removable chip display
}

export interface FilterBarProps {
  pills: FilterPill[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  zone: FilterZone;    // MANDATORY — per UI_RULES Rule 31
  className?: string;
}

