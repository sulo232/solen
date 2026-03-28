import { z, ZodSchema } from "zod";

// ─── Helper ──────────────────────────────────────────────────────────────────

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): { data: T; error: null } | { data: null; error: { message: string } } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { data: null, error: { message } };
  }
  return { data: result.data, error: null };
}

// ─── UUID helper ─────────────────────────────────────────────────────────────

const uuid = z.string().uuid();

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const tosAcceptSchema = z.object({
  version: z.string().min(1).max(100),
});

export const createBookingSchema = z.object({
  slot_id: uuid,
  service_id: uuid,
  staff_member_id: uuid.optional(),
  is_first_visit: z.boolean().optional(),
});

export const createReviewSchema = z.object({
  booking_id: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  staff_member_id: uuid.optional(),
  score_ergebnis: z.number().int().min(1).max(5).optional(),
  score_atmosphaere: z.number().int().min(1).max(5).optional(),
  score_preis_leistung: z.number().int().min(1).max(5).optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  message_type: z.enum(["text", "image", "system", "price_offer"]).default("text"),
  image_url: z.string().url().optional().nullable(),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  hair_type: z.string().max(50).optional().nullable(),
  age_group: z.string().max(20).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  locale: z.enum(["de", "en", "fr", "it"]).optional(),
  onboarding_completed: z.boolean().optional(),
  notification_email: z.boolean().optional(),
  notification_sms: z.boolean().optional(),
  phone_number: z.string().max(20).optional().nullable(),
  disc_gender: z.enum(["male", "female", "unisex"]).nullable().optional(),
  disc_hair_texture: z.string().max(30).nullable().optional(),
  disc_hair_length: z.string().max(30).nullable().optional(),
  disc_face_shape: z.string().max(30).nullable().optional(),
  disc_profile_set: z.boolean().optional(),
  customer_preferences: z.any().optional(),
}).strict();

export const createConversationSchema = z.object({
  salon_id: uuid,
});

export const createPaymentIntentSchema = z.object({
  salon_id: uuid,
  service_name: z.string().max(200).optional(),
  estimated_price: z.number().positive(),
  deposit_amount: z.number().positive(),
});

export const validatePromoSchema = z.object({
  code: z.string().min(1).max(30).transform((v) => v.toUpperCase().trim()),
  salon_id: uuid.optional(),
  booking_amount: z.number().positive(),
});

