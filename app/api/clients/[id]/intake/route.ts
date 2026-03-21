export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/clients/[id]/intake — Get intake form responses (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("intake_form_responses")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("filled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/clients/[id]/intake — Submit intake form response
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { template_key, responses } = body;

  if (!template_key || !responses || typeof responses !== "object") {
    return NextResponse.json({ error: "template_key and responses object required" }, { status: 400 });
  }

  // Determine salon_id: salon owner submitting for client, or client self-submitting
  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).single();
  const salonId = salon?.id;

  // If not salon owner, check if customer submitting for themselves via a booking
  if (!salonId && customerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: intake, error } = await supabase
    .from("intake_form_responses")
    .insert({
      salon_id: salonId ?? body.salon_id,
      customer_id: customerId,
      template_key,
      responses,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: intake }, { status: 201 });
}
