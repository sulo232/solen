import { z, ZodSchema } from "zod";
import { PORTFOLIO_CATEGORY_KEYS } from "@/lib/portfolio-categories";
import { REPORT_STATUSES, REPORT_TARGET_TYPES, REPORT_REASONS } from "@/lib/content-reports";

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

// seo-comms-08: the salon_directory outreach unsubscribe link's own body.
// token is the HMAC (lib/unsubscribe-token.ts) proving the caller actually received the
// outreach email at this address, so a bare email can no longer null out any salon's
// email column (that column is the only way to re-claim a listing, see the route).
export const unsubscribeSchema = z.object({
  email: z.string().email().max(320),
  token: z.string().min(1),
});

// POST /api/profile/accept-tos: a second, separately-named TOS-accept route (field is
// `tos_version`, not `version`, so it is its own schema rather than a duplicate of the
// one above). input-abuse-07 (2026-07-27).
export const profileAcceptTosSchema = z.object({
  tos_version: z.string().min(1).max(100),
});

// POST /api/me/consent: mirrors the "necessary, analytics, marketing" shape CookieConsent.tsx
// already collects client-side, but only `analytics` has a server-side mirror (profiles.
// analytics_consent) since that is the only category lib/posthog-server.ts gates on.
export const meConsentSchema = z.object({
  analytics: z.boolean(),
});

// G1 (V3-D421, 2026-06-01): accept EITHER an explicit `slot_id` (legacy / dashboard path)
// OR `salon_id` + `starts_at` (the consumer pay-confirm flow, which never had a slot id to
// send). The route resolves (salon + service + staff + starts_at) -> an available slot
// server-side. `staff_member_id` is nullable because the picker sends `null` for "any stylist".
//
// SP-1 (guest booking, 2026-06-01): the guest fields below are ALWAYS optional in the schema
// because Zod has no session context — it cannot know whether the caller is logged in. The
// ROUTE is the auth boundary: when there is no session it requires guest_name + guest_phone
// (returns GUEST_INFO_REQUIRED otherwise). Keeping them optional here makes one schema serve
// both actors and never rejects the logged-in path. (Mirrors the G1 "route decides" note above.)
export const createBookingSchema = z
  .object({
    slot_id: uuid.optional(),
    salon_id: uuid.optional(),
    service_id: uuid,
    // Multi-service: additional services booked with the primary; stored on the booking as
    // extras_addons. The route resolves their REAL prices server-side (never trusts the client).
    extra_service_ids: z.array(uuid).max(10).optional(),
    // A5 B-4: optional bundle tag. When present the route loads the bundle server-side, REQUIRES
    // the selected services (primary + extras) to be EXACTLY the bundle's item set, recomputes the
    // price from pricing_mode (sum | custom | percent), and reserves the SUMMED bundle duration.
    // The server NEVER trusts a client total; this id only selects which bundle to price against.
    bundle_id: uuid.optional(),
    staff_member_id: uuid.nullable().optional(),
    starts_at: z.string().datetime().optional(),
    is_first_visit: z.boolean().optional(),
    referral_code: z.string().min(1).max(30).transform((v) => v.toUpperCase().trim()).optional(),
    // SP-G2 full prepay: "online" creates the booking in a payable "pending"
    // state (charged via /api/stripe/booking-pay-intent, confirmed by the
    // webhook). Absent / "in_person" keeps the legacy instant-confirm behavior.
    payment_method: z.enum(["online", "in_person"]).optional(),
    // SP-1 guest fields (optional; route enforces when there is no session). The phone
    // regex is the ONE Swiss contract shared with walkInSchema + GuestBookingForm.tsx.
    guest_name: z.string().min(2).max(100).optional(),
    guest_phone: z.string().regex(/^\+41[0-9]{9}$/).optional(),
    guest_email: z.string().email().optional(),
    // Hair step v3: one-line customer wish for THIS appointment (bookings.customer_note).
    customer_note: z.string().max(140).optional().nullable(),
    // Promo / gift-card fix (2026-06-30): the FE (PayConfirmStep) sends these; without them
    // Zod silently STRIPPED the promo, so the booking never persisted it and the discount the
    // UI promised was never applied to the charge. promo_code is persisted on the booking and
    // RE-VALIDATED server-side in /api/stripe/booking-pay-intent (the client value is never
    // trusted for the discount). gift_card_code is accepted so it is not a 400, but the
    // booking-charge gift-card redemption path is intentionally NOT wired (gift cards are
    // owner-HIDDEN, 2026-06-14): see booking-pay-intent for the explicit skip plus note.
    // total_price is the client's display total; accepted to avoid a strip-then-confuse, but
    // the server ALWAYS recomputes the real price from the services table (never trusts it).
    promo_code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    gift_card_code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    total_price: z.number().nonnegative().optional().nullable(),
  })
  .refine((d) => Boolean(d.slot_id) || Boolean(d.salon_id && d.starts_at), {
    message: "Either slot_id or (salon_id + starts_at) is required",
  });

