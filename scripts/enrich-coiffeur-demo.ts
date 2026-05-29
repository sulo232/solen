/**
 * enrich-coiffeur-demo.ts
 *
 * Adds priced services + near-future availability slots to the 3 EXISTING real
 * coiffeur demo salons that currently have none (Salon Lumière, Haarsalon Margot,
 * Studio Schnittkunst). This makes every card on /coiffeur show "ab CHF X" + the
 * next-slot pill (the V3-D371 booking-intent card), instead of only Atelier
 * Haarwerk (the one salon that already had service + slot data).
 *
 * Touches salons that ALREADY exist — does NOT create fake salons. Slots carry
 * `service_id` (the API attaches slots to services via .in("service_id", ...)).
 *
 * Run:    npx tsx scripts/enrich-coiffeur-demo.ts
 * Clean:  npx tsx scripts/enrich-coiffeur-demo.ts --clean   (removes only the
 *         services + slots this script added to those 3 salons)
 *
 * Idempotent: re-running first clears the 3 salons' services+slots, then re-adds.
 * These 3 salons had ZERO services before this script, so clearing is safe.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const i = t.indexOf("=");
    if (i === -1) return;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CLEAN = process.argv.includes("--clean");

type Svc = { name_de: string; name_en: string; price: number; duration: number };
const TARGETS: { slug: string; services: Svc[] }[] = [
  { slug: "salon-lumiere", services: [
    { name_de: "Damenschnitt", name_en: "Women's cut", price: 80, duration: 60 },
    { name_de: "Herrenschnitt", name_en: "Men's cut", price: 50, duration: 30 },
    { name_de: "Coloration", name_en: "Color", price: 130, duration: 120 },
  ] },
  { slug: "haarsalon-margot", services: [
    { name_de: "Damenschnitt", name_en: "Women's cut", price: 70, duration: 60 },
    { name_de: "Coloration", name_en: "Color", price: 140, duration: 120 },
    { name_de: "Balayage", name_en: "Balayage", price: 180, duration: 150 },
  ] },
  { slug: "studio-schnittkunst", services: [
    { name_de: "Herrenschnitt", name_en: "Men's cut", price: 45, duration: 30 },
    { name_de: "Damenschnitt", name_en: "Women's cut", price: 75, duration: 60 },
    { name_de: "Strähnen", name_en: "Highlights", price: 160, duration: 130 },
  ] },
];

/** Future 30-min+ slots over the next 5 days at a few times — only > now. */
function futureSlots(salonId: string, serviceId: string, durationMin: number) {
  const out: Record<string, unknown>[] = [];
  const now = Date.now();
  const HOURS = [10, 12, 14, 16, 18];
  for (let day = 0; day < 5; day++) {
    const base = new Date();
    base.setDate(base.getDate() + day);
    if (base.getDay() === 0) continue; // skip Sunday
    for (const h of HOURS) {
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, 0, 0, 0);
      if (start.getTime() <= now + 30 * 60 * 1000) continue;
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
  let svcTotal = 0;
  let slotTotal = 0;

  for (const t of TARGETS) {
    const { data: salon } = await supabase
      .from("salons").select("id, name").eq("slug", t.slug).maybeSingle();
    if (!salon?.id) { console.error(`  ! salon not found: ${t.slug}`); continue; }
    const salonId = salon.id as string;

    // Idempotent: clear this salon's services + slots first (they had none originally).
    await supabase.from("availability_slots").delete().eq("salon_id", salonId);
    await supabase.from("services").delete().eq("salon_id", salonId);

    if (CLEAN) { console.log(`  - cleared ${salon.name}`); continue; }

    const { data: svcRows, error: svcErr } = await supabase
      .from("services")
      .insert(t.services.map((s) => ({
        salon_id: salonId,
        name_de: s.name_de, name_en: s.name_en,
        category: "coiffeur", duration_minutes: s.duration, price: s.price,
        is_active: true,
      })))
      .select("id, duration_minutes");
    if (svcErr || !svcRows) { console.error(`  ! services ${t.slug}:`, svcErr?.message); continue; }
    svcTotal += svcRows.length;

    const slots: Record<string, unknown>[] = [];
    for (const r of svcRows) slots.push(...futureSlots(salonId, r.id as string, (r.duration_minutes as number) ?? 30));
    for (let i = 0; i < slots.length; i += 200) {
      const { error } = await supabase.from("availability_slots").insert(slots.slice(i, i + 200));
      if (error) { console.error(`  ! slots ${t.slug}:`, error.message); break; }
    }
    slotTotal += slots.length;
    console.log(`  + ${salon.name}: ${svcRows.length} services, ${slots.length} slots`);
  }

  if (CLEAN) { console.log("--clean done (services + slots removed from the 3 salons)."); return; }
  console.log(`\nDone. Added ${svcTotal} services + ${slotTotal} slots across ${TARGETS.length} salons.`);
  console.log("Undo:  npx tsx scripts/enrich-coiffeur-demo.ts --clean");
}

main().catch((e) => { console.error(e); process.exit(1); });