export const createPromoSchema = z.object({
  code: z.string().min(3).max(30).transform((v) => v.toUpperCase().trim()),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().positive(),
  min_booking_amount: z.number().min(0).default(0),
  max_uses: z.number().int().positive().optional().nullable(),
  salon_id: uuid.optional().nullable(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional().nullable(),
});

export const completeReferralSchema = z.object({
  referral_code: z.string().min(1).max(30).transform((v) => v.toUpperCase().trim()),
});

// ─── Visual Editor ───
export const createFeatureRequestSchema = z.object({
  element_selector: z.string().max(500).nullish(),
  element_tag: z.string().max(50).nullish(),
  element_text: z.string().max(500).nullish(),
  component_hint: z.string().max(100).nullish(),
  page_url: z.string().max(500).refine((v) => v.startsWith("/"), { message: "page_url must start with /" }),
  description: z.string().min(5).max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const updateFeatureRequestSchema = z.object({
  status: z.enum(["pending", "roadmap_generated", "in_progress", "done", "reverted"]).optional(),
  description: z.string().min(5).max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const generateRoadmapSchema = z.object({
  requestId: z.string().uuid(),
});

// ─── Discovery ──────────────────────────────────────────────────────────────

export const discoveryFeedSchema = z.object({
  category: z.enum(["all", "hair", "beard", "nails", "makeup", "waxing"]).default("all"),
  gender: z.enum(["all", "female", "male", "unisex"]).default("all"),
  texture: z.string().optional(),
  style: z.string().optional(),
  search: z.string().max(100).optional(),
  creator: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const discoveryPostSchema = z.object({
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]),
  gender: z.enum(["female", "male", "unisex"]),
  media_type: z.enum(["photo", "video"]),
  tiktok_url: z.string().url().optional(),
  style_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  description: z.string().max(1000).optional(),
  texture: z.string().optional(),
  tos_accepted: z.boolean().refine((val) => val === true, { message: "You must accept the Terms of Service" }),
});

export const discoveryCommentSchema = z.object({
  item_id: z.string().uuid(),
  text: z.string().min(1).max(500),
});

// ─── Salon Registration ─────────────────────────────────────────────────────

const salonCategory = z.enum(["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"]);

export const createSalonSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  categories: z.array(z.string()).min(1),
  city: z.string().min(1),
  address: z.string().min(5).max(200),
  phone: z.string().max(20).optional().or(z.literal("")),
  phone_verified: z.boolean().optional(),
  cover_photo_url: z.string().url().optional().or(z.literal("")),
  gallery_urls: z.array(z.string()).optional(),
  description_de: z.string().max(500).optional().or(z.literal("")),
  description_en: z.string().max(500).optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  tiktok_url: z.string().url().optional().or(z.literal("")),
  opening_hours: z.record(z.string(), z.unknown()).optional(),
  services: z.array(z.object({
    name_de: z.string().min(1),
    name_en: z.string().optional().or(z.literal("")),
    name_fr: z.string().optional().or(z.literal("")),
    name_it: z.string().optional().or(z.literal("")),
    category: z.string().optional(),
    duration_minutes: z.number().min(5).max(480).default(60),
    price: z.number().min(0).default(0),
    description_de: z.string().optional().or(z.literal("")),
  })).optional(),
  staff: z.array(z.object({
    name: z.string().min(1),
    avatar_url: z.string().optional().or(z.literal("")),
    role: z.string().optional().or(z.literal("")),
    specialties: z.array(z.string()).optional(),
  })).optional(),
  availability_template: z.record(z.string(), z.union([
    z.object({
      start: z.string(),
      end: z.string(),
      breaks: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    }),
    z.null(),
  ])).optional(),
  last_minute_discount_percent: z.number().min(0).max(50).optional(),
  last_minute_window_hours: z.number().min(0).max(24).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  google_place_id: z.string().optional().or(z.literal("")),
  cancellation_policy: z.string().optional().or(z.literal("")),
  tos_accepted: z.literal(true).optional(),
});

export const discoveryLikeSchema = z.object({
  item_id: z.string().uuid(),
});

export const discoverySaveSchema = z.object({
  item_id: z.string().uuid(),
  collection_id: z.string().uuid().optional(),
});

export const discoverySearchStockSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  source: z.enum(["unsplash", "pexels", "pixabay", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const discoveryStagingSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(["approve", "reject"]),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  gender: z.enum(["female", "male", "unisex"]).optional(),
  style_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  reject_reason: z.string().max(500).optional(),
});

export const discoveryTikTokImportSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(20),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
});

// ─── Megabuild Schemas ──────────────────────────────────────────────────────

export const priceAdjustmentSchema = z.object({
  requested_amount: z.number().int().min(0).max(100000),
  salon_reason: z.string().min(3).max(500),
});

export const disputeResponseSchema = z.object({
  action: z.enum(["approve", "dispute"]),
  customer_response: z.string().max(500).optional(),
});

export const staffInviteSchema = z.object({
  email: z.string().email(),
  staff_name: z.string().min(2).max(100).optional(),
});

export const walkInSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().regex(/^\+41[0-9]{9}$/),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
});

export const groupBookingSchema = z.object({
  organizer_name: z.string().min(2).max(100),
  organizer_phone: z.string().optional(),
  group_size: z.number().int().min(2).max(20),
  event_type: z.enum(['bridal','birthday','corporate','other']),
  members: z.array(z.object({
    name: z.string().min(2),
    service_id: z.string().uuid(),
    staff_member_id: z.string().uuid().optional(),
  })).min(2).max(20),
});

export const giftCardPurchaseSchema = z.object({
  salon_id: z.string().uuid(),
  amount: z.number().int().min(1000).max(50000),
  recipient_email: z.string().email(),
  recipient_name: z.string().min(2).max(100),
  message: z.string().max(500).optional(),
});

export const tipSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().int().min(100).max(10000),
});

export const formulaSchema = z.object({
  brand: z.string().max(100).optional(),
  product_line: z.string().max(100).optional(),
  mix_formula: z.string().min(1).max(500),
  developer_volume: z.string().max(50).optional(),
  processing_minutes: z.number().int().min(1).max(120).optional(),
  notes: z.string().max(1000).optional(),
  booking_id: z.string().uuid().optional(),
  shade_code: z.string().max(50).optional(),
  root_formula: z.record(z.string(), z.unknown()).optional(),
  mid_lengths_formula: z.record(z.string(), z.unknown()).optional(),
  ends_formula: z.record(z.string(), z.unknown()).optional(),
  staff_member_id: z.string().uuid().optional(),
});

