export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { getActiveSalon } from "@/lib/active-salon";
import { validateBody, treatmentOutcomeSchema } from "@/lib/validations";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { requireSalonAccess } from "@/lib/auth/require";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const clientId = searchParams.get("client_id");
  if (!salonId || !clientId) return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (clients) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "clients");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  const { data: outcomes } = await admin
    .from("spa_treatment_outcomes")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ outcomes: outcomes ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  // P9-2: area composes the staff fallback (clients) onto the owner
  // resolution. Owner path is unchanged.
  const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "clients");
  if (!salon) return NextResponse.json({ error: "No salon" }, { status: 404 });

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(treatmentOutcomeSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const belongs = await clientBelongsToSalon(admin, salon.id, validated.client_id);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  const { data: outcome, error } = await admin
    .from("spa_treatment_outcomes")
    .insert({
      salon_id: salon.id,
      client_id: validated.client_id,
      booking_id: validated.booking_id ?? null,
      satisfaction_rating: validated.satisfaction_rating,
      skin_before: validated.skin_before || null,
      skin_after: validated.skin_after || null,
      products_used: validated.products_used ?? [],
      follow_up_notes: validated.follow_up_notes || null,
      next_visit_date: validated.next_visit_date || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ outcome });
}
