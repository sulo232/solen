export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, availabilityManageSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { data: validated, error: validationError } = validateBody(availabilityManageSchema, body);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  const { salon_id, slots } = validated;

  // Verify salon ownership
  const { data: salon } = await supabase.from("salons").select("owner_id").eq("id", salon_id).single();
  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const toInsert = slots.map((slot: { service_id?: string; staff_member_id?: string; starts_at: string; ends_at: string; status?: string }) => ({
    salon_id,
    service_id: slot.service_id ?? null,
    staff_member_id: slot.staff_member_id ?? null,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    status: slot.status ?? "available",
  }));

  const { data, error } = await supabase.from("availability_slots").insert(toInsert).select();
  if (error) {
    if (error.code === '23P01') {
      return NextResponse.json({ message: "Fehler: Mitarbeiter ist in diesem Zeitraum bereits gebucht.", code: "CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
