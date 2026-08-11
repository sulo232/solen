// Seeds real availability_slots for the next 9 days so the homepage "Diese Woche
// verfügbar" rail (AvailableThisWeek, app/[locale]/_components/homepage/salonCardData.ts:203)
// clears its floor of 2 rows. Root cause (live-DB probed 2026-08-02): the production
// `generate-slots` cron (app/api/cron/generate-slots/route.ts) is the ONLY thing that keeps
// availability_slots rolling forward, and it hard-requires CRON_SECRET, which is not set in
// this dev env (.env.local edits need asking per project rules, so it stays unset here). Its
// cron_runs history is effectively empty (1 row total, across every cron job), so the slots
// generated at initial seed time (~2026-03-08) are now almost entirely in the past relative
// to "now". Of the 20 active/marketplace/non-test salons, only Pink Petal Nails (nails)
// happened to have fresh forward slots (a prior one-off run), which is why the probed
// /api/salons?date=... count was exactly 1.
//
// This script writes the SAME row shape the cron writes (salon_id, staff_member_id,
// service_id, starts_at/ends_at via the shared Zurich wall-clock helper, status: 'available'),
// driven entirely by each target salon's REAL staff_schedules + staff_services rows (no
// invented hours), for the next 9 days (headroom above the rail's 7-day window). Same
// precedent as scripts/seed-voucher-credit-test-data.ts, which documents the identical
// CRON_SECRET constraint and takes the identical direct-insert approach for one salon; this
// generalizes it to 8 salons spread across all 4 categories (coiffeur, barbershop, nails,
// spa) so the four "Top <category>" rails and the density floor benefit too, not just the
// single homepage rail.
//
// Additive only: no schema changes, no new salons/services/staff, only new availability_slots
// rows. Idempotent: checks (salon_id, staff_member_id, service_id, starts_at) before each
// insert, exactly like the cron, so re-running never duplicates.
//
// Usage: npx tsx scripts/seed-availability-this-week.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// 2026-08-11: raised from 9 to 30, the same horizon the cron itself uses. Owner: "fic the days
// sh too thn". The whole table had gone into the past again (newest slot 2026-08-10 15:45 UTC,
// measured against a live count of 21,373 rows of which ZERO were in the future), so every date in
// the picker returned nothing and every availability lookup 404'd. A 9-day window only rescues the
// first week of a calendar that offers a month.
const DAYS_AHEAD = 30;

