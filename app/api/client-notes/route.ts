import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

// GET /api/client-notes?salon_id=X&customer_id=Y — Salon fetches notes for a client
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const customerId = searchParams.get("customer_id");

  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const query = supabase
    .from("client_notes")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (customerId) query.eq("customer_id", customerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notes: data ?? [] });
}

// POST /api/client-notes — Create a note
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { salon_id, customer_id, note, note_type, booking_id } = body;

  if (!salon_id || !customer_id || !note || typeof note !== "string" || note.length > 1000) {
    return NextResponse.json({ error: "salon_id, customer_id, and note (max 1000 chars) required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("client_notes")
    .insert({
      salon_id,
      customer_id,
      note,
      note_type: note_type || "permanent",
      booking_id: booking_id || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data }, { status: 201 });
}
