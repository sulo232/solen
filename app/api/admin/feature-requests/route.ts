export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, createFeatureRequestSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  // 1. Feature flag check
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Query with cursor-based pagination
  const admin = createAdminSupabaseClient();
  const status = req.nextUrl.searchParams.get("status");
  const cursor = req.nextUrl.searchParams.get("cursor"); // ISO timestamp
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

  let query = admin.from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;
  return NextResponse.json({ requests: data, nextCursor });
}

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Parse JSON body (with try-catch for malformed requests)
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 7. Zod validation
  const { data: validated, error: valError } = validateBody(createFeatureRequestSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 8. Insert
  const admin = createAdminSupabaseClient();
  const { data: inserted, error } = await admin
    .from("feature_requests")
    .insert({ ...validated, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: inserted }, { status: 201 });
}