// Owner decision 4, 2026-08-09 ("4B like google maps"): anyone signed in can rate any salon, so a
// booking is no longer required to post. booking_id stays OPTIONAL rather than being deleted,
// because a rating written off a real appointment still links to that booking (and inherits its
// stylist for the "How was {name}?" variant). salon_id is what a rating with no appointment
// targets. At least one of the two must arrive; the route derives salon_id from the booking when
// booking_id is the one sent.
export const createReviewSchema = z.object({
  booking_id: uuid.optional(),
  salon_id: uuid.optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  staff_member_id: uuid.optional(),
  score_ergebnis: z.number().int().min(1).max(5).optional(),
  score_atmosphaere: z.number().int().min(1).max(5).optional(),
  score_preis_leistung: z.number().int().min(1).max(5).optional(),
  // Salon-review amenity confirmations (Google-Maps style). Validated to the known set.
  attributes: z
    .array(
      z.enum([
        "lgbtq_friendly", "wheelchair_accessible", "woman_owned", "wifi_friendly",
        "kid_friendly", "pet_friendly", "family_owned", "near_public_transport", "student_discount",
      ]),
    )
    .max(12)
    .optional(),
}).refine((v) => Boolean(v.booking_id) || Boolean(v.salon_id), {
  message: "booking_id or salon_id is required",
  path: ["salon_id"],
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  message_type: z.enum(["text", "image", "system", "price_offer"]).default("text"),
  image_url: z.string().url().optional().nullable(),
});

// customer_preferences was z.any(), so a caller could store an unbounded / arbitrarily
// shaped JSON blob on their own profile. Known sub-keys (read by hair-dna derivation,
// ForYouSalonRows, useCustomerPrefs) get a real shape; anything else is still allowed
// through .catchall so we don't break an existing caller writing an unlisted key, but
// the whole payload is capped in size so it can't grow into a several-MB blob.
const customerPreferencesSchema = z.object({
  allergies: z.string().max(500).optional(),
  skinType: z.string().max(50).optional(),
  stylistGender: z.enum(["male", "female", "no-preference"]).optional(),
  accessibilityNeeds: z.string().max(500).optional(),
  language: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  interests: z.array(z.string().max(60)).max(50).optional(),
  categories: z.array(z.string().max(60)).max(50).optional(),
  beauty: z.record(z.string(), z.unknown()).optional(),
  persona: z.record(z.string(), z.unknown()).optional(),
}).catchall(z.unknown()).refine(
  (val) => JSON.stringify(val).length <= 20_000,
  { message: "customer_preferences payload is too large" },
);

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  hair_type: z.string().max(50).optional().nullable(),
  hair_length: z.string().max(30).optional().nullable(),
  hair_thickness: z.string().max(30).optional().nullable(),
  hair_beard: z.string().max(30).optional().nullable(),
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
  customer_preferences: customerPreferencesSchema.optional(),
}).strict();

export const createConversationSchema = z.object({
  salon_id: uuid,
});

export const createPaymentIntentSchema = z.object({
  salon_id: uuid,
  service_id: uuid,
  service_name: z.string().max(200).optional(),
  estimated_price: z.number().positive(),
  deposit_amount: z.number().positive(),
});

// Credits + voucher spend path (owner-approved 2026-07-11). booking_id was previously read
// with ad-hoc String()/regex parsing in the route; voucher_code is net new. No FE field
// reaches this route today (grepped PayConfirmStep + booking-context: only promoCode
// exists), so this is backend-only support ahead of the frontend wiring. The redeem_voucher
// RPC re-validates the code against the LIVE vouchers row (salon match, expiry, remaining
// balance) under a row lock, this schema only bounds the shape, never trusts the value.
export const bookingPayIntentSchema = z.object({
  booking_id: uuid,
  voucher_code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase().trim()).optional().nullable(),
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
  // Solen Plus members-only deal gate (LOYALTY_STRUCTURE.md §12.4): null = everyone.
  min_tier: z.enum(["gold", "platinum"]).optional().nullable(),
  // Per-customer cap: how many times ONE customer may redeem this code. 1 = one per customer
  // (default, closes the reuse gap); null = unlimited per customer. The global cap is still max_uses.
  per_user_limit: z.number().int().positive().nullable().optional().default(1),
})
  // A percent discount can never exceed 100 (you can't discount more than the price).
  .refine(
    (d) => d.discount_type !== "percent" || d.discount_value <= 100,
    { message: "discount_value must be <= 100 when discount_type is percent", path: ["discount_value"] },
  );

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
  // V3-D391: added lashes/brows (Wimpern/Augenbrauen) so those category tabs stop 400-ing; beard kept (makeup/waxing removed 2026-06-13)
  // for back-compat (no tab, harmless).
  category: z.enum(["all", "hair", "beard", "nails", "lashes", "brows"]).default("all"),
  gender: z.enum(["all", "female", "male", "unisex"]).default("all"),
  texture: z.string().optional(),
  style: z.string().optional(),
  // Progressive drill-down cut tags (comma-joined on the wire). Threaded into discovery_feed(p_tags_any) for a
  // di.tags && p_tags_any overlap filter. Capped + length-bounded to keep the array small + safe.
  tags: z.string().max(400).optional(),
  search: z.string().max(100).optional(),
  creator: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // ig3 (2026-07-16): opaque keyset cursor for the general browse branch (discovery_feed_v2).
  // Absent -> the branch behaves exactly like before (page/offset). See app/api/discovery/feed/route.ts.
  cursor: z.string().max(500).optional(),
});