// 8 real active salons, 2 per category, chosen because none of them (unlike Pink Petal
// Nails) already had forward availability. All verified live: is_active/listed_on_marketplace/
// !is_test, real staff_schedules covering Mon-Sat, real staff_services mappings, no
// nail_stations/barber_chairs capacity config (so the cron's capacity-limiting pass would be
// a no-op for these anyway) and no salon_closures/staff_time_off/staff_breaks in the way.
const TARGET_SALON_IDS = [
  "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89", // Atelier Haarwerk (coiffeur)
  "e34402f4-2986-4f63-8487-b09645395c65", // Glow Lab Basel (coiffeur)
  "63e581dd-2b0e-4910-b4a5-543bc1e157f6", // Blade & Stone (barbershop)
  "5784b1ab-7314-437a-a608-01a729f02cdd", // Cuts & Culture (barbershop)
  "07ff40e7-1f3b-4031-837b-6f48b7425257", // La Belle Ongle (nails)
  "6204df70-3635-45cc-ab2c-898674e198e7", // Nail Lounge Basel (nails)
  "1a07334e-4bd5-4fff-83b0-93cc49bd796d", // Belle Epil (spa)
  "23a8c8f8-4c9e-457a-a176-4b3c2881842a", // Lisse Studio (spa)
];

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const { zurichWallClockToUtc } = await import("@/lib/time/zurich");
  const admin = createAdminSupabaseClient();

  const now = new Date();
  const horizon = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

  const { data: salons, error: salonErr } = await admin
    .from("salons")
    .select("id, name, categories, is_active, is_test, listed_on_marketplace")
    .in("id", TARGET_SALON_IDS);
  if (salonErr) throw salonErr;
  if (!salons || salons.length !== TARGET_SALON_IDS.length) {
    console.error("[seed] expected", TARGET_SALON_IDS.length, "salons, found", salons?.length ?? 0);
    process.exit(1);
  }
  for (const s of salons) {
    if (!s.is_active || s.is_test || !s.listed_on_marketplace) {
      console.error(`[seed] ${s.name} (${s.id}) is not active/marketplace/non-test, refusing to seed`);
      process.exit(1);
    }
  }

  let totalCreated = 0;
  const perSalonCreated: Record<string, number> = {};

  for (const salon of salons) {
    perSalonCreated[salon.id] = 0;

    const { data: staffMembers, error: staffErr } = await admin
      .from("staff_members")
      .select("id, name")
      .eq("salon_id", salon.id)
      .eq("is_active", true);
    if (staffErr) throw staffErr;

    const { data: salonServices, error: svcErr } = await admin
      .from("services")
      .select("id, duration_minutes, buffer_minutes")
      .eq("salon_id", salon.id)
      .eq("is_active", true);
    if (svcErr) throw svcErr;
    const salonServiceIds = (salonServices ?? []).map((s) => s.id);
    const salonServiceDuration = new Map<string, number>();
    for (const s of salonServices ?? []) {
      salonServiceDuration.set(s.id, (s.duration_minutes ?? 60) + (s.buffer_minutes ?? 0));
    }

    for (const staff of staffMembers ?? []) {
      const { data: schedules, error: schedErr } = await admin
        .from("staff_schedules")
        .select("day_of_week, start_time, end_time, is_working, is_alternate_week, alternate_week_parity")
        .eq("staff_member_id", staff.id);
      if (schedErr) throw schedErr;
      if (!schedules?.length) continue;

      const { data: staffServices, error: ssErr } = await admin
        .from("staff_services")
        .select("service_id, services(duration_minutes, buffer_minutes)")
        .eq("staff_member_id", staff.id);
      if (ssErr) throw ssErr;

      const slotDuration = staffServices?.[0]
        ? ((staffServices[0].services as { duration_minutes?: number; buffer_minutes?: number } | null)?.duration_minutes ?? 60) +
          ((staffServices[0].services as { duration_minutes?: number; buffer_minutes?: number } | null)?.buffer_minutes ?? 0)
        : 60;

      const staffServiceDuration = new Map<string, number>();
      for (const s of staffServices ?? []) {
        const svc = s.services as { duration_minutes?: number; buffer_minutes?: number } | null;
        staffServiceDuration.set(s.service_id, (svc?.duration_minutes ?? 60) + (svc?.buffer_minutes ?? 0));
      }

      for (let d = new Date(now); d < horizon; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getUTCDay(); // 0=Sun, matches staff_schedules.day_of_week convention

        const schedule = schedules.find((s) => s.day_of_week === dayOfWeek && s.is_working !== false);
        if (!schedule) continue;
        if (schedule.is_alternate_week) {
          const weekNum = Math.floor((d.getTime() - new Date("2026-01-05").getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weekNum % 2 !== (schedule.alternate_week_parity ?? 0)) continue;
        }

        const [startH, startM] = schedule.start_time.split(":").map(Number);
        const [endH, endM] = schedule.end_time.split(":").map(Number);
        let slotStart = zurichWallClockToUtc(dateStr, startH, startM);
        const dayEnd = zurichWallClockToUtc(dateStr, endH, endM);

        while (slotStart.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          if (slotStart.getTime() <= now.getTime()) {
            slotStart = slotEnd;
            continue;
          }

          const serviceIds: string[] = staffServices?.length
            ? staffServices.map((s) => s.service_id)
            : salonServiceIds;
          if (!serviceIds.length) {
            slotStart = slotEnd;
            continue;
          }

          const { data: existingRows, error: existErr } = await admin
            .from("availability_slots")
            .select("service_id")
            .eq("salon_id", salon.id)
            .eq("staff_member_id", staff.id)
            .eq("starts_at", slotStart.toISOString());
          if (existErr) throw existErr;
          const existingSvc = new Set((existingRows ?? []).map((r) => r.service_id));

          const missing = serviceIds.filter((id) => !existingSvc.has(id));
          if (missing.length) {
            const { error: insErr } = await admin.from("availability_slots").insert(
              missing.map((service_id) => {
                const duration = staffServiceDuration.get(service_id) ?? salonServiceDuration.get(service_id) ?? slotDuration;
                return {
                  salon_id: salon.id,
                  staff_member_id: staff.id,
                  service_id,
                  starts_at: slotStart.toISOString(),
                  ends_at: new Date(slotStart.getTime() + duration * 60000).toISOString(),
                  status: "available",
                };
              }),
            );
            if (insErr) throw insErr;
            totalCreated += missing.length;
            perSalonCreated[salon.id] += missing.length;
          }

          slotStart = slotEnd;
        }
      }
    }
    console.log(`[seed] ${salon.name} (${salon.categories?.join(",")}): +${perSalonCreated[salon.id]} slots`);
  }

  console.log(`[seed] total availability_slots created: ${totalCreated} (0 means already seeded from a prior run)`);

  // Verification read: distinct salon_ids with an available slot in the next 7 days,
  // same RPC the homepage rail calls.
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: rpcRows, error: rpcErr } = await admin.rpc("salons_with_slot_in_hours", {
    p_start_hour: 0,
    p_end_hour: 24,
    p_from: now.toISOString(),
    p_to: weekFromNow.toISOString(),
  });
  if (rpcErr) throw rpcErr;
  const distinctIds = [...new Set((rpcRows ?? []).map((r: { salon_id: string }) => r.salon_id))];
  console.log(`[seed] salons_with_slot_in_hours (next 7d, matches the homepage RPC): ${distinctIds.length} distinct salons`);
  console.log(distinctIds);
}

main().catch((e) => {
  console.error("[seed] FAILED:", e);
  process.exit(1);
});