export const consultationNoteSchema = z.object({
  client_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  hair_condition: z.string().max(500).optional(),
  scalp_condition: z.string().max(500).optional(),
  current_dislikes: z.string().max(1000).optional(),
  desired_outcome: z.string().max(1000).optional(),
  allergies: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const closureSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export const scheduleSchema = z.object({
  staff_member_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_alternate_week: z.boolean().optional(),
  alternate_week_parity: z.number().int().min(0).max(1).optional(),
});

export const packageSchema = z.object({
  service_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  total_sessions: z.number().int().min(2).max(50),
  bonus_sessions: z.number().int().min(0).max(10),
  price: z.number().int().min(100),
});

// ---------------------------------------------------------------------------
// Nail Schemas
// ---------------------------------------------------------------------------

export const nailDesignHistorySchema = z.object({
  shape: z.enum(['round','square','almond','coffin','stiletto','oval','squoval','ballerina','lipstick','edge']).optional(),
  length: z.enum(['natural','short','medium','long','extra_long']).optional(),
  material: z.enum(['natural','gel','acrylic','dip_powder','biab','shellac','polygel','press_on','gel_x']).optional(),
  style_category: z.enum(['french','ombre','chrome','3d','marble','minimalist','glitter','abstract','floral','geometric','solid','negative_space','encapsulated','cat_eye','aurora','velvet','glazed_donut']).optional(),
  color_primary: z.string().max(50).optional(),
  color_secondary: z.string().max(50).optional(),
  color_brand: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  booking_id: z.string().uuid().optional(),
});

export const nailPreferencesSchema = z.object({
  preferred_shape: z.enum(['round','square','almond','coffin','stiletto','oval','squoval','ballerina','lipstick','edge']).optional(),
  preferred_length: z.enum(['natural','short','medium','long','extra_long']).optional(),
  preferred_material: z.enum(['natural','gel','acrylic','dip_powder','biab','shellac','polygel','press_on','gel_x']).optional(),
  preferred_brand: z.string().max(100).optional(),
  allergies: z.array(z.string().max(100)).max(20).optional(),
  allergy_severity: z.enum(['mild','moderate','severe']).optional(),
  allergy_notes: z.string().max(500).optional(),
  skin_sensitivity: z.enum(['normal','sensitive','very_sensitive']).optional(),
});

export const nailInspoSchema = z.object({
  board_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  source_url: z.string().url().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const nailStationSchema = z.object({
  station_count: z.number().int().min(1).max(50),
  has_uv_lamps: z.boolean().optional(),
  uv_lamp_count: z.number().int().min(0).max(50).optional(),
  sterilization_buffer_minutes: z.number().int().min(0).max(60).optional(),
});

export const nailDynamicPricingSchema = z.object({
  rule_type: z.enum(['peak','off_peak','day_special','demand','segment']),
  day_of_week: z.number().int().min(0).max(6).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  price_modifier: z.number().min(0.5).max(2.0),
  label_de: z.string().max(100).optional(),
  label_en: z.string().max(100).optional(),
});

export const nailRetailProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().int().min(100).max(50000),
  category: z.enum(['cuticle_oil','hand_cream','press_on','nail_kit','polish','other']),
});

export const nailPortfolioTagsSchema = z.object({
  nail_style: z.string().max(50).optional(),
  nail_shape: z.string().max(50).optional(),
  nail_material: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ---------------------------------------------------------------------------
// Barber Schemas
// ---------------------------------------------------------------------------

export const walkinJoinSchema = z.object({
  salon_id: z.string().uuid(),
  customer_name: z.string().min(1).max(100),
  customer_phone: z.string().max(20).optional(),
  service_id: z.string().uuid().optional(),
  preferred_barber_id: z.string().uuid().optional(),
  join_method: z.enum(['in_person', 'remote', 'kiosk']).default('in_person'),
});

export const walkinUpdateSchema = z.object({
  status: z.enum(['waiting', 'in_chair', 'completed', 'no_show', 'cancelled']),
  assigned_barber_id: z.string().uuid().optional(),
});

export const cutHistorySchema = z.object({
  customer_id: z.string().uuid().optional(),
  customer_name: z.string().max(100).optional(),
  booking_id: z.string().uuid().optional(),
  walkin_id: z.string().uuid().optional(),
  staff_member_id: z.string().uuid().optional(),
  side_length: z.string().max(50).optional(),
  top_style: z.enum(['scissors','textured','slicked_back','pompadour','crew','buzz','flat_top','mohawk','freeform','other']).optional(),
  fade_type: z.enum(['skin','low','mid','high','taper','drop','temp','burst','none']).optional(),
  lineup: z.boolean().optional(),
  beard_style: z.enum(['full_shape','trim','sculpt','shave','goatee','stubble','none']).optional(),
  hair_design: z.string().max(200).optional(),
  product_used: z.string().max(200).optional(),
  photo_url: z.string().url().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const loyaltyProgramSchema = z.object({
  name: z.string().min(1).max(100).default('Treuekarte'),
  stamps_required: z.number().int().min(3).max(20).default(10),
  reward_type: z.enum(['free_service', 'chf_discount', 'percentage_discount']).default('free_service'),
  reward_value: z.number().int().min(0).optional(),
  reward_service_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

export const loyaltyStampSchema = z.object({
  token: z.string().min(10).max(200),
});

export const barberChairsSchema = z.object({
  chair_count: z.number().int().min(1).max(20),
  buffer_minutes: z.number().int().min(0).max(30).optional(),
});

export const barberProfileSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  cover_photo_url: z.string().url().max(500).optional(),
  accent_color: z.string().max(7).optional(),
});

// ─── Payment Security Schemas ─────────────────────────────────────────────────

export const approveIncreaseSchema = z.object({
  booking_id: z.string().uuid(),
});

export const confirmPriceSchema = z.object({
  booking_id: z.string().uuid(),
  final_price: z.number().min(0).max(100000),
});

export const giftCardRedeemSchema = z.object({
  code: z.string().min(1).max(30).transform((v) => v.toUpperCase().trim()),
  amount: z.number().int().min(1).max(100000),
});

export const packageRedeemSchema = z.object({
  purchase_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
});

export const packagePurchaseSchema = z.object({
  package_id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Auth Schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  display_name: z.string().min(1).max(100).optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(4).max(10),
  type: z.enum(["email", "sms", "magiclink"]).optional(),
});

// ---------------------------------------------------------------------------
// Admin Schemas
// ---------------------------------------------------------------------------

export const adminTosNotifySchema = z.object({
  target: z.enum(["all", "salon_partners", "customers"]),
});

export const adminBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  criteria: z.string().max(500).optional(),
});

export const adminBadgeAssignSchema = z.object({
  badge_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()).min(1).max(100),
});

export const adminContentUpdateSchema = z.object({
  content: z.string().min(1).max(50000),
  locale: z.enum(["de", "en", "fr", "it"]).optional(),
});

export const adminCommissionSchema = z.object({
  salon_id: z.string().uuid(),
  rate: z.number().min(0).max(100),
});

export const adminFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
});

export const reportDisputeSchema = z.object({
  issue_type: z.enum(['quality', 'no_show_by_salon', 'wrong_service', 'overcharge', 'other']),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
});

export const salonDisputeResponseSchema = z.object({
  salon_response: z.string().min(10, 'Response must be at least 10 characters').max(1000),
});

export const adminDisputeBookingActionSchema = z.object({
  dispute_id: z.string().uuid(),
  action: z.enum(['dismiss', 'warn_customer', 'warn_salon', 'escalate', 'resolve_with_note', 'refund']),
  resolution_note: z.string().max(500).optional(),
  refund_amount: z.number().int().positive().optional(), // in cents (Stripe)
});

export const adminDisputeActionSchema = z.object({
  dispute_id: z.string().uuid(),
  action: z.enum(["resolve", "refund", "dismiss"]),
  admin_notes: z.string().max(1000).optional(),
  decision: z.string().max(100).optional(),
  admin_amount: z.number().int().min(0).optional(),
});

export const adminHelpArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1).max(50000),
  category: z.string().max(100),
  locale: z.enum(["de", "en", "fr", "it"]).default("de"),
  published: z.boolean().default(false),
  sort_order: z.number().int().min(0).optional(),
});