export const discoveryPostSchema = z.object({
  category: z.enum(["hair", "beard", "nails"]),
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

// reinvent-ok: exporting the EXISTING canonical enum as the single source of truth for
// reuse (overlay + api). This REDUCES the V3_CATS / VALID_CATEGORIES duplication, not adds to it.
export const salonCategory = z.enum(["coiffeur", "barbershop", "nails", "spa"]);
/** Canonical salon category slugs, derived from the enum. */
export const SALON_CATEGORY_SLUGS: readonly string[] = salonCategory.options;

export const createSalonSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  categories: z.array(salonCategory).min(1),
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
    category: salonCategory.optional(),
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
  // Extra onboarding questions (owner 2026-08-23, "the extra sign up question"). All three are
  // optional so the wizard step stays skippable; the columns already exist on public.salons.
  acquisition_source: z.string().max(200).optional().or(z.literal("")),
  team_size: z.string().max(50).optional().or(z.literal("")),
  onboarding_goals: z.array(z.string()).optional(),
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
  category: z.enum(["hair", "beard", "nails", "lashes", "brows"]).optional(),
  source: z.enum(["unsplash", "pexels", "pixabay", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
});

export const discoveryStagingSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(["approve", "reject"]),
  category: z.enum(["hair", "beard", "nails"]).optional(),
  gender: z.enum(["female", "male", "unisex"]).optional(),
  style_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  reject_reason: z.string().max(500).optional(),
});

export const discoveryTikTokImportSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(20),
  category: z.enum(["hair", "beard", "nails", "lashes", "brows"]).optional(),
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

