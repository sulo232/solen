export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailAiHistoryPatchSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/dashboard/nail/ai-history?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "catalog");
  if (accessResult instanceof NextResponse) return accessResult;

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

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await request.json();
  const { data: validated, error: validationError } = validateBody(nailAiHistoryPatchSchema, rawBody);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { id, salon_id: salonId } = validated;

  // Ownership guard (defense-in-depth, BACKEND_HEALTH_AUDIT_2026-07-14 #7): the
  // caller-supplied `id` alone never proved the row belongs to them. This check is
  // added even though the lookup below is currently dead (see NOTE), so that if a
  // real table is ever wired up here, ownership is already enforced and this can't
  // regress into an IDOR the moment the phantom table becomes real. Same check as
  // GET above.
  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "catalog");
  if (accessResult instanceof NextResponse) return accessResult;

  // NOTE (blocker, same finding as GET above): `nail_ai_staging` is not a real table,
  // so the row lookup this handler depends on has always failed (42P01 undefined table)
  // on every call, always falling into the "Not found" branch below. Returning that same
  // response directly, byte identical to the previous behavior.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
