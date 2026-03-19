export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

const ALLERGY_TAGS = ["Allergie", "Empfindliche Haut", "Latex-Allergie", "Ammoniakfrei"];

const createTagSchema = z.object({
  customer_id: z.string().uuid(),
  tag: z.string().min(1).max(50),
  color: z.enum(["gray", "red", "orange", "teal", "blue", "purple"]).default("gray"),
});

const deleteTagSchema = z.object({
  tag_id: z.string().uuid(),
});

// GET /api/salons/[salonId]/client-tags?customer_id=X — Get tags for a client
export async function GET(req: NextRequest, { params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;

  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customerId = req.nextUrl.searchParams.get("customer_id");

  const query = supabase
    .from("client_tags")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: true });

  if (customerId) {
    query.eq("customer_id", customerId);
  }

  const { data: tags, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    tags: tags ?? [],
    allergy_tags: ALLERGY_TAGS,
  });
}

// POST /api/salons/[salonId]/client-tags — Add a tag
export async function POST(req: NextRequest, { params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;

  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error: validationError } = validateBody(createTagSchema, body);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Auto-assign red color for allergy-related tags
  const isAllergyTag = ALLERGY_TAGS.some((a) => data.tag.toLowerCase().includes(a.toLowerCase()))
    || data.tag.toLowerCase().includes("allerg");
  const color = isAllergyTag ? "red" : data.color;

  const { data: tag, error } = await supabase
    .from("client_tags")
    .insert({
      salon_id: salonId,
      customer_id: data.customer_id,
      tag: data.tag,
      color,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tag existiert bereits für diesen Kunden" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tag }, { status: 201 });
}

// DELETE /api/salons/[salonId]/client-tags — Remove a tag
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { data, error: validationError } = validateBody(deleteTagSchema, body);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase
    .from("client_tags")
    .delete()
    .eq("id", data.tag_id)
    .eq("salon_id", salonId);

  return NextResponse.json({ success: true });
}