// Cash / in-person walk-in dropped straight into the live queue by staff: only the service is
// required. Name is optional (no name → the issued ticket_code becomes the display name); phone
// is optional but keeps the shared Swiss format when present.
export const walkInSchema = z.object({
  customer_name: z.string().min(2).max(100).optional(),
  customer_phone: z.string().regex(/^\+41[0-9]{9}$/).optional(),
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

// Walk-in tip: gated on the queue tracking token (the guest customer has no auth).
// amount is integer Rappen (CHF 1.00 – 100.00), same bounds as the booking tip.
export const walkinTipSchema = z.object({
  token: z.string().min(8).max(64),
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

export const treatmentOutcomeSchema = z.object({
  client_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  satisfaction_rating: z.number().int().min(1).max(5).optional(),
  skin_before: z.string().max(1000).optional(),
  skin_after: z.string().max(1000).optional(),
  products_used: z.array(z.string()).optional(),
  follow_up_notes: z.string().max(1000).optional(),
  next_visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  // A5 BUG-2: this enum was nail-only, so a generalized-salon save with a non-nail category
  // (hair_care/styling/etc.) failed Zod silently. Widened to the FULL DB CHECK union
  // (migration 20260703090000_retail_generalize_a5.sql): the 6 original nail values + the
  // general marketplace categories. Keep it in lockstep with the DB constraint.
  category: z.enum([
    'cuticle_oil','hand_cream','press_on','nail_kit','polish','other',
    'care','styling','tools','accessories',
    'hair_care','skin_care','nails',
  ]),
});

// A5 Phase B-2 (owner-authed bundle CRUD, 2026-07-03): mirrors the service_bundles /
// service_bundle_items shape (migration 20260703090001_service_bundles_a5.sql). The
// custom/percent value pairing is enforced here (client-side ergonomics); the DB CHECK
// constraints are the backstop. service_ids is validated for >=2 items at the route
// level (needs a clean BUNDLE_MIN_ITEMS code, not a raw Zod message).
export const serviceBundleSchema = z.object({
  name: z.string().min(2).max(200),
  service_ids: z.array(uuid).min(2, "at least 2 services required"),
  pricing_mode: z.enum(["sum", "custom", "percent"]),
  custom_price: z.number().min(0).max(50000).optional(),
  percent_off: z.number().int().min(1).max(99).optional(),
  is_active: z.boolean().optional().default(false),
});

export const nailPortfolioTagsSchema = z.object({
  nail_style: z.string().max(50).optional(),
  nail_shape: z.string().max(50).optional(),
  nail_material: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Salon gallery photo category (fixed taxonomy, see lib/portfolio-categories.ts). One value shared
// by the POST-upload category field and the PATCH category-reassignment body on
// app/api/salons/[slug]/gallery/route.ts. Null clears the category back to uncategorized; the
// route additionally checks the value is valid for the salon's OWN category via
// isValidPortfolioCategoryForSalon(), this schema only guards "is it a real taxonomy value at all".
export const portfolioCategoryValue = z.enum(PORTFOLIO_CATEGORY_KEYS).nullable();

export const salonPortfolioCategorySchema = z.object({
  id: z.string().uuid(),
  category: portfolioCategoryValue,
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

// Ring 7a: walk-in payment intent (money surface). Mirrors walkinJoinSchema's field shapes
// (customer_name/customer_phone/preferred_barber_id) for the same guest-or-logged-in walk-in
// flow; salon_id/service_id/booking_id are server-trusted UUIDs, price is NEVER read from the
// body (the route always recomputes it from the services row).
export const walkinPayIntentSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid(),
  customer_name: z.string().max(100).optional(),
  customer_phone: z.string().max(20).optional(),
  // Present when paying an existing walk-in booking (SMS payment-link flow).
  booking_id: z.string().uuid().optional(),
  // NOT .uuid(), NO .max(): the route's own preferred-barber block (pay-intent/route.ts:92-107)
  // already treats a malformed/spoofed/empty/oversized value as "no preference" (Egal) via a
  // UUID_RE test + staff-existence lookup, dropping it silently. .catch(undefined) means ANY
  // per-field failure (wrong type, too long, whatever) degrades to "no preference" instead of
  // 400ing the WHOLE payment for a bad optional preference, which is customer-hostile on a money
  // endpoint (ring 7a fix-round punch list).
  preferred_barber_id: z.string().optional().catch(undefined),
});

// Ring 7a: walk-in review, gated only by the queue tracking token (guest, no session).
export const walkinReviewSchema = z.object({
  token: z.string().min(8).max(64),
  rating: z.number().int().min(1).max(5),
  // No .max(): the route already truncates to 600 (review/route.ts:33, pre-existing behavior).
  // A hard .max(600) here would 400-reject an over-length review instead of truncating it, so
  // a long review silently vanished with no signal anywhere (ring 7a fix-round punch list).
  // Truncate here too so the field passed downstream is already bounded.
  comment: z.string().optional().transform((s) => s?.slice(0, 600)),
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
  // NIST SP 800-63-4 (July 2025): 12-char minimum, no composition rules.
  // Keep this in sync with the real signup gate: app/api/auth/signup/route.ts.
  password: z.string().min(12).max(200),
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

// What an admin may send when overriding a salon's payment mode. `payment_mode_admin` is nullable
// so an admin can clear their own override, and `payment_mode_enforced` is required so the request
// always says outright whether the override is meant to win. Landed 2026-08-14 with the rest of
// that feature, whose columns had been live and unread since July.
export const adminPaymentModeOverrideSchema = z.object({
  payment_mode_admin: z.enum(["at_salon", "deposit", "prepay"]).nullable(),
  payment_mode_enforced: z.boolean(),
});

export const adminAiLimitSchema = z.object({
  cap: z.number().int().min(1).max(100000),
  // Optional: the GLOBAL (house-wide) daily AI budget, see lib/ratelimit.ts
  // getAiGlobalDailyLimiter(). Optional so existing callers that only send `cap` (the per-user
  // limit) keep working unchanged.
  globalCap: z.number().int().min(1).max(1000000).optional(),
  // Optional: whether the exhausted CHF/month nail AI budget also blocks an admin, see
  // lib/nail/ai-budget.ts NAIL_AI_BUDGET_BLOCKS_ADMIN_KEY. Optional so existing callers that
  // only send `cap`/`globalCap` keep working unchanged.
  blocksAdmin: z.boolean().optional(),
});

export const adminFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
});

export const adminCityToggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
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
  // SP-3 adds admin_approve / admin_reject (the review-first escalation decision).
  // 'refund' / 'resolve_with_note' kept for the legacy generic-complaint path.
  action: z.enum([
    'dismiss', 'warn_customer', 'warn_salon', 'escalate', 'resolve_with_note', 'refund',
    'admin_approve', 'admin_reject',
  ]),
  resolution_note: z.string().max(500).optional(),
  refund_amount: z.number().int().positive().optional(), // integer Rappen (Stripe smallest unit for CHF)
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

// Ring 7a: same { reason } shape as adminSalonRejectSchema, shared by the two other
// admin salon-moderation actions (freeze cascades to cancelling active bookings + Stripe
// refunds; warn auto-escalates to a freeze at 3 warnings). Kept as its own export (not a
// rename of adminSalonRejectSchema) so each route's import names the action it validates.
export const adminSalonActionReasonSchema = z.object({
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

// POST /api/reports: the generic Trust & Safety report a customer files against a salon,
// review, or user. Enum values mirror the live content_reports CHECK constraints
// (supabase/migrations/078_content_reports.sql) via lib/content-reports.ts, the single
// source of truth for the report taxonomy.
// POST /api/reviews/translate: on-read translation of review text into one of the four app
// locales. `ids` is bounded here as well as in the route , an unbounded list would fan out
// into an unbounded number of model calls, which is the abuse case for this endpoint.
export const reviewTranslateSchema = z.object({
  ids: z.array(uuid).min(1).max(20),
  locale: z.enum(["de", "en", "fr", "it"]),
});

export const reportSubmitSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: uuid,
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).optional(),
});

// PATCH /api/admin/reports/[id]: admin triage of a content_reports row. `hide_content`
// only applies when the report's target_type is "review" (checked server-side, not
// here); it drives the real reviews.is_hidden/moderation_status write, not a cosmetic flag.
export const adminReportActionSchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  admin_notes: z.string().max(1000).optional(),
  hide_content: z.boolean().optional(),
});

export const adminDiscoveryItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(["hair", "beard", "nails"]),
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
  category: z.enum(["hair", "beard", "nails", "lashes", "brows"]),
  // Free-text term (e.g. "coffin nails"): when present, the route searches stock for THIS and imports the whole
  // batch into `category`, instead of the fixed QUERIES_BY_CATEGORY. `pages` controls how many result pages to pull.
  query: z.string().trim().min(2).max(80).optional(),
  pages: z.coerce.number().int().min(1).max(5).optional(),
});

export const adminDiscoverySmartImportSchema = z.object({
  description: z.string().min(1).max(500),
  source: z.enum(["unsplash", "pexels", "pixabay", "all"]).default("all"),
  count: z.number().int().min(1).max(50).default(10),
  category: z.enum(["hair", "beard", "nails"]).optional(),
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
  // Added 2026-07-27 (A9-email-locale): a guest canceller has no profiles row to resolve a
  // locale from, so the locale-prefixed page they are on threads its own locale through here
  // for the guest-branch cancellation email (falls back to "de" server-side if omitted).
  locale: z.enum(["de", "en", "fr", "it"]).optional(),
});

// "cancelled" retired (audit finding #15, 2026-07-09): PATCH /api/bookings/[id] used to also
// handle a cancel with its own divergent ToS-fallback refund math. No live caller sent it (the
// dashboard's cancel button posts to the canonical /api/bookings/[id]/cancel route); retired so
// there is exactly one customer/salon-cancel path.
export const bookingPatchSchema = z.object({
  status: z.enum(["completed", "no_show"]),
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

// Package / retail purchase refund (Connect-aware, lib/purchases/issue-purchase-refund.ts).
// `amount` is integer Rappen (capped server-side at paid − already-refunded).
// `mode: "prorata"` (packages only) ignores `amount` and refunds only UNUSED
// sessions (paid_amount * sessions_remaining / sessions_total); the route validates
// the source supports it. reason is required for the audit trail.
export const purchaseRefundSchema = z.object({
  amount: z.number().int().min(1).max(1000000).optional(),
  mode: z.enum(["amount", "prorata"]).default("amount"),
  reason: z.string().min(3).max(500),
});

// Admin variant of purchaseRefundSchema: the admin route is source-agnostic, so the
// body carries which purchase table + id to act on (the salon routes encode source
// in the path instead).
export const adminPurchaseRefundSchema = purchaseRefundSchema.extend({
  source: z.enum(["package", "retail"]),
  id: z.string().uuid(),
});

// SP-AC (REFUND_APPEAL_PLAN tasks #16/#17): salon cancellation + no-show policy update.
// Validates the canonical policy columns the auto-charge executor trusts. fee VALUES are
// CHF at the settings boundary (the executor converts to Rappen). percentage fees are
// capped at 100 (you can never charge more than the customer paid). All fields optional
// so the PATCH can update a single control; the allowlist in the route filters keys.
//
// trust-02 (2026-07-27): ToS §4.2 fixes the LATE-cancellation fee platform-wide at 50%
// of booking value, and §4.3 lets a salon be MORE LENIENT than §4.1/§4.2 but "not
// stricter". §4.1's free-cancellation window is 24h; §4.3's own worked example of
// leniency is "free cancellation up to 2 hours before" i.e. a SMALLER free_cancel_hours
// is more lenient (less notice required), a LARGER one is stricter (more notice
// required than the platform promises). So the ceiling is cancellation_fee_value<=50
// and free_cancel_hours<=24; there is no floor on either (a salon can always be more
// generous). no_show_fee stays capped at 100 per §4.4, which explicitly charges the
// full booking value on no-show, a different (and correctly higher) ceiling.
export const salonPolicyUpdateSchema = z
  .object({
    cancellation_fee_type: z.enum(["free", "flat", "percentage"]).optional(),
    cancellation_fee_value: z.number().min(0).optional(),
    no_show_fee_type: z.enum(["free", "flat", "percentage"]).optional(),
    no_show_fee_value: z.number().min(0).optional(),
    free_cancel_hours: z.number().int().min(1).max(24).optional(),
  })
  .refine(
    (d) => d.cancellation_fee_type !== "percentage" || (d.cancellation_fee_value ?? 0) <= 50,
    { message: "cancellation_fee_value must be <= 50 when type is percentage (ToS §4.2 platform ceiling)", path: ["cancellation_fee_value"] },
  )
  .refine(
    (d) => d.no_show_fee_type !== "percentage" || (d.no_show_fee_value ?? 0) <= 100,
    { message: "no_show_fee_value must be <= 100 when type is percentage", path: ["no_show_fee_value"] },
  );

// ---------------------------------------------------------------------------
// SP-3: two-direction money-adjustment engine (booking_disputes).
// All *_amount fields are INTEGER Rappen (CHF * 100); the FE converts at the
// boundary. Review-first: nothing here auto-approves.
// ---------------------------------------------------------------------------

// Endpoint 1 — unified customer/guest "report a problem / request a refund".
// One record; `wants_refund` + optional `requested_amount` distinguish a pure
// complaint (no money ask) from a refund ask.
export const createCaseSchema = z.object({
  reason_code: z.enum([
    'salon_cancelled', 'no_show_salon', 'not_delivered',
    'wrong_amount', 'double_charge', 'quality', 'harassment', 'other',
  ]),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  // Rappen; omitted/null with wants_refund=true => full refund of remaining.
  requested_amount: z.number().int().min(0).max(10000000).optional(),
  wants_refund: z.boolean(),
});

// Endpoint 3 — salon reviews a refund case (the FIRST reviewer).
export const salonReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  // Rappen; required-ish on approve (omitted => full remaining), validated <= remaining in the route.
  approved_amount: z.number().int().min(0).max(10000000).optional(),
  salon_response: z.string().min(10, 'Response must be at least 10 characters').max(1000),
});

// Endpoint 4 — customer/guest escalates a salon-rejected refund.
export const customerEscalateSchema = z.object({
  note: z.string().max(1000).optional(),
});

// Endpoint 6 — salon upcharge request (re-points the old priceAdjustmentSchema usage).
export const upchargeRequestSchema = z.object({
  requested_amount: z.number().int().positive().max(10000000), // Rappen, > 0
  salon_reason: z.string().min(3).max(500),
});

// Endpoint 7 — customer/guest responds to an upcharge (EXPLICIT approve/decline; no silent auto-approve).
export const upchargeRespondSchema = z.object({
  action: z.enum(['approve', 'decline']),
  customer_response: z.string().max(500).optional(),
});

// Ring 7a fix: this schema previously described a `new_slot_id`-based contract that no live
// route ever imported (dead export). The actual handler (app/api/bookings/[id]/reschedule/
// route.ts) reads new_starts_at + new_ends_at (a time RANGE, resolved to a slot server-side),
// so the schema is corrected to match the real request shape instead of an imaginary one.
export const bookingRescheduleSchema = z.object({
  new_starts_at: z.string().datetime(),
  new_ends_at: z.string().datetime(),
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
  // Matches the DB CHECK (preferred_day text CHECK IN ('mon'..'sun'), supabase/migrations/014_new_schema.sql)
  // and lib/types.ts PreferredDay. Was previously a 0-6 integer, which failed the CHECK on
  // every insert (500) since there's no caller today to have masked the mismatch.
  preferred_day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]).optional(),
  preferred_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// ---------------------------------------------------------------------------
// Availability-slot creation (dashboard calendar: SlotCreateModal + BulkCreateModal
// + the week-view blockDay() Lock button). The POST /api/slots single-slot path takes
// `date` + `start_time` + `service_id` and derives ends_at from the service duration; it
// does NOT carry salon_id (the route resolves it from the service and verifies ownership).
// ---------------------------------------------------------------------------

// SlotCreateModal -> POST /api/slots. `staff_member_id` is nullable ("Egal / wer
// verfügbar ist" sends null). No salon_id by design — derived from the service.
export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().nullable().optional(),
});

