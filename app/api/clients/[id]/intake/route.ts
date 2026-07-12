export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, intakeFormSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import type { Json } from "@/lib/database.types";

// GET /api/clients/[id]/intake — Get intake form responses (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(intakeFormSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { template_key, responses } = validated;
  if (!template_key) return NextResponse.json({ error: "template_key is required" }, { status: 400 });
  const admin = createAdminSupabaseClient();

  // Determine salon_id: salon owner submitting for client, or client self-submitting
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  let salonId = salon?.id;

  if (salonId) {
    // Salon owner branch: the client must actually belong to this salon
    // (a booking or walk-in queue entry), otherwise any registered user's
    // UUID could have a CRM record attached to it.
    const belongs = await clientBelongsToSalon(admin, salonId, customerId);
    if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });
  } else if (customerId === user.id) {
    // Self-submit branch: never trust a raw body salon_id. Bind it to a real
    // relationship, the submitting user must have a booking at that salon.
    if (!validated.salon_id) {
      return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
    }
    const belongs = await clientBelongsToSalon(admin, validated.salon_id, user.id);
    if (!belongs) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    salonId = validated.salon_id;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: intake, error } = await supabase
    .from("intake_form_responses")
    .insert({
      salon_id: salonId,
      customer_id: customerId,
      template_key,
      // responses is zod z.record(string, unknown) (JSON body field, always JSON-serializable at runtime);
      // cast to the generated Json column type.
      responses: responses as Json,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: intake }, { status: 201 });
}
