/**
 * seed-coiffeur-rails.ts
 *
 * Seeds ~9 Basel coiffeur demo salons so the CategoryBrowseRails on /coiffeur
 * have enough varied data to populate ALL six rails distinctly:
 *   Top auf Solen (rating) · Angebote (discount) · In der Nähe (pool) ·
 *   Bald frei (future slots) · Für Männer (men's services) · Coloration.
 *
 * Why is_test=false: app/api/salons/route.ts ALWAYS filters `.eq("is_test", false)`
 * (line ~52) AND auto-hides test salons when real ones exist for a city+category.
 * Coiffeur already has real salons, so is_test=true rows would never show. These
 * are tracked instead by the slug prefix below for clean removal.
 *
 * Critical correctness: availability_slots carry `service_id` (the API attaches
 * slots to services via .in("service_id", ...) — slots without it never surface).
 *
 * Run:    npx tsx scripts/seed-coiffeur-rails.ts
 * Clean:  npx tsx scripts/seed-coiffeur-rails.ts --clean   (removes only these rows)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local (mirrors scripts/collect-basel-salons.ts) ─────────────────
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SLUG_PREFIX = "srail-basel-coiffeur-";
const CLEAN = process.argv.includes("--clean");

// ── Salon definitions — designed so each rail is a real, distinct subset ──────
type Svc = { name_de: string; name_en: string; price: number; duration: number };
type SalonDef = {
  key: string;
  name: string;
  quartier: string;
  rating: number;
  reviews: number;
  discount: number; // last_minute_discount_percent (0 = none)
  photo: string;
  services: Svc[];
};

const PHOTO = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const SALONS: SalonDef[] = [
  { key: "belle-rive", name: "Coiffure Belle Rive", quartier: "grossbasel", rating: 4.9, reviews: 132, discount: 0, photo: PHOTO("1560066984-138dadb4c035"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 80, duration: 60 }, { name_de: "Herrenschnitt", name_en: "Men's cut", price: 45, duration: 30 }, { name_de: "Coloration", name_en: "Color", price: 140, duration: 120 } ] },
  { key: "kopfsache", name: "Studio Kopfsache", quartier: "gundeli", rating: 4.85, reviews: 98, discount: 20, photo: PHOTO("1521590832167-7bcbfaa6381f"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 75, duration: 60 }, { name_de: "Coloration", name_en: "Color", price: 150, duration: 120 }, { name_de: "Balayage", name_en: "Balayage", price: 190, duration: 150 } ] },
  { key: "herrenzimmer", name: "HerrenZimmer Basel", quartier: "kleinbasel", rating: 4.8, reviews: 211, discount: 0, photo: PHOTO("1503951914875-452162b0f3f1"),
    services: [ { name_de: "Herrenschnitt", name_en: "Men's cut", price: 40, duration: 30 }, { name_de: "Bartpflege", name_en: "Beard trim", price: 25, duration: 20 }, { name_de: "Rasur", name_en: "Shave", price: 35, duration: 30 } ] },
  { key: "color-lab", name: "Color Lab Basel", quartier: "grossbasel", rating: 4.95, reviews: 76, discount: 15, photo: PHOTO("1562322140-8baeececf3df"),
    services: [ { name_de: "Coloration", name_en: "Color", price: 160, duration: 120 }, { name_de: "Balayage", name_en: "Balayage", price: 210, duration: 150 }, { name_de: "Strähnen", name_en: "Highlights", price: 180, duration: 130 } ] },
  { key: "haarwerkstatt-rhy", name: "Haarwerkstatt Rhy", quartier: "breite", rating: 4.7, reviews: 54, discount: 0, photo: PHOTO("1559599101-f09722fb4948"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 70, duration: 60 }, { name_de: "Herrenschnitt", name_en: "Men's cut", price: 42, duration: 30 } ] },
  { key: "nordlicht", name: "Salon Nordlicht", quartier: "kleinbasel", rating: 4.78, reviews: 89, discount: 25, photo: PHOTO("1580618672591-eb180b1a973f"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 78, duration: 60 }, { name_de: "Coloration", name_en: "Color", price: 145, duration: 120 } ] },
  { key: "barber-blade", name: "Barber & Blade", quartier: "bruderholz", rating: 4.82, reviews: 167, discount: 0, photo: PHOTO("1622286342621-4bd786c2447c"),
    services: [ { name_de: "Herrenschnitt", name_en: "Men's cut", price: 38, duration: 30 }, { name_de: "Bartpflege", name_en: "Beard trim", price: 28, duration: 20 }, { name_de: "Rasur", name_en: "Shave", price: 33, duration: 30 } ] },
  { key: "glanz-gloria", name: "Glanz & Gloria", quartier: "bruderholz", rating: 4.65, reviews: 41, discount: 10, photo: PHOTO("1633681926022-84c23e8cb2d6"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 72, duration: 60 }, { name_de: "Coloration", name_en: "Color", price: 135, duration: 120 }, { name_de: "Styling", name_en: "Styling", price: 60, duration: 45 } ] },
  { key: "schnittstelle", name: "Schnittstelle Basel", quartier: "iselin", rating: 4.88, reviews: 120, discount: 0, photo: PHOTO("1605497788044-5a32c7078486"),
    services: [ { name_de: "Damenschnitt", name_en: "Women's cut", price: 82, duration: 60 }, { name_de: "Herrenschnitt", name_en: "Men's cut", price: 46, duration: 30 }, { name_de: "Coloration", name_en: "Color", price: 155, duration: 120 } ] },
];

// Real-looking Basel street addresses + postal codes per salon (card shows address).
const ADDR: Record<string, { address: string; postal: string }> = {
  "belle-rive": { address: "St. Alban-Vorstadt 14, Basel", postal: "4052" },
  "kopfsache": { address: "Güterstrasse 102, Basel", postal: "4053" },
  "herrenzimmer": { address: "Klybeckstrasse 31, Basel", postal: "4057" },
  "color-lab": { address: "Gerbergasse 48, Basel", postal: "4001" },
  "haarwerkstatt-rhy": { address: "Zürcherstrasse 9, Basel", postal: "4052" },
  "nordlicht": { address: "Wettsteinplatz 5, Basel", postal: "4058" },
  "barber-blade": { address: "Feldbergstrasse 64, Basel", postal: "4057" },
  "glanz-gloria": { address: "Bachlettenstrasse 22, Basel", postal: "4054" },
  "schnittstelle": { address: "Hauptstrasse 77, Basel", postal: "4055" },
};

const BASEL = { lat: 47.5596, lng: 7.5886 };
const OPENING = {
  mon: { open: "09:00", close: "18:00" }, tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" }, thu: { open: "09:00", close: "20:00" },
  fri: { open: "09:00", close: "18:00" }, sat: { open: "09:00", close: "16:00" },
};

async function cleanup(): Promise<void> {
  const { data: existing } = await supabase
    .from("salons")
    .select("id, slug")
    .like("slug", `${SLUG_PREFIX}%`);
  const ids = (existing ?? []).map((s) => s.id as string);
  if (ids.length === 0) {
    console.log("cleanup: no prior srail- salons found.");
    return;
  }
  await supabase.from("availability_slots").delete().in("salon_id", ids);
  await supabase.from("services").delete().in("salon_id", ids);
  await supabase.from("salons").delete().in("id", ids);
  console.log(`cleanup: removed ${ids.length} prior srail- salons (+ their services + slots).`);
}

/** Future 30-min slots over the next 5 days at a few times — only > now. */
function futureSlots(salonId: string, serviceId: string, durationMin: number): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const now = Date.now();
  const HOURS = [10, 12, 14, 16, 18];
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const base = new Date();
    base.setDate(base.getDate() + dayOffset);
    if (base.getDay() === 0) continue; // skip Sunday
    for (const h of HOURS) {
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, 0, 0, 0);
      if (start.getTime() <= now + 30 * 60 * 1000) continue; // must be future
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      out.push({
        salon_id: salonId,
        service_id: serviceId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "available",
      });
    }
  }
  return out;
}