// One weekday lane in the BulkCreateModal template: an open window, or null (closed).
const bulkDayWindow = z
  .object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((w) => w.start < w.end, { message: "start must be before end" });

// BulkCreateModal -> POST /api/slots/bulk. `template` keys are mon..sun; each value is a
// window or null. `weeks` ∈ {1,2,4}. The route walks the current week + (weeks-1) forward,
// emitting one slot per service-duration step inside each enabled window.
export const bulkCreateSlotsSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().nullable().optional(),
  weeks: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  template: z.record(
    z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    bulkDayWindow.nullable(),
  ),
});

// blockDay() -> POST /api/slots/bulk (same endpoint, different shape). Marks that salon's
// `available` slots on `block_date` as `blocked`. service_id is NOT NULL on the table, so
// blocking flips existing rows rather than inserting placeholder rows.
export const blockDaySchema = z.object({
  salon_id: z.string().uuid(),
  block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  // fr/it added 2026-07-27 alongside the DB columns. name_fr/name_it were already here; their
  // description siblings were not, so a salon could correct a machine-translated NAME but not a
  // machine-translated DESCRIPTION. A human must always be able to overwrite the machine.
  description_fr: z.string().max(1000).optional(),
  description_it: z.string().max(1000).optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  processing_minutes: z.number().int().min(0).max(120).optional(),
  finishing_minutes: z.number().int().min(0).max(120).optional(),
  suitable_for: z.array(z.string().max(50)).optional(),
  // form sends male/female/non_binary; unisex kept for legacy rows. (Was missing non_binary -> 400.)
  suitable_gender: z.array(z.enum(["male", "female", "unisex", "non_binary"])).optional(),
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
  // These were absent, so editing a service silently dropped description / time-breakdown /
  // age + gender targeting (PATCH strips anything not in this schema). Mirror the create schema.
  description_de: z.string().max(1000).optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  processing_minutes: z.number().int().min(0).max(120).optional(),
  finishing_minutes: z.number().int().min(0).max(120).optional(),
  suitable_for: z.array(z.string().max(50)).optional(),
  suitable_gender: z.array(z.enum(["male", "female", "unisex", "non_binary"])).optional(),
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
  salon_id: z.string().uuid().optional(),
});

