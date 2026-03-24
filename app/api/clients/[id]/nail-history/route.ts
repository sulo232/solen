export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailDesignHistorySchema } from "@/lib/validations";

// GET /api/clients/[id]/nail-history — Paginated design history (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: salon } = await supabase
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: customerId } = await params;
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const from = (page - 1) * limit;

  const admin = createAdminSupabaseClient();
  const { data, error, count } = await admin
    .from("nail_design_history")
    .select("*", { count: "exact" })
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    hasMore: (from + limit) < (count ?? 0),
  });
}

// POST /api/clients/[id]/nail-history — Create design record
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailDesignHistorySchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const { data: salon } = await supabase
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  // Resolve staff_member_id from booking if linked
  let staffMemberId: string | null = null;
  if (validated.booking_id) {
    const { data: booking } = await admin
      .from("bookings").select("staff_member_id").eq("id", validated.booking_id).single();
    staffMemberId = booking?.staff_member_id ?? null;
  }

  const { data: record, error } = await admin
    .from("nail_design_history")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      booking_id: validated.booking_id ?? null,
      staff_member_id: staffMemberId,
      shape: validated.shape ?? null,
      length: validated.length ?? null,
      material: validated.material ?? null,
      style_category: validated.style_category ?? null,
      color_primary: validated.color_primary ?? null,
      color_secondary: validated.color_secondary ?? null,
      color_brand: validated.color_brand ?? null,
      notes: validated.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: record }, { status: 201 });
}
