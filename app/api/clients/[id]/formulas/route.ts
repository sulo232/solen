export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, formulaSchema } from "@/lib/validations";

// GET /api/clients/[id]/formulas — Get client formulas (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("client_formulas")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/clients/[id]/formulas — Add a formula
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(formulaSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: formula, error } = await supabase
    .from("client_formulas")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      booking_id: validated.booking_id ?? null,
      brand: validated.brand ?? null,
      product_line: validated.product_line ?? null,
      mix_formula: validated.mix_formula,
      developer_volume: validated.developer_volume ?? null,
      processing_minutes: validated.processing_minutes ?? null,
      notes: validated.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: formula }, { status: 201 });
}
