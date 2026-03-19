export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, createConversationSchema } from "@/lib/validations";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  // Get conversations where user is customer OR salon owner
  const { data: ownedSalons } = await supabase.from("salons").select("id").eq("owner_id", user.id);
  const salonIds = ownedSalons?.map((s) => s.id) ?? [];

  let query = supabase
    .from("conversations")
    .select("*, salons(name, slug, cover_photo_url), profiles!customer_id(display_name, avatar_url)")
    .order("last_message_at", { ascending: false });

  if (salonIds.length > 0) {
    query = query.or(`customer_id.eq.${user.id},salon_id.in.(${salonIds.join(",")})`);
  } else {
    query = query.eq("customer_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ conversations: data, data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createConversationSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { salon_id } = validated;

  // Upsert — one conversation per customer+salon pair
  const { data, error } = await supabase
    .from("conversations")
    .upsert({ customer_id: user.id, salon_id }, { onConflict: "customer_id,salon_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
