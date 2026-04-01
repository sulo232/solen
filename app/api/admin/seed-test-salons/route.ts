import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/admin/seed-test-salons
 *   body: { cities?: string[] }  — defaults to ["basel","zuerich","bern"]
 *
 * DELETE /api/admin/seed-test-salons
 *   Removes all rows where is_test = true
 *
 * GET /api/admin/seed-test-salons
 *   Returns list of current test salons + count of real salons per city/category
 */

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return admin;
}

// ---------------------------------------------------------------------------
// Template data — one set per category, reused per city with localised names
// ---------------------------------------------------------------------------
type TestSalonTemplate = {
  baseName: string;
  category: string;
  quartier: Record<string, string>; // city slug → quartier name
  cover_photo_url: string;
  min_price: number;
  average_rating: number;
  review_count: number;
  description_de: string;
  services: { name_de: string; name_en: string; duration_minutes: number; price: number }[];
};

const TEMPLATES: TestSalonTemplate[] = [
  {
    baseName: "Atelier Lumière",
    category: "coiffeur",
    quartier: { basel: "Altstadt", zuerich: "Kreis 1", bern: "Innere Stadt" },
    cover_photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    min_price: 65, average_rating: 4.9, review_count: 87,
    description_de: "Modernes Coiffeursalon im Herzen der Stadt. Wir bieten Schnittechniken, Colorationen und Styling für jeden Typ.",
    services: [
      { name_de: "Damenschnitt", name_en: "Women's Haircut", duration_minutes: 60, price: 75 },
      { name_de: "Herrenschnitt", name_en: "Men's Haircut", duration_minutes: 30, price: 40 },
      { name_de: "Coloration", name_en: "Color Treatment", duration_minutes: 120, price: 140 },
      { name_de: "Blowout & Styling", name_en: "Blowout & Styling", duration_minutes: 45, price: 65 },
    ],
  },
  {
    baseName: "Nails & Grace",
    category: "nails",
    quartier: { basel: "Gundeldingen", zuerich: "Kreis 4", bern: "Länggasse" },
    cover_photo_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
    min_price: 35, average_rating: 4.8, review_count: 42,
    description_de: "Professionelle Nagelstudio mit Premium-Gellack, Acryl und Nail Art Designs.",
    services: [
      { name_de: "Gellack Manicure", name_en: "Gel Manicure", duration_minutes: 60, price: 55 },
      { name_de: "Acryl Fullset", name_en: "Acrylic Full Set", duration_minutes: 90, price: 85 },
      { name_de: "Nail Art", name_en: "Nail Art", duration_minutes: 30, price: 35 },
      { name_de: "Pedicure", name_en: "Pedicure", duration_minutes: 60, price: 65 },
    ],
  },
  {
    baseName: "The Barber Society",
    category: "barbershop",
    quartier: { basel: "St. Johann", zuerich: "Kreis 5", bern: "Mattenhof" },
    cover_photo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    min_price: 30, average_rating: 4.7, review_count: 124,
    description_de: "Traditioneller Barbershop mit modernem Flair. Haircuts, Rasierer und Bartpflege.",
    services: [
      { name_de: "Herrenschnitt", name_en: "Men's Cut", duration_minutes: 30, price: 35 },
      { name_de: "Rasur", name_en: "Shave", duration_minutes: 30, price: 30 },
      { name_de: "Schnitt & Rasur", name_en: "Cut & Shave", duration_minutes: 60, price: 60 },
      { name_de: "Bartpflege", name_en: "Beard Trim", duration_minutes: 20, price: 25 },
    ],
  },
  {
    baseName: "Serenity Spa",
    category: "spa",
    quartier: { basel: "Bruderholz", zuerich: "Kreis 7", bern: "Kirchenfeld" },
    cover_photo_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    min_price: 80, average_rating: 4.9, review_count: 61,
    description_de: "Luxuriöses Spa-Erlebnis mit Massagen, Körperbehandlungen und Entspannungsangeboten.",
    services: [
      { name_de: "Klassische Massage 60 Min", name_en: "Classic Massage 60 Min", duration_minutes: 60, price: 90 },
      { name_de: "Hot Stone Massage", name_en: "Hot Stone Massage", duration_minutes: 90, price: 130 },
      { name_de: "Gesichtsbehandlung", name_en: "Facial Treatment", duration_minutes: 60, price: 80 },
      { name_de: "Körperpeeling", name_en: "Body Scrub", duration_minutes: 45, price: 75 },
    ],
  },
  {
    baseName: "Glam Studio",
    category: "makeup",
    quartier: { basel: "Bachletten", zuerich: "Kreis 6", bern: "Breitenrain" },
    cover_photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
    min_price: 50, average_rating: 4.6, review_count: 33,
    description_de: "Professionelles Makeup-Studio für Special Occasions, Bridal und Everyday Looks.",
    services: [
      { name_de: "Alltagsmakeup", name_en: "Everyday Makeup", duration_minutes: 45, price: 55 },
      { name_de: "Bridal Makeup", name_en: "Bridal Makeup", duration_minutes: 90, price: 180 },
      { name_de: "Abend-Makeup", name_en: "Evening Makeup", duration_minutes: 60, price: 85 },
      { name_de: "Permanent Makeup Konsultation", name_en: "PMU Consultation", duration_minutes: 30, price: 50 },
    ],
  },
];

