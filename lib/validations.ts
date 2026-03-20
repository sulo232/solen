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