export const adminSalonRejectSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const adminSalonOfMonthSchema = z.object({
  salon_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  reason: z.string().max(500).optional(),
});

export const adminNotifyNewSalonSchema = z.object({
  salon_id: z.string().uuid(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["customer", "salon_owner", "admin"]).optional(),
  banned_at: z.string().datetime().nullable().optional(),
  ban_reason: z.string().max(500).nullable().optional(),
});

export const adminReviewActionSchema = z.object({
  moderation_status: z.enum(["active", "under_review", "removed"]).optional(),
  removal_reason: z.string().max(500).optional(),
  admin_response: z.string().max(500).optional(),
});

export const flagReviewSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const adminDiscoveryItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]),
  gender: z.enum(["female", "male", "unisex"]).optional(),
  content_type: z.enum(["inspo", "tutorial", "before_after"]).optional(),
  image_url: z.string().url().optional(),
  tiktok_url: z.string().url().optional(),
  style_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  description: z.string().max(2000).optional(),
});

export const adminDiscoveryModerationSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid().optional(),
  action: z.enum(["approve", "reject", "flag"]),
  reason: z.string().max(500).optional(),
});

export const adminDiscoveryBulkImportSchema = z.object({
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]),
});

export const adminDiscoverySmartImportSchema = z.object({
  description: z.string().min(1).max(500),
  source: z.enum(["unsplash", "pexels", "pixabay", "all"]).default("all"),
  count: z.number().int().min(1).max(50).default(10),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const adminDiscoveryAnalyzeSchema = z.object({
  item_id: z.string().uuid(),
  image_url: z.string().url(),
});

export const adminDiscoveryBackfillSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  force: z.boolean().optional(),
});

