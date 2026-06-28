export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { autoTranslateDescription } from "@/lib/ai/translate";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, salonPolicyUpdateSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // The [slug] param may be a UUID (owner settings page passes salon.id) or a slug.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let query = supabase
    .from("salons")
    .select("*")
    .eq(isUuid ? "id" : "slug", slug);

  const { data: salon, error } = await query.single();

  if (error || !salon) {
    return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Regular users can only see active salons. Owner/Admin can see pending ones.
  const isOwner = user?.id === salon.owner_id;
  if (!isOwner && !salon.is_active) {
    // If we want to allow admins, we'd check profile role, but owner check is enough for onboarding flow.
    return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Fetch related data in parallel
  const [servicesRes, staffRes, reviewsRes] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salon.id).eq("is_active", true),
    // V3-D233 (2026-05-27, staff-section-empty bug): JOIN to staff_portfolio_images
    // was poisoning the whole query — that table doesn't exist in the schema
    // (planned never migrated, or dropped). PostgREST silently returns [] on a
    // missing relation. Dropped the join so the 4 active staff rows actually
    // come back. Restore the join only when the staff_portfolio_images table
    // is added (migration 032 was referenced in old session notes but never landed).
    supabase.from("staff_members").select("*").eq("salon_id", salon.id).eq("is_active", true),
    // Reviews via the service-role client: profiles RLS (rightly) blocks anon reads,
    // which nulled every reviewer name for logged-out visitors. The server exposes
    // ONLY display_name + avatar_url through this select — no broader profile access.
    createAdminSupabaseClient()
      .from("reviews")
      .select("*, profiles(display_name, avatar_url), review_replies(id, reply_text, is_public), review_photos(id, photo_url, sort_order)")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Attach service_ids to each staff member (which services they perform) so the UI can
  // filter services by a chosen staff/barber — staff_services is the same link the booking
  // flow uses. Additive: consumers that don't need it (SalonTeam) ignore the field.
  const staff = staffRes.data ?? [];
  let staffWithServices = staff;
  if (staff.length > 0) {
    const { data: links } = await supabase
      .from("staff_services")
      .select("staff_member_id, service_id")
      .in("staff_member_id", staff.map((s) => s.id));
    const byStaff = new Map<string, string[]>();
    (links ?? []).forEach((l) => {
      const arr = byStaff.get(l.staff_member_id) ?? [];
      arr.push(l.service_id);
      byStaff.set(l.staff_member_id, arr);
    });
    staffWithServices = staff.map((s) => ({
      ...s,
      service_ids: byStaff.get(s.id) ?? [],
      // Aliases for SalonTeam.tsx which reads staff_average_rating / staff_review_count.
      staff_average_rating: s.average_rating,
      staff_review_count: s.review_count,
    }));
  }

  return NextResponse.json({
    ...salon,
    services: servicesRes.data ?? [],
    staff: staffWithServices,
    reviews: reviewsRes.data ?? [],
  });
}

// PATCH /api/salons/[slug] — salon owner updates their salon
// Accepts slug or UUID as the param
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Find salon by slug or id. The [slug] param may be a UUID (settings page passes
  // salon.id) or a slug — detect via UUID regex so a UUID resolves correctly.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id")
    .eq(isUuid ? "id" : "slug", slug)
    .maybeSingle();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  // Verify ownership or admin
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  // Added the canonical no-show fee (no_show_fee_type / no_show_fee_value) alongside the
  // existing cancellation policy keys. The payment-mode keys (payment_mode / deposit_percent /
  // cancellation_hours / late_cancel_fee_percent) are RE-ADDED: their columns are now applied
  // live (047_payment_modes drift migration) with DB CHECK constraints backstopping bad values,
  // so PaymentsTab's save persists instead of no-op'ing.
  const allowed = [
    "name", "address", "phone", "description_de", "description_en",
    "opening_hours", "categories", "cover_photo_url",
    "last_minute_discount_percent", "last_minute_window_hours",
    "accepts_online_payment", "no_show_deposit_amount",
    "cancellation_fee_type", "cancellation_fee_value", "free_cancel_hours",
    "no_show_fee_type", "no_show_fee_value",
    "payment_mode", "deposit_percent", "cancellation_hours", "late_cancel_fee_percent",
    // SchedulingTab — booking_confirmation_mode is read by the booking engine (manual_approval);
    // the other three persist the owner's choice (enforcement engines are a separate feature).
    "booking_confirmation_mode", "auto_assign_method", "daily_limit_enabled", "daily_limit",
    "sms_reminder_24h", "sms_reminder_1h",
    "vacation_start", "vacation_end",
    // is_top_pick + facebook_url re-added: their columns are now applied live (drift migrations).
    "is_top_pick", "facebook_url",
    "instagram_url", "tiktok_url", "website_url",
    // VAT/MWST registration (owner-settable). The rate itself is NOT here — 8.1% is fixed by
    // Swiss law; only whether the salon is registered + its UID. Mirrors /api/salons/mine.
    "vat_registered", "vat_number",
  ];

  // SP-AC §B5: validate the policy subset (money-adjacent) with Zod, and gate it behind
  // the dedicated payment limiter (3/hour) — policy changes drive auto-charges. Only the
  // policy keys are validated/throttled, so a salon editing its address/hours is unaffected.
  const POLICY_KEYS = [
    "cancellation_fee_type", "cancellation_fee_value", "free_cancel_hours",
    "no_show_fee_type", "no_show_fee_value",
  ] as const;
  const touchesPolicy = POLICY_KEYS.some((k) => body[k] !== undefined);
  if (touchesPolicy) {
    const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const policySubset: Record<string, unknown> = {};
    for (const k of POLICY_KEYS) if (body[k] !== undefined) policySubset[k] = body[k];
    const { error: policyErr } = validateBody(salonPolicyUpdateSchema, policySubset);
    if (policyErr) return NextResponse.json({ error: policyErr.message }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Auto-translate description if German was provided but English was not
  if (updates.description_de && !updates.description_en) {
    const translated = await autoTranslateDescription(updates.description_de as string);
    if (translated) updates.description_en = translated;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await admin.from("salons").update(updates).eq("id", salon.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
