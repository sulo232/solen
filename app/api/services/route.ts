export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, serviceCreateSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { translateToLocales } from "@/lib/ai/translate";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/services?salon_id=xxx — List services for a salon
export async function GET(req: NextRequest) {
  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

// POST /api/services — Create a new service
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(serviceCreateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_id, name_de, name_en, category, duration_minutes, price, description_de, buffer_minutes, processing_minutes, finishing_minutes, suitable_for, suitable_gender, is_active, photos } = validated;

  // G22: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog = services & pricing) instead of the old
  // owner-or-admin compare, so a staff member granted "catalog" can create a
  // service too. The owner path is unchanged.
  const access = await requireSalonAccess(salon_id, "catalog");
  if (access instanceof NextResponse) return access;

  const admin = createAdminSupabaseClient();

  // AUTO-TRANSLATE (owner 2026-07-27: "salon cant rlly translte every service they have").
  // A salon writes the German name once; French and Italian customers would otherwise read
  // German forever, because services.name_fr/name_it existed only from this date and nothing
  // fills them. Three short Gemini calls run in PARALLEL, so this costs one round trip on a
  // save the owner already waits for. Every failure returns "" and is dropped below, leaving
  // the column empty so lib/i18n/localized-field.ts falls back to German , the same thing the
  // customer saw before, never a half-translated row pretending to be finished.
  // The salon can overwrite any of these later; nothing here is authoritative over their edit.
  const [nameLocales, descLocales] = await Promise.all([
    translateToLocales(name_de, "de", "name"),
    description_de
      ? translateToLocales(description_de, "de", "description")
      : Promise.resolve({} as Partial<Record<"de" | "en" | "fr" | "it", string>>),
  ]);

  const { data: service, error } = await admin
    .from("services")
    .insert({
      salon_id,
      name_de,
      ...(nameLocales.fr ? { name_fr: nameLocales.fr } : {}),
      ...(nameLocales.it ? { name_it: nameLocales.it } : {}),
      ...(descLocales.fr ? { description_fr: descLocales.fr } : {}),
      ...(descLocales.it ? { description_it: descLocales.it } : {}),
      // services.name_en is NOT NULL live. The form sends "" when English is left blank, and
      // "" || null → null → constraint violation. Fall back to the German name (always present)
      // so the EN locale shows the service name instead of the create 500-ing.
      name_en: name_en || name_de,
      // category is NOT NULL with a CHECK constraint on the live services table (no DB
      // default). "" is not a member of the allowed set either, so a missing category still
      // fails the same DB-level constraint (surfaced below as a 500), same as the prior
      // `|| null` did, just type-correct for the required non-null column.
      category: category || "",
      duration_minutes: duration_minutes || 60,
      price: price || 0,
      description_de: description_de || null,
      buffer_minutes: buffer_minutes || 0,
      processing_minutes: processing_minutes || 0,
      finishing_minutes: finishing_minutes || 0,
      suitable_for: suitable_for || [],
      suitable_gender: suitable_gender || [],
      is_active: is_active !== false,
      // DB column is photo_urls (canonical — matches lib/types.ts + /services/[id]/photos
      // endpoint). The validated input field is named `photos`; map it to the real column.
      photo_urls: photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service }, { status: 201 });
}
