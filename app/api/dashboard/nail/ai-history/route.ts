export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/nail/ai-history?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // NOTE (blocker, not fixable as a rename): `nail_ai_staging` is not a real table
  // (checked lib/database.types.ts + `npm run exists nail_ai_staging`, 0 matches). No
  // existing table matches this shape either: nail_design_history needs a real
  // customer_id and has no prompt_summary/is_saved; nail_inspo_images is customer-owned
  // (user_id, no salon_id) with no prompt_summary/is_saved; discovery_staging (used by
  // /api/admin/nail/generate for AI-generated images) has no salon_id at all, so it can't
  // be scoped per salon here. This route has always errored on every call (42P01 undefined
  // table) and always returned an empty list, byte identical to the direct return below.
  // A real fix needs a schema decision (new salon-scoped table, or extend an existing one)
  // outside this typed-fix pass.
  return NextResponse.json({ history: [] });
}

// PATCH /api/dashboard/nail/ai-history — toggle is_saved
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, salon_id: salonId } = body as { id: string; salon_id: string; is_saved: boolean };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // Ownership guard (defense-in-depth, BACKEND_HEALTH_AUDIT_2026-07-14 #7): the
  // caller-supplied `id` alone never proved the row belongs to them. This check is
  // added even though the lookup below is currently dead (see NOTE), so that if a
  // real table is ever wired up here, ownership is already enforced and this can't
  // regress into an IDOR the moment the phantom table becomes real. Same check as
  // GET above.
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (salon?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // NOTE (blocker, same finding as GET above): `nail_ai_staging` is not a real table,
  // so the row lookup this handler depends on has always failed (42P01 undefined table)
  // on every call, always falling into the "Not found" branch below. Returning that same
  // response directly, byte identical to the previous behavior.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
