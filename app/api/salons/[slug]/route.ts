export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { autoTranslateDescription } from "@/lib/ai/translate";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, salonPolicyUpdateSchema } from "@/lib/validations";
import { loadSalonDetailWithAccess } from "@/lib/salon-detail";
import { salonDetailCacheHeaders } from "@/lib/salons/cache-headers";
import { createDbTimer } from "@/lib/db-timing";
import type { Database } from "@/lib/database.types";

// B4 load audit (2026-07-04): the fetch/visibility/join logic that used to live
// here was extracted to lib/salon-detail.ts so the salon PDP page.tsx (now a
// server component) can call the exact same query server-side. This route stays
// as the client-side refetch path (review flag reload, owner-preview refresh)
// and now calls the shared loader instead of duplicating the query.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // performance-09: one structured line splitting this route's total handler
  // time from its DB-call time, so "the PDP feels slow" is diagnosable from
  // the log alone (query vs render/cold-start) instead of a fresh investigation.
  const timer = createDbTimer("GET /api/salons/[slug]");
  const result = await timer.track(() => loadSalonDetailWithAccess(slug));
  timer.finish();

  if (!result) {
    return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(result.salon, { headers: salonDetailCacheHeaders(result.isOwnerView) });
}

// PATCH /api/salons/[slug] — salon owner updates their salon
// Accepts slug or UUID as the param
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Find salon by slug or id. The [slug] param may be a UUID (settings page passes
  // salon.id) or a slug — detect via UUID regex so a UUID resolves correctly.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id")
    .eq(isUuid ? "id" : "slug", slug)
    .maybeSingle();
  if (!salon) return NextResponse.json({ error: "Salon not found", code: "NOT_FOUND" }, { status: 404 });

  // Verify ownership or admin
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
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
  ] as const;

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
    if (policyErr) return NextResponse.json({ error: policyErr.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const updates: Database["public"]["Tables"]["salons"]["Update"] = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Auto-translate description if German was provided but English was not
  if (updates.description_de && !updates.description_en) {
    const translated = await autoTranslateDescription(updates.description_de as string);
    if (translated) updates.description_en = translated;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided", code: "NO_UPDATES" }, { status: 400 });
  }

  const { error } = await admin.from("salons").update(updates).eq("id", salon.id);
  if (error) return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
