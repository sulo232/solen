export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
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

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: customerId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  // Verify salon ownership
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error, count } = await admin
    .from("nail_design_history")
    .select("*", { count: "exact" })
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data ?? [], total: count ?? 0, page, limit });
}

// POST /api/clients/[id]/nail-history — Create design history record
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: customerId } = await params;
  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailDesignHistorySchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: record, error } = await admin
    .from("nail_design_history")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      ...validated,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record }, { status: 201 });
}
