export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, closureSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/salon/closures — Get closures for the salon owner's salon
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data, error } = await supabase
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

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data: closure, error } = await supabase
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

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { error } = await supabase
    .from("salon_closures")
    .delete()
    .eq("id", closureId)
    .eq("salon_id", salon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