export const adminNailGenerateSchema = z.object({
  style: z.string().max(100).optional(),
  shape: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  colors: z.array(z.string()).max(5).optional(),
  length: z.enum(["short", "medium", "long", "extra_long"]).optional(),
  material: z.enum(["gel", "acrylic", "natural", "polygel"]).optional(),
  skinTone: z.string().max(50).optional(),
  shotType: z.enum(["hero", "top_down", "macro", "lifestyle"]).optional(),
  skin_tone: z.string().max(50).optional(),
  prompt: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Booking Mutation Schemas
// ---------------------------------------------------------------------------

export const bookingCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const bookingPatchSchema = z.object({
  status: z.enum(["completed", "no_show", "cancelled"]),
});

export const bookingInspoSchema = z.object({
  image_ids: z.array(z.string().uuid()).max(10).optional(),
  inspo_image_id: z.string().uuid().optional(),
  image_url: z.string().url().max(2048).optional(),
  notes: z.string().max(500).optional(),
});

export const bookingRefundSchema = z.object({
  amount: z.number().int().min(0).max(100000),
  reason: z.string().min(3).max(500),
});

export const bookingRescheduleSchema = z.object({
  new_slot_id: z.string().uuid(),
});

export const expressRebookSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid(),
  rebook_from_booking_id: z.string().uuid().optional(),
});

export const expressRebookConfirmSchema = z.object({
  slot_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  staff_id: z.string().uuid().optional(),
  source_booking_id: z.string().uuid().optional(),
});

export const recurringBookingSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  custom_interval_days: z.number().int().min(1).max(90).optional(),
  preferred_day: z.number().int().min(0).max(6).optional(),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// ---------------------------------------------------------------------------
// Staff / Salon Management Schemas
// ---------------------------------------------------------------------------

export const staffBreakSchema = z.object({
  staff_member_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  label: z.string().max(100).optional(),
});

export const staffTimeOffSchema = z.object({
  staff_member_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export const staffAcceptInviteSchema = z.object({
  token: z.string().min(10).max(200),
});

export const staffServicesSchema = z.object({
  staff_member_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).min(0).max(50),
});

export const serviceCreateSchema = z.object({
  salon_id: z.string().uuid(),
  name_de: z.string().min(1).max(200),
  name_en: z.string().max(200).optional(),
  name_fr: z.string().max(200).optional(),
  name_it: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  duration_minutes: z.number().int().min(5).max(480),
  price: z.number().min(0).max(100000),
  description_de: z.string().max(1000).optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  processing_minutes: z.number().int().min(0).max(120).optional(),
  finishing_minutes: z.number().int().min(0).max(120).optional(),
  suitable_for: z.array(z.string().max(50)).optional(),
  suitable_gender: z.array(z.enum(["male", "female", "unisex"])).optional(),
  is_active: z.boolean().optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});

export const serviceUpdateSchema = z.object({
  name_de: z.string().min(1).max(200).optional(),
  name_en: z.string().max(200).optional(),
  name_fr: z.string().max(200).optional(),
  name_it: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  price: z.number().int().min(0).max(100000).optional(),
  is_active: z.boolean().optional(),
  reminder_cycle_days: z.number().int().min(1).max(365).nullable().optional(),
});

export const availabilityManageSchema = z.object({
  salon_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    starts_at: z.string(),
    ends_at: z.string(),
    service_id: z.string().uuid().optional(),
    staff_member_id: z.string().uuid().optional(),
    status: z.string().optional(),
  })).min(1).max(50),
});

