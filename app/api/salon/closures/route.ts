export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, closureSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/salon/closures — Get closures for the salon owner's salon
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // P9-2 RLS fix: closures_owner_manage is owner-only, so a granted staff
  // caller past the "settings" gate got a silent-empty read on the session
  // client. getActiveSalon and the resource query both run on the admin
  // client from here on (same pattern as app/api/salon/chairs/route.ts).
  const admin = createAdminSupabaseClient();
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "settings");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data, error } = await admin
    .from("salon_closures")
    .select("*")
    .eq("salon_id", salon.id)
    .order("start_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/salon/closures — Create a closure
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(closureSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // P9-2 RLS fix: same admin-client pattern as GET above.
  const admin = createAdminSupabaseClient();
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "settings");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data: closure, error } = await admin
    .from("salon_closures")
    .insert({
      salon_id: salon.id,
      start_date: validated.start_date,
      end_date: validated.end_date,
      reason: validated.reason ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: closure }, { status: 201 });
}

// DELETE /api/salon/closures — Delete a closure by id (query param)
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const closureId = new URL(req.url).searchParams.get("id");
  if (!closureId) return NextResponse.json({ error: "id required" }, { status: 400 });

  // P9-2 RLS fix: same admin-client pattern as GET above.
  const admin = createAdminSupabaseClient();
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "settings");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data: deleted, error } = await admin
    .from("salon_closures")
    .delete()
    .eq("id", closureId)
    .eq("salon_id", salon.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // A wrong id, or one that belongs to a different salon, matches zero rows;
  // .delete() reports success either way, so a real row count is the only
  // way to tell "removed" from "nothing matched".
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" });
}