export const priceOfferSchema = z.object({
  amount_chf: z.number().int().min(100).max(100000),
  description: z.string().max(500).optional(),
  expires_hours: z.number().int().min(1).max(168).default(24),
  photo_url: z.string().url().max(2048).optional(),
});

// Round 10 Y3: reviewReplySchema (the POST /api/reviews/reply duplicate write path)
// retired , see _design-system/REMOVED.md. review_replies is the single winning
// table; PATCH/DELETE /api/reviews/[id]/respond is the single write path into it.
// Simplified from the old shape (which required `reply_text` but the ONLY real
// caller, the dashboard, sent `salon_response`, so every dashboard reply attempt
// 400'd silently, the actual root cause of "a reply is written and never shown").
export const reviewRespondSchema = z.object({
  reply_text: z.string().min(1).max(1000),
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
  product_ids: z.array(z.string().uuid()).min(1)
    .refine((arr) => new Set(arr).size === arr.length, { message: "duplicate product_ids" }),
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
  // Optional: the waitlist API keys off the authenticated session user_id, not this email.
  // The logged-in join modal (booking flow) sends no email; the legacy "notify me" call still may.
  email: z.string().email().optional(),
  salon_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  preferred_date: z.string().max(20).optional(),
  preferred_time_range: z.string().max(50).optional(),
  staff_member_id: z.string().uuid().nullable().optional(),
});