// ---------------------------------------------------------------------------
// Client / Chat Schemas
// ---------------------------------------------------------------------------

export const clientNoteSchema = z.object({
  salon_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  note: z.string().min(1).max(2000),
  note_type: z.enum(["permanent", "booking"]).default("permanent"),
  booking_id: z.string().uuid().optional(),
});

export const intakeFormSchema = z.object({
  template_type: z.enum(["hair", "nail", "waxing", "makeup", "spa"]),
  responses: z.record(z.string().max(50), z.unknown()),
  template_key: z.string().max(100).optional(),
});

export const priceOfferSchema = z.object({
  amount_chf: z.number().int().min(100).max(100000),
  description: z.string().max(500).optional(),
  expires_hours: z.number().int().min(1).max(168).default(24),
  photo_url: z.string().url().max(2048).optional(),
});

export const reviewReplySchema = z.object({
  review_id: z.string().uuid(),
  reply_text: z.string().min(1).max(1000),
  is_public: z.boolean().default(true),
});

export const reviewRespondSchema = z.object({
  reply_text: z.string().min(1).max(1000),
  is_public: z.boolean().default(true),
  salon_response: z.string().min(1).max(1000).optional(),
});

export const intakeRecommendationSchema = z.object({
  template_type: z.enum(["hair", "nail", "waxing", "makeup", "spa"]),
  responses: z.record(z.string().max(50), z.unknown()),
  salon_id: z.string().uuid().optional(),
  intake_id: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Misc Schemas
// ---------------------------------------------------------------------------

export const nailDiscoveryPublishSchema = z.object({
  design_history_id: z.string().uuid(),
});

export const nailInspoBoardSchema = z.object({
  name: z.string().min(1).max(100),
  is_public: z.boolean().default(false),
});

export const retailPurchaseSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1),
  salon_id: z.string().uuid(),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(5000),
  target_locale: z.enum(["de", "en", "fr", "it"]).optional(),
  source_locale: z.enum(["de", "en", "fr", "it"]).optional(),
  from: z.string().max(10).optional(),
  to: z.union([z.string().max(10), z.array(z.string().max(10))]).optional(),
});

export const waitlistSchema = z.object({
  email: z.string().email(),
  salon_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  preferred_date: z.string().max(20).optional(),
  preferred_time_range: z.string().max(50).optional(),
});

export const quartierSubscribeSchema = z.object({
  email: z.string().email(),
  quartier: z.string().min(1).max(100),
});

export const directoryClaimSchema = z.object({
  claim_code: z.string().min(4).max(20),
});

export const trackViewSchema = z.object({
  salon_id: z.string().uuid(),
  type: z.enum(["page_view", "card_click", "booking_start"]).default("page_view"),
  source: z.string().max(100).optional(),
});

export const barberReminderSendSchema = z.object({
  client_id: z.string().uuid(),
  salon_id: z.string().uuid(),
});

export const favoriteToggleSchema = z.object({
  salon_id: z.string().uuid(),
});

export const saveCardSchema = z.object({
  salon_id: z.string().uuid(),
});

export const loyaltyAwardSchema = z.object({
  customer_id: z.string().uuid(),
  salon_id: z.string().uuid(),
});

export const loyaltyRedeemSchema = z.object({
  card_id: z.string().uuid(),
});

export const offPeakNotificationSchema = z.object({
  salon_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  enabled: z.boolean(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["de", "en", "fr", "it"]).default("de"),
});

export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): { data: T; error: null } | { data: null; error: { message: string } } {
  const obj: Record<string, string> = {};
  params.forEach((v, k) => { obj[k] = v; });
  return validateBody(schema, obj);
}

// ─── Off-Peak Schemas ───────────────────────────────────────────────────────

export const offPeakSlotSchema = z.object({
  salon_id: uuid,
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  discount_percent: z.number().int().min(1).max(50),
});

export const offPeakDeleteSchema = z.object({
  id: uuid,
});
