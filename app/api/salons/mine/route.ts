export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalonId } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, salonsMinePatchSchema } from "@/lib/validations";
import type { Database } from "@/lib/database.types";

// GET /api/salons/mine — returns the current user's ACTIVE salon (cookie-selected
// if owned, else oldest) plus the full list of owned salons (for the switcher).
// `salon` is kept for back-compat; `salons` is the new switcher list.
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, categories")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const activeId = await getActiveSalonId(supabase, user.id);
  const active = (salons ?? []).find((s) => s.id === activeId) ?? (salons?.[0] ?? null);

  return NextResponse.json({ salon: active, salons: salons ?? [] });
}

// PATCH /api/salons/mine: update about_text + VAT/MWST settings (owner-only)
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json();
  const { data: body, error: validationError } = validateBody(salonsMinePatchSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }

  const updateFields: Database["public"]["Tables"]["salons"]["Update"] = {};
  if (body.about_text_de !== undefined) updateFields.about_text_de = body.about_text_de;
  if (body.about_text_en !== undefined) updateFields.about_text_en = body.about_text_en;
  if (body.about_text_fr !== undefined) updateFields.about_text_fr = body.about_text_fr;
  if (body.about_text_it !== undefined) updateFields.about_text_it = body.about_text_it;

  // VAT/MWST registration. vat_registered toggles whether VAT is charged at all; vat_number
  // is the salon's Swiss UID. Per-salon model (the salon is the merchant). vat_rate is
  // intentionally NOT owner-editable here: the 8.1% standard lives in the schema default,
  // surface a rate override only if/when a salon legitimately needs one.
  if (body.vat_registered !== undefined) updateFields.vat_registered = body.vat_registered;
  if (body.vat_number !== undefined) {
    const raw = body.vat_number;
    updateFields.vat_number = raw === null || raw.trim() === "" ? null : raw.trim();
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("salons")
    .update(updateFields)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
