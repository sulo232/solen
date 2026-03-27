export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { autoTranslateDescription } from "@/lib/ai/translate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let query = supabase
    .from("salons")
    .select("*")
    .eq("slug", slug);

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
    supabase.from("staff_members").select("*").eq("salon_id", salon.id).eq("is_active", true),
    supabase
      .from("reviews")
      .select("*, profiles(display_name, avatar_url), review_replies(id, reply_text, is_public), review_photos(id, photo_url, sort_order)")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    ...salon,
    services: servicesRes.data ?? [],
    staff: staffRes.data ?? [],
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

  // Find salon by slug or id
  let salonQuery = admin.from("salons").select("id, owner_id").eq("slug", slug).maybeSingle();
  let { data: salon } = await salonQuery;
  if (!salon) {
    // Try matching by UUID (settings page passes salon.id)
    const res = await admin.from("salons").select("id, owner_id").eq("id", slug).maybeSingle();
    salon = res.data;
  }
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  // Verify ownership or admin
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowed = [
    "name", "address", "phone", "description_de", "description_en",
    "opening_hours", "categories", "cover_photo_url",
    "last_minute_discount_percent", "last_minute_window_hours",
    "accepts_online_payment", "no_show_deposit_amount",
    "cancellation_fee_type", "cancellation_fee_value", "free_cancel_hours",
    "payment_mode", "deposit_percent", "cancellation_hours", "late_cancel_fee_percent",
    "sms_reminder_24h", "sms_reminder_1h",
    "vacation_start", "vacation_end",
    "instagram_url", "facebook_url", "tiktok_url", "website_url",
    "is_top_pick",
  ];

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
