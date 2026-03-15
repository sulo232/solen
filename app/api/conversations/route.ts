import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/conversations
 * List authenticated user's conversations with last message preview + unread count.
 *
 * POST /api/conversations
 * Start or get existing conversation with a salon.
 * Body: { salon_id }
 */
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  // Fetch conversations for customer or salon owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("conversations")
    .select("*, salons(name, slug, cover_photo_url), profiles!conversations_customer_id_fkey(display_name, avatar_url)")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (profile?.role === "salon_owner") {
    // Owner sees all conversations for their salons
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (salon) query = query.eq("salon_id", salon.id);
  } else {
    query = query.eq("customer_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], total: data?.length ?? 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { salon_id } = await request.json();

  if (!salon_id) {
    return NextResponse.json({ message: "salon_id is required", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Upsert on (customer_id, salon_id) — one thread per pair
  const { data, error } = await supabase
    .from("conversations")
    .upsert(
      { customer_id: user.id, salon_id },
      { onConflict: "customer_id,salon_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