export const quartierSubscribeSchema = z.object({
  email: z.string().email(),
  quartier: z.string().min(1).max(100),
});

// POST /api/directory/[id]/claim is a 2-step flow on the same endpoint: step 1 sends no
// `code` (mints + emails one), step 2 sends `code` to verify it. Both fields are optional
// here for that reason; the route itself decides which step ran based on `code`'s presence.
// input-abuse-07 (2026-07-27): this schema previously used a `claim_code` field name that
// matched no actual route (dead code), while the real route took `code` unvalidated.
export const directoryClaimSchema = z.object({
  code: z.string().min(4).max(20).optional(),
  locale: z.enum(["de", "en", "fr", "it"]).optional(),
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

// ─── Guest Access (SP-2) ──────────────────────────────────────────────────────
// "Resend my access link": a guest supplies their order number + exactly one contact
// (email OR phone). The route is anti-enumeration — it ALWAYS returns an opaque 200 —
// so this schema only guards malformed bodies (a pre-lookup 400 leaks nothing about a
// code). `code` is normalized in the route; here we just require a non-empty string.
export const resendAccessSchema = z
  .object({
    code: z.string().min(1).max(64),
    email: z.string().email().optional(),
    phone: z.string().min(3).max(32).optional(),
  })
  .refine((d) => (d.email ? 1 : 0) + (d.phone ? 1 : 0) === 1, {
    message: "Provide exactly one of email or phone",
  });

// ─── input-abuse-07 batch (2026-07-27) ────────────────────────────────────────
// Body schemas for routes that previously hand-rolled an inline check instead of
// going through validateBody, per _rules/SECURITY_RULES.md Rule S4/S5.

export const voucherValidateSchema = z.object({
  code: z.string().min(4).max(40),
  salon_id: uuid,
});

export const voucherConfirmSchema = z.object({
  payment_intent_id: z.string().min(1).max(200),
  voucher_id: uuid,
});

export const walkinConfirmSchema = z.object({
  payment_intent_id: z.string().min(1).max(200),
  token: z.string().min(1).max(500).optional(),
});

export const servicesReorderSchema = z.object({
  salon_id: uuid,
  order: z
    .array(z.object({ id: uuid, sort_order: z.number().int().min(0) }))
    .min(1)
    .max(200),
});

export const staffUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  avatar_url: z.string().url().max(2000).nullable().optional(),
  specialties: z.array(z.string().max(100)).max(50).optional(),
  is_active: z.boolean().optional(),
  commission_rate: z.number().min(0).max(100).nullable().optional(),
  languages: z.array(z.string().max(50)).max(20).optional(),
  instagram_url: z.string().url().max(500).nullable().optional(),
  years_experience: z.number().int().min(0).max(80).nullable().optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

export const reviewFlagSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const comingSoonNotifySchema = z.object({
  email: z.string().email().max(320),
  feature: z.string().max(64).optional(),
});

export const profileNotificationsMarkReadSchema = z.object({
  all: z.boolean().optional(),
  ids: z.array(uuid).min(1).max(100).optional(),
});

export const profileFavoritesSchema = z.object({
  salon_id: uuid,
});

// PATCH /api/slots/[id]: two accepted body shapes (new drag-and-drop starts_at/ends_at,
// or legacy date/start_time), plus an optional staff_member_id reassignment.
export const salonsActiveSchema = z.object({
  salon_id: uuid,
});

export const staffScheduleAutoApplySchema = z.object({
  salon_id: uuid,
});

// api-contracts-08: BATCH_KEYS bounds the array length AND the enum, so an unbounded
// request array (resource-exhaustion vector) is rejected here rather than in the route.
const DASHBOARD_BATCH_KEYS = ["bookings_today", "revenue_month", "reviews_pending", "walkin_queue", "activity_feed"] as const;
// Matches DEFAULT_SECTIONS keys in app/api/admin/homepage-sections/route.ts. A partial
// object is fine (only changed keys need to be sent); an unknown key is rejected rather
// than silently persisted into platform_settings.value.
export const adminTestSalonSeedSchema = z.object({
  salon_id: uuid,
  feature: z.enum(["walkin_queue", "bookings", "reviews", "reset"]),
});

export const adminTestSalonCreateSchema = z.object({
  categories: z.array(z.string().max(30)).max(10).optional(),
  name: z.string().min(1).max(100).optional(),
});

export const adminSeedTestSalonsSchema = z.object({
  cities: z.array(z.string().max(50)).max(20).optional(),
});

export const adminPreviewSalonSchema = z.object({
  salon_id: uuid,
});

export const adminHomepageSectionsSchema = z.object({
  sections: z
    .object({
      quartier: z.boolean().optional(),
      trending: z.boolean().optional(),
      nearby: z.boolean().optional(),
      new_salons: z.boolean().optional(),
      rebook: z.boolean().optional(),
      reviews: z.boolean().optional(),
      last_minute: z.boolean().optional(),
      featured: z.boolean().optional(),
      social_proof: z.boolean().optional(),
      partner_cta: z.boolean().optional(),
    })
    .strict(),
});

export const adminContentPutSchema = z.object({
  value_de: z.string().max(20000).optional(),
  value_en: z.string().max(20000).optional(),
  value_fr: z.string().max(20000).optional(),
  // auto_override is a string override VALUE (see app/api/content/route.ts), not a flag.
  auto_override: z.string().max(20000).nullable().optional(),
});

export const adminBadgePatchSchema = z.object({
  name_de: z.string().min(1).max(60).optional(),
  name_en: z.string().min(1).max(60).optional(),
  icon: z.string().min(1).max(60).optional(),
  color: z.string().min(1).max(60).optional(),
  bg_color: z.string().min(1).max(60).optional(),
});

export const salonsAiInfoSchema = z.object({
  field: z.enum(["description", "atmosphere", "expertise"]).optional(),
});

export const verifyPhoneSendSchema = z.object({
  phone: z.string().min(6).max(20),
});

export const verifyPhoneCheckSchema = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().min(4).max(10),
});

