export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalonId } from "@/lib/active-salon";

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

// Swiss UID / MWST number — loose shape check (CHE-###.###.### [MWST]).
// Salons enter it with or without the "MWST" suffix and with optional spaces;
// we only sanity-check the structure, not Mod11 checksum. Empty/null clears it.
const SWISS_UID_RE = /^CHE-?\d{3}\.?\d{3}\.?\d{3}(\s*(MWST|TVA|IVA|VAT))?$/i;

// PATCH /api/salons/mine — update about_text + VAT/MWST settings (owner-only)
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updateFields: Record<string, unknown> = {};
  if (typeof body.about_text_de === "string") updateFields.about_text_de = body.about_text_de;
  if (typeof body.about_text_en === "string") updateFields.about_text_en = body.about_text_en;
  if (typeof body.about_text_fr === "string") updateFields.about_text_fr = body.about_text_fr;
  if (typeof body.about_text_it === "string") updateFields.about_text_it = body.about_text_it;

  // VAT/MWST registration. vat_registered toggles whether VAT is charged at
  // all; vat_number is the salon's Swiss UID. Per-salon model (the salon is
  // the merchant). vat_rate is intentionally NOT owner-editable here — the
  // 8.1% standard lives in the schema default; surface a rate override only
  // if/when a salon legitimately needs one.
  if (typeof body.vat_registered === "boolean") updateFields.vat_registered = body.vat_registered;
  if ("vat_number" in body) {
    const raw = body.vat_number;
    if (raw === null || (typeof raw === "string" && raw.trim() === "")) {
      updateFields.vat_number = null; // explicit clear.
    } else if (typeof raw === "string" && SWISS_UID_RE.test(raw.trim())) {
      updateFields.vat_number = raw.trim();
    } else {
      return NextResponse.json(
        { error: "Invalid VAT number — expected a Swiss UID like CHE-123.456.789 MWST." },
        { status: 400 },
      );
    }
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
