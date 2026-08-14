export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, formulaSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import type { Json } from "@/lib/database.types";
import { signedUrl } from "@/lib/storage";

// GET /api/clients/[id]/formulas — Get client formulas (salon owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("client_formulas")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The before/after columns hold bucket-relative PATHS in a private bucket, so they are signed
  // here rather than handed to the browser raw. This is the sibling of the fix in
  // app/api/dashboard/coiffeur/formula-photo: without it that fix would only move the broken image
  // from one screen to another, because FormulaBook.tsx reads these two fields straight from here.
  // A photo that cannot be signed becomes null, which the card already renders as "no photo",
  // rather than a path in an <img src>, which renders as broken.
  const admin = createAdminSupabaseClient();
  const items = await Promise.all(
    (data ?? []).map(async (f) => ({
      ...f,
      before_photo_url: f.before_photo_url
        ? await signedUrl(admin, "formula-photos", f.before_photo_url)
        : null,
      after_photo_url: f.after_photo_url
        ? await signedUrl(admin, "formula-photos", f.after_photo_url)
        : null,
    })),
  );

  return NextResponse.json({ items });
}

// POST /api/clients/[id]/formulas — Add a formula
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(formulaSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const belongs = await clientBelongsToSalon(admin, salon.id, customerId);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  const { data: formula, error } = await supabase
    .from("client_formulas")
    .insert({
      salon_id: salon.id,
      customer_id: customerId,
      booking_id: validated.booking_id ?? null,
      brand: validated.brand ?? null,
      product_line: validated.product_line ?? null,
      mix_formula: validated.mix_formula,
      developer_volume: validated.developer_volume ?? null,
      processing_minutes: validated.processing_minutes ?? null,
      notes: validated.notes ?? null,
      shade_code: validated.shade_code ?? null,
      // root_formula/mid_lengths_formula/ends_formula are zod z.record(string, unknown) (JSON body fields,
      // always JSON-serializable at runtime); cast to the generated Json column type.
      root_formula: (validated.root_formula ?? {}) as Json,
      mid_lengths_formula: (validated.mid_lengths_formula ?? {}) as Json,
      ends_formula: (validated.ends_formula ?? {}) as Json,
      staff_member_id: validated.staff_member_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: formula }, { status: 201 });
}