async function main() {
  // Always clean prior seed first (idempotent re-runs).
  await cleanup();
  if (CLEAN) {
    console.log("--clean done. Exiting without seeding.");
    return;
  }

  // Resolve basel city_id.
  const { data: city } = await supabase.from("cities").select("id").eq("slug", "basel").maybeSingle();
  const cityId = city?.id ?? null;
  console.log("basel city_id:", cityId ?? "(not found — inserting with null city_id)");

  // owner_id is NOT NULL — reuse an existing salon's owner (the demo owner).
  const { data: anyOwner } = await supabase
    .from("salons")
    .select("owner_id")
    .not("owner_id", "is", null)
    .limit(1)
    .maybeSingle();
  const ownerId = anyOwner?.owner_id as string | undefined;
  if (!ownerId) {
    console.error("No existing salon owner_id found to reuse — cannot satisfy NOT NULL owner_id. Aborting.");
    process.exit(1);
  }
  console.log("reusing owner_id:", ownerId);

  let salonCount = 0;
  let svcCount = 0;
  let slotCount = 0;

  for (const def of SALONS) {
    const slug = `${SLUG_PREFIX}${def.key}`;
    const addr = ADDR[def.key];

    const { data: inserted, error: salonErr } = await supabase
      .from("salons")
      .insert({
        slug,
        name: def.name,
        owner_id: ownerId,
        city_id: cityId,
        address: addr.address,
        postal_code: addr.postal,
        quartier: def.quartier,
        categories: ["coiffeur"],
        cover_photo_url: def.photo,
        gallery_urls: [def.photo],
        description_de: `${def.name} — Coiffeursalon in Basel (${def.quartier}).`,
        description_en: `${def.name} — hair salon in Basel (${def.quartier}).`,
        average_rating: def.rating,
        review_count: def.reviews,
        last_minute_discount_percent: def.discount,
        last_minute_window_hours: 6,
        is_active: true,
        is_test: false,
        latitude: BASEL.lat + (Math.random() - 0.5) * 0.025,
        longitude: BASEL.lng + (Math.random() - 0.5) * 0.025,
        opening_hours: OPENING,
      })
      .select("id")
      .single();

    if (salonErr || !inserted) {
      console.error(`  ! ${slug}:`, salonErr?.message);
      continue;
    }
    salonCount++;
    const salonId = inserted.id as string;

    // Insert services, get ids back.
    const { data: svcRows, error: svcErr } = await supabase
      .from("services")
      .insert(
        def.services.map((s) => ({
          salon_id: salonId,
          name_de: s.name_de,
          name_en: s.name_en,
          category: "coiffeur",
          duration_minutes: s.duration,
          price: s.price,
          is_active: true,
        })),
      )
      .select("id, duration_minutes");

    if (svcErr || !svcRows) {
      console.error(`  ! services for ${slug}:`, svcErr?.message);
      continue;
    }
    svcCount += svcRows.length;

    // Future slots per service (with service_id — the key linkage).
    const allSlots: Record<string, unknown>[] = [];
    for (const row of svcRows) {
      allSlots.push(...futureSlots(salonId, row.id as string, (row.duration_minutes as number) ?? 30));
    }
    for (let i = 0; i < allSlots.length; i += 200) {
      const { error: slotErr } = await supabase.from("availability_slots").insert(allSlots.slice(i, i + 200));
      if (slotErr) { console.error(`  ! slots for ${slug}:`, slotErr.message); break; }
    }
    slotCount += allSlots.length;
    console.log(`  + ${def.name}  (rating ${def.rating}, disc ${def.discount}%, ${svcRows.length} svc, ${allSlots.length} slots)`);
  }

  console.log(`\nDone. Seeded ${salonCount} salons, ${svcCount} services, ${slotCount} slots.`);
  console.log(`Remove anytime:  npx tsx scripts/seed-coiffeur-rails.ts --clean`);
}

main().catch((e) => { console.error(e); process.exit(1); });
