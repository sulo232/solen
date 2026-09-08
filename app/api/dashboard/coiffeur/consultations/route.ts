export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { consultationNoteSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/dashboard/coiffeur/consultations?client_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  // P9-2: area composes the staff fallback (clients) onto the owner
  // resolution. Owner path is unchanged.
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "clients");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // salon_owner_consultation_notes (supabase/migrations/20260328_coiffeur_
  // dashboard.sql:29) is owner-only RLS, so a staff member granted "clients"
  // above would still read an empty list through the session client. Admin
  // client, scoped to the same gated salon.id, for the full history.
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("consultation_notes")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/dashboard/coiffeur/consultations
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const parsed = consultationNoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  // P9-2: area composes the staff fallback (clients) onto the owner
  // resolution. Owner path is unchanged.
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "clients");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const belongs = await clientBelongsToSalon(admin, salon.id, parsed.data.client_id);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  // Same owner-only RLS as GET above (salon_owner_consultation_notes covers
  // ALL commands, including INSERT), so a granted staff member's insert
  // would otherwise be rejected outright. Admin client, salon_id forced to
  // the gated salon.id below, never body-supplied.
  const validated = parsed.data;
  const { data, error } = await admin
    .from("consultation_notes")
    .insert({
      salon_id: salon.id,
      client_id: validated.client_id,
      booking_id: validated.booking_id ?? null,
      hair_condition: validated.hair_condition ?? null,
      scalp_condition: validated.scalp_condition ?? null,
      current_dislikes: validated.current_dislikes ?? null,
      desired_outcome: validated.desired_outcome ?? null,
      allergies: validated.allergies ?? null,
      notes: validated.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