export const nailHandChartSchema = z.object({
  clientId: z.string().min(1).max(200),
  notes: z.record(z.string(), z.unknown()).optional(),
});

export const nailAiHistoryPatchSchema = z.object({
  id: uuid,
  salon_id: uuid,
  is_saved: z.boolean().optional(),
});

export const dashboardBatchSchema = z.object({
  salonId: uuid,
  requests: z.array(z.enum(DASHBOARD_BATCH_KEYS)).min(1).max(DASHBOARD_BATCH_KEYS.length),
});

// Swiss UID / MWST number, loose shape check (structure only, not Mod11 checksum).
// null or "" clears the field; a non-empty string must match the shape.
const SWISS_UID_RE = /^CHE-?\d{3}\.?\d{3}\.?\d{3}(\s*(MWST|TVA|IVA|VAT))?$/i;
export const salonsMinePatchSchema = z.object({
  about_text_de: z.string().max(5000).optional(),
  about_text_en: z.string().max(5000).optional(),
  about_text_fr: z.string().max(5000).optional(),
  about_text_it: z.string().max(5000).optional(),
  vat_registered: z.boolean().optional(),
  vat_number: z
    .string()
    .nullable()
    .refine((v) => v == null || v.trim() === "" || SWISS_UID_RE.test(v.trim()), {
      message: "Invalid VAT number: expected a Swiss UID like CHE-123.456.789 MWST.",
    })
    .optional(),
});

export const notifyReviewPostedSchema = z.object({
  review_id: uuid,
});

export const notifyReviewRepliedSchema = z.object({
  review_id: uuid,
  reply_text: z.string().max(2000).optional(),
});

export const discoveryCollectionCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  is_public: z.boolean().optional(),
});

export const discoveryCollectionPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    is_public: z.boolean().optional(),
  })
  .refine((d) => d.name !== undefined || d.is_public !== undefined, {
    message: "Provide name and/or is_public",
  });

export const discoveryCollectionItemSchema = z.object({
  item_id: uuid,
});

export const slotPatchSchema = z.object({
  starts_at: z.string().datetime({ offset: true }).optional(),
  ends_at: z.string().datetime({ offset: true }).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  staff_member_id: uuid.nullable().optional(),
});

export const lastMinuteSettingsSchema = z.object({
  salon_id: uuid,
  enabled: z.boolean().optional(),
  global_discount_percent: z.number().min(0).max(90).optional(),
  service_overrides: z.record(z.string(), z.unknown()).optional(),
});