const CITY_DATA: Record<string, { name: string; lat: number; lng: number }> = {
  basel:   { name: "Basel",  lat: 47.5596, lng: 7.5886 },
  zuerich: { name: "Zürich", lat: 47.3769, lng: 8.5417 },
  bern:    { name: "Bern",   lat: 46.9480, lng: 7.4474 },
};

// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const selectedCities: string[] = body.cities ?? ["basel", "zuerich", "bern"];

  // Resolve city_ids from DB
  const { data: cityRows } = await admin
    .from("cities")
    .select("id, slug")
    .in("slug", selectedCities);

  if (!cityRows?.length) {
    return NextResponse.json({ error: "No matching cities found in DB" }, { status: 404 });
  }

  const cityIdMap = Object.fromEntries(cityRows.map((c: { id: string; slug: string }) => [c.slug, c.id]));
  const seeded: string[] = [];
  const errors: string[] = [];

  for (const citySlug of selectedCities) {
    const city_id = cityIdMap[citySlug];
    if (!city_id) continue;
    const cityInfo = CITY_DATA[citySlug];

    for (const tpl of TEMPLATES) {
      const slug = `test-${citySlug}-${tpl.category}-${tpl.baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const name = `[TEST] ${tpl.baseName}`;

      // Upsert salon row
      const { data: existing } = await admin
        .from("salons")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      let salonId: string;

      if (existing?.id) {
        salonId = existing.id;
        await admin.from("salons").update({
          name,
          is_active: true,
          is_test: true,
        }).eq("id", salonId);
      } else {
        const { data: inserted, error: insertErr } = await admin
          .from("salons")
          .insert({
            slug,
            name,
            city_id,
            city: citySlug,
            city_name: cityInfo.name,
            quartier: tpl.quartier[citySlug] ?? "Zentrum",
            categories: [tpl.category],
            cover_photo_url: tpl.cover_photo_url,
            gallery_urls: [tpl.cover_photo_url],
            description_de: tpl.description_de,
            description_en: tpl.description_de, // fallback
            average_rating: tpl.average_rating,
            review_count: tpl.review_count,
            min_price: tpl.min_price,
            is_active: true,
            is_test: true,
            latitude: cityInfo.lat + (Math.random() - 0.5) * 0.02,
            longitude: cityInfo.lng + (Math.random() - 0.5) * 0.02,
            opening_hours: {
              mon: { open: "09:00", close: "18:00" },
              tue: { open: "09:00", close: "18:00" },
              wed: { open: "09:00", close: "18:00" },
              thu: { open: "09:00", close: "20:00" },
              fri: { open: "09:00", close: "18:00" },
              sat: { open: "09:00", close: "16:00" },
            },
          })
          .select("id")
          .single();

        if (insertErr || !inserted) {
          errors.push(`${slug}: ${insertErr?.message}`);
          continue;
        }
        salonId = inserted.id;

        // Seed services
        await admin.from("services").insert(
          tpl.services.map((s) => ({
            salon_id: salonId,
            name_de: s.name_de,
            name_en: s.name_en,
            category: tpl.category,
            duration_minutes: s.duration_minutes,
            price: s.price,
            is_active: true,
          }))
        );

        // Seed 14-day availability (30-min slots, Mon–Sat 9–18)
        const slots: Record<string, unknown>[] = [];
        const now = new Date();
        for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
          const d = new Date(now);
          d.setDate(d.getDate() + dayOffset);
          if (d.getDay() === 0) continue; // skip Sunday
          const dateStr = d.toISOString().split("T")[0];
          const endHour = d.getDay() === 4 ? 20 : 18; // Thu open until 20
          for (let hour = 9; hour < endHour; hour++) {
            for (const min of [0, 30]) {
              slots.push({
                salon_id: salonId,
                starts_at: `${dateStr}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`,
                ends_at: `${dateStr}T${String(hour + (min === 30 ? 1 : 0)).padStart(2, "0")}:${min === 30 ? "00" : "30"}:00`,
                status: "available",
              });
            }
          }
        }
        for (let i = 0; i < slots.length; i += 100) {
          await admin.from("availability_slots").insert(slots.slice(i, i + 100));
        }
      }

      seeded.push(slug);
    }
  }

  return NextResponse.json({ success: true, seeded, errors, count: seeded.length });
}

// ---------------------------------------------------------------------------

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await admin
    .from("salons")
    .delete()
    .eq("is_test", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ---------------------------------------------------------------------------

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: testSalons } = await admin
    .from("salons")
    .select("id, slug, name, city, categories, is_active")
    .eq("is_test", true)
    .order("city")
    .order("name");

  // Per city+category real salon counts
  const { data: realCounts } = await admin
    .from("salons")
    .select("city, categories")
    .eq("is_test", false)
    .eq("is_active", true);

  const countMap: Record<string, number> = {};
  for (const row of realCounts ?? []) {
    const cats = (row.categories as string[]) ?? [];
    for (const cat of cats) {
      const key = `${row.city}:${cat}`;
      countMap[key] = (countMap[key] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    testSalons: testSalons ?? [],
    realSalonCounts: countMap,
  });
}
