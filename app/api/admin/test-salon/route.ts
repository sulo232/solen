export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

const TEST_PREFIX = "[TEST]";

// Fake salon names & addresses for quick spin-up
const FAKE_NAMES = [
  "Basel Cuts & Co.", "Salon am Rhein", "Studio Goldschnitt",
  "Friseur Helvetia", "Beauty Lounge Dreirosen", "Studio Nails & More",
  "Barber & Soul", "Wellness Atelier Basel", "Coiffeur Centrale",
];
const FAKE_ADDRESSES = [
  "Marktplatz 12, 4001 Basel", "Freie Strasse 45, 4001 Basel",
  "Steinentorstrasse 7, 4051 Basel", "Barfüssergasse 3, 4051 Basel",
];
const CATEGORIES_OPTIONS = [
  ["hair"], ["nail"], ["barbershop"], ["spa"], ["makeup"], ["waxing"],
  ["hair", "nail"], ["barbershop", "hair"],
];
const SERVICES_TEMPLATES: { name_de: string; name_en: string; category: string; duration_minutes: number; price: number }[] = [
  { name_de: "Herrenhaarschnitt", name_en: "Men's Haircut", category: "hair", duration_minutes: 30, price: 4500 },
  { name_de: "Damenhaarschnitt", name_en: "Women's Haircut", category: "hair", duration_minutes: 45, price: 6500 },
  { name_de: "Bart trimmen", name_en: "Beard Trim", category: "hair", duration_minutes: 20, price: 2500 },
  { name_de: "Gel-Nägel", name_en: "Gel Nails", category: "nail", duration_minutes: 60, price: 7500 },
  { name_de: "Maniküre", name_en: "Manicure", category: "nail", duration_minutes: 45, price: 5500 },
  { name_de: "Fade Cut", name_en: "Fade Cut", category: "barbershop", duration_minutes: 35, price: 3800 },
  { name_de: "Hot Towel Rasur", name_en: "Hot Towel Shave", category: "barbershop", duration_minutes: 30, price: 4000 },
  { name_de: "Rückenmassage", name_en: "Back Massage", category: "spa", duration_minutes: 60, price: 9000 },
  { name_de: "Gesichtsbehandlung", name_en: "Facial Treatment", category: "spa", duration_minutes: 45, price: 8500 },
  { name_de: "Braut Makeup", name_en: "Bridal Makeup", category: "makeup", duration_minutes: 90, price: 15000 },
  { name_de: "Brazilian Wax", name_en: "Brazilian Wax", category: "waxing", duration_minutes: 30, price: 5500 },
  { name_de: "Ganzkörper-Waxing", name_en: "Full Body Wax", category: "waxing", duration_minutes: 90, price: 13000 },
];
const STAFF_TEMPLATES = [
  { name: "Lukas M.", specialties: ["Herrenhaarschnitt", "Fade Cut"] },
  { name: "Sara K.", specialties: ["Damenhaarschnitt", "Farbe"] },
  { name: "Marco B.", specialties: ["Bart trimmen", "Hot Towel Rasur"] },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── GET: list test salons owned by admin ─────────────────────────────────────
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: salons } = await admin
    .from("salons")
    .select("id, name, slug, categories, address, is_active, created_at")
    .eq("owner_id", session.user.id)
    .ilike("name", `${TEST_PREFIX}%`)
    .order("created_at", { ascending: false });

  return NextResponse.json({ salons: salons ?? [] });
}

// ─── POST: create test salon ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminSupabaseClient();
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const categories: string[] = body.categories ?? rand(CATEGORIES_OPTIONS);
  const baseName = body.name ?? rand(FAKE_NAMES);
  const name = `${TEST_PREFIX} ${baseName}`;
  const slug = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const address = rand(FAKE_ADDRESSES);

  // Create salon
  const { data: salon, error: salonErr } = await adminClient
    .from("salons")
    .insert({
      owner_id: session.user.id,
      name,
      slug,
      categories,
      address,
      latitude: 47.5596 + (Math.random() - 0.5) * 0.02,
      longitude: 7.5886 + (Math.random() - 0.5) * 0.02,
      is_active: true,
      registration_completed: true,
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (salonErr || !salon) {
    return NextResponse.json({ error: salonErr?.message ?? "Failed to create salon" }, { status: 500 });
  }

  // Create matching services (filter by category)
  const matchedServices = SERVICES_TEMPLATES.filter((s) => categories.includes(s.category));
  const servicesToCreate = matchedServices.length > 0 ? matchedServices : SERVICES_TEMPLATES.slice(0, 3);
  const { data: services } = await adminClient
    .from("services")
    .insert(servicesToCreate.map((s) => ({ ...s, salon_id: salon.id, is_active: true })))
    .select();

  // Create staff
  const staffToCreate = STAFF_TEMPLATES.slice(0, 2);
  const { data: staff } = await adminClient
    .from("staff_members")
    .insert(staffToCreate.map((s) => ({ ...s, salon_id: salon.id, is_active: true })))
    .select();

  return NextResponse.json({ salon, services: services ?? [], staff: staff ?? [] });
}

// ─── DELETE: delete test salon + all related data ─────────────────────────────
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminSupabaseClient();
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Confirm it's a test salon owned by this admin
  const { data: salon } = await adminClient.from("salons").select("owner_id, name").eq("id", salonId).single();
  if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (salon.owner_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!salon.name.startsWith(TEST_PREFIX)) return NextResponse.json({ error: "Not a test salon" }, { status: 400 });

  // Delete in dependency order
  await Promise.all([
    adminClient.from("bookings").delete().eq("salon_id", salonId),
    adminClient.from("reviews").delete().eq("salon_id", salonId),
    adminClient.from("barber_walkin_queue").delete().eq("salon_id", salonId),
    adminClient.from("last_minute_slots").delete().eq("salon_id", salonId),
  ]);
  await Promise.all([
    adminClient.from("services").delete().eq("salon_id", salonId),
    adminClient.from("staff_members").delete().eq("salon_id", salonId),
  ]);
  await adminClient.from("salons").delete().eq("id", salonId);

  return NextResponse.json({ deleted: true });
}
