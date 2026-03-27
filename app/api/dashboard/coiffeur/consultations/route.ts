export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { consultationNoteSchema } from "@/lib/validations";

// GET /api/dashboard/coiffeur/consultations?client_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = consultationNoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const validated = parsed.data;
  const { data, error } = await supabase
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
