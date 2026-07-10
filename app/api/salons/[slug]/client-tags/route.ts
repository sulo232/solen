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

// Schema drift: the client_tags table may not exist yet (migration not applied).
// Detect the Postgres "undefined_table" (42P01) / PostgREST schema-cache miss so the
// dashboard degrades gracefully instead of 500-ing. Mirrors the GET handler.
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("schema cache") || msg.includes("does not exist");
}

// GET /api/salons/[slug]/client-tags?customer_id=X — Get tags for a client
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", slug)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customerId = req.nextUrl.searchParams.get("customer_id");

  const query = supabase
    .from("client_tags")
    .select("*")
    .eq("salon_id", slug)
    .order("created_at", { ascending: true });

  if (customerId) {
    query.eq("customer_id", customerId);
  }

  const { data: tags, error } = await query;

  // Schema drift: the client_tags table may not exist yet (migration not applied). Don't 500
  // the dashboard once per booking row — log server-side and degrade gracefully to empty tags.
  if (error) {
    console.error("[client-tags] GET failed (client_tags table may be missing):", error.message);
    return NextResponse.json({ tags: [], allergy_tags: ALLERGY_TAGS });
  }

  return NextResponse.json({
    tags: tags ?? [],
    allergy_tags: ALLERGY_TAGS,
  });
}

// POST /api/salons/[slug]/client-tags — Add a tag
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
    .eq("id", slug)
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
      salon_id: slug,
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
    if (isMissingTableError(error)) {
      console.error("[client-tags] POST failed (client_tags table may be missing):", error.message);
      return NextResponse.json({ error: "Kunden-Tags sind derzeit nicht verfügbar" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tag }, { status: 201 });
}

// DELETE /api/salons/[slug]/client-tags — Remove a tag
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
    .eq("id", slug)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("client_tags")
    .delete()
    .eq("id", data.tag_id)
    .eq("salon_id", slug);

  if (error) {
    if (isMissingTableError(error)) {
      console.error("[client-tags] DELETE failed (client_tags table may be missing):", error.message);
      return NextResponse.json({ success: true });
    }
    console.error("[client-tags] DELETE failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
