export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, updateProfileSchema } from "@/lib/validations";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Also look up owned salon (for DashboardLayout auth guard)
  let salon_id: string | null = null;
  let salon_name: string | null = null;
  const { data: ownedSalon } = await supabase
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .single();
  if (ownedSalon) {
    salon_id = ownedSalon.id;
    salon_name = ownedSalon.name;
  }

  return NextResponse.json({ ...data, salon_id, salon_name });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(updateProfileSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update(validated).eq("id", user.id).select().single();
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data });
}
