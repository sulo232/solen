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
  locale: z.enum(["de", "en"]).optional(),
  onboarding_completed: z.boolean().optional(),
  notification_email: z.boolean().optional(),
  notification_sms: z.boolean().optional(),
  phone_number: z.string().max(20).optional().nullable(),
  disc_gender: z.enum(["male", "female", "unisex"]).nullable().optional(),
  disc_hair_texture: z.string().max(30).nullable().optional(),
  disc_hair_length: z.string().max(30).nullable().optional(),
  disc_face_shape: z.string().max(30).nullable().optional(),
  disc_profile_set: z.boolean().optional(),
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

export const directorySearchSchema = z.object({
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().max(50).optional(),
  quartier: z.string().max(50).optional(),
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
  element_selector: z.string().max(500).optional(),
  element_tag: z.string().max(50).optional(),
  element_text: z.string().max(500).optional(),
  component_hint: z.string().max(100).optional(),
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
  tos_accepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
});

export const discoveryCommentSchema = z.object({
  item_id: z.string().uuid(),
  text: z.string().min(1).max(500),
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
  page: z.coerce.number().int().min(1).default(1),
});

export const discoveryStagingSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  gender: z.enum(["female", "male", "unisex"]).optional(),
  style_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const discoveryTikTokImportSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(20),
});

// ─── Megabuild Schemas ──────────────────────────────────────────────────────

export const createCheckoutSchema = z.object({
  slot_id: z.string().uuid(),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
  addon_ids: z.array(z.string().uuid()).optional(),
  is_first_visit: z.boolean().optional(),
  gift_card_code: z.string().max(20).optional(),
  referral_code: z.string().max(20).optional(),
  acquisition_source: z.string().max(50).optional(),
});

export const guestBookingSchema = z.object({
  guest_name: z.string().min(2).max(100),
  guest_phone: z.string().regex(/^\+41[0-9]{9}$/, "Swiss phone number required"),
  guest_email: z.string().email().optional(),
});

export const priceAdjustmentSchema = z.object({
  requested_amount: z.number().int().min(0).max(100000),
  reason: z.string().min(3).max(500),
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

export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): { data: T; error: null } | { data: null; error: { message: string } } {
  const obj: Record<string, string> = {};
  params.forEach((v, k) => { obj[k] = v; });
  return validateBody(schema, obj);
}
