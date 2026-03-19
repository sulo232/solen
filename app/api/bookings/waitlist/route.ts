export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const waitlistSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("booking_waitlist")
    .select("*, salons(name, slug, cover_photo_url), services(name_de, name_en)")
    .eq("user_id", user.id)
    .eq("status", "waiting")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(waitlistSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Check for duplicate
  const { data: existing } = await supabase
    .from("booking_waitlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("salon_id", validated.salon_id)
    .eq("status", "waiting")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Already on waitlist for this salon", code: "DUPLICATE" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("booking_waitlist")
    .insert({
      user_id: user.id,
      salon_id: validated.salon_id,
      service_id: validated.service_id ?? null,
      preferred_date: validated.preferred_date ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id required", code: "VALIDATION_ERROR" }, { status: 400 });

  const { error } = await supabase
    .from("booking_waitlist")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ success: true });
}
