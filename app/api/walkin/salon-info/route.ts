export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  const locale = searchParams.get("locale") || "de";

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id, name, address")
    .eq("id", salonId)
    .maybeSingle();

  if (!salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  // Service names are i18n (name_de / name_en). Walk-in shows all bookable services;
  // tolerate is_active = null (some seeded rows leave it unset) — only hide explicit-off.
  const { data: raw } = await admin
    .from("services")
    .select("id, name_de, name_en, price, duration_minutes")
    .eq("salon_id", salonId)
    .or("is_active.is.null,is_active.eq.true")
    .order("price", { ascending: true });

  // Normalize for the client: pick a localized name, coerce numeric price to a real number.
  const services = (raw || []).map((s) => ({
    id: s.id,
    name: (locale === "en" ? s.name_en : s.name_de) || s.name_de || s.name_en || "Service",
    price: Number(s.price),
    duration_minutes: s.duration_minutes,
  }));

  // Active staff for the walk-in barber picker (id + name + avatar + role-from-specialty).
  const { data: staffRaw } = await admin
    .from("staff_members")
    .select("id, name, avatar_url, specialties, average_rating, review_count")
    .eq("salon_id", salonId)
    .eq("is_active", true);
  const staff = (staffRaw || []).map((s) => ({
    id: s.id,
    name: s.name,
    avatar_url: s.avatar_url,
    role: Array.isArray(s.specialties) ? s.specialties[0] ?? null : null,
    rating: s.average_rating ?? null,
    review_count: s.review_count ?? null,
  }));

  return NextResponse.json({ salon, services, staff });
}
