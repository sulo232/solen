// Ring 2b kill test: next_available_dates RPC (app/api/salons/route.ts) + the
// availability/[salon_id] payload trim (app/api/availability/[salon_id]/route.ts).
//
// The sandboxed shell cannot reach localhost, so this exercises the REAL DB
// against the LIVE database via createAdminSupabaseClient, running the exact
// same queries the two routes now run (not a reimplementation of the route
// logic , the SQL/RPC calls are copy-identical to what the routes execute).
//
// (a) next_available_dates RPC: call it for the 6 busiest salons + a definitely-
//     past cutoff; assert at most 1 row per salon, and that each returned
//     next_date matches a manual "earliest available slot after cutoff, bucketed
//     to the Europe/Zurich calendar day" query run independently per salon.
// (b) availability payload size: run the NEW (post-trim) query shape for the
//     busiest salon (08760993-cdfd-4cc7-ac69-6a2bf8aed383, the Ring 0 baseline
//     salon) and report the serialized byte size vs the measured baseline of
//     458,447 bytes.
//
// Usage: npx tsx scripts/ring2b-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const BASELINE_BYTES = 458447;
const BASELINE_SALON_ID = "08760993-cdfd-4cc7-ac69-6a2bf8aed383";

const zurichDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const toZurichDate = (isoInstant: string) => zurichDateFmt.format(new Date(isoInstant));

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // ── Find the 6 busiest salons (most available future slots), by count-only
  //    HEAD queries , never fetching slot rows just to rank salons. ─────────
  const { data: allSalons, error: salonsErr } = await admin.from("salons").select("id");
  if (salonsErr || !allSalons) {
    console.error("[ring2b-kill-test] could not list salons:", salonsErr?.message);
    process.exit(1);
  }
  const nowIso = new Date().toISOString();
  const counts: { id: string; count: number }[] = [];
  for (const s of allSalons) {
    const { count } = await admin
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", s.id)
      .eq("status", "available")
      .gt("starts_at", nowIso);
    counts.push({ id: s.id, count: count ?? 0 });
  }
  counts.sort((a, b) => b.count - a.count);
  const busiest6 = counts.slice(0, 6).map((c) => c.id);
  console.log("Busiest 6 salons (id : available future slot count):");
  for (const c of counts.slice(0, 6)) console.log(`  ${c.id} : ${c.count}`);
  console.log("");

  // ── (a) next_available_dates RPC ────────────────────────────────────────
  const pastCutoff = "2020-01-01T00:00:00Z";
  {
    const { data: rpcRows, error: rpcErr } = await admin.rpc("next_available_dates", {
      p_salon_ids: busiest6,
      p_after: pastCutoff,
    });
    if (rpcErr) {
      allPass = false;
      rows.push({ scenario: "RPC call succeeds", pass: false, details: { error: rpcErr.message } });
    } else {
      const rpcRowsTyped = (rpcRows ?? []) as Array<{ salon_id: string; next_date: string }>;
      const perSalonCount = new Map<string, number>();
      for (const r of rpcRowsTyped) perSalonCount.set(r.salon_id, (perSalonCount.get(r.salon_id) ?? 0) + 1);
      const atMostOnePass = [...perSalonCount.values()].every((n) => n <= 1);
      if (!atMostOnePass) allPass = false;
      rows.push({
        scenario: "RPC returns <=1 row per salon",
        pass: atMostOnePass,
        details: { rowCount: rpcRowsTyped.length, perSalonCount: Object.fromEntries(perSalonCount) },
      });

      // Manual cross-check: earliest available slot per salon after the cutoff,
      // bucketed to the Europe/Zurich calendar day (bounded 1-row query per salon,
      // not a full-table pull , this is a per-salon MIN(starts_at) check, not the
      // antipattern being fixed).
      let manualMatchPass = true;
      const mismatches: Record<string, unknown>[] = [];
      for (const salonId of busiest6) {
        const { data: earliest } = await admin
          .from("availability_slots")
          .select("starts_at")
          .eq("salon_id", salonId)
          .eq("status", "available")
          .gt("starts_at", pastCutoff)
          .order("starts_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        const manualDate = earliest ? toZurichDate(earliest.starts_at) : null;
        const rpcRow = rpcRowsTyped.find((r) => r.salon_id === salonId);
        const rpcDate = rpcRow?.next_date ?? null;
        if (manualDate !== rpcDate) {
          manualMatchPass = false;
          mismatches.push({ salonId, manualDate, rpcDate });
        }
      }
      if (!manualMatchPass) allPass = false;
      rows.push({
        scenario: "RPC next_date matches manual MIN(starts_at) per salon (Zurich-bucketed)",
        pass: manualMatchPass,
        details: manualMatchPass ? { busiest6Count: busiest6.length } : { mismatches },
      });
    }
  }

  // ── (b) availability payload size (NEW post-trim shape) ────────────────
  {
    const date_from = new Date().toISOString();
    const date_to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: allSlots, error: slotsErr }, { data: salonServices }, { data: salonStaff }] = await Promise.all([
      admin
        .from("availability_slots")
        .select("id, starts_at, ends_at, service_id, staff_member_id, status, price_override")
        .eq("salon_id", BASELINE_SALON_ID)
        .gte("starts_at", date_from)
        .lte("starts_at", date_to)
        .order("starts_at", { ascending: true }),
      admin.from("services").select("id, name_de, name_en, duration_minutes, price").eq("salon_id", BASELINE_SALON_ID),
      admin.from("staff_members").select("id, name, avatar_url").eq("salon_id", BASELINE_SALON_ID),
    ]);

    if (slotsErr || !allSlots) {
      allPass = false;
      rows.push({ scenario: "availability payload measurable", pass: false, details: { error: slotsErr?.message } });
    } else {
      const services: Record<string, unknown> = {};
      for (const s of salonServices ?? []) services[s.id] = { name_de: s.name_de, name_en: s.name_en, duration_minutes: s.duration_minutes, price: s.price };
      const staff: Record<string, unknown> = {};
      for (const m of salonStaff ?? []) staff[m.id] = { name: m.name, avatar_url: m.avatar_url };

      const grouped: Record<string, unknown[]> = {};
      const dateHasAvailable = new Set<string>();
      const allDatesWithSlots = new Set<string>();
      for (const slot of allSlots) {
        const d = toZurichDate(slot.starts_at);
        allDatesWithSlots.add(d);
        if (slot.status === "available") {
          dateHasAvailable.add(d);
          if (!grouped[d]) grouped[d] = [];
          grouped[d]!.push(slot);
        }
      }
      const fully_booked_dates = [...allDatesWithSlots].filter((d) => !dateHasAvailable.has(d));

      const responseBody = { data: grouped, fully_booked_dates, services, staff };
      const newBytes = Buffer.byteLength(JSON.stringify(responseBody), "utf8");
      const delta = newBytes - BASELINE_BYTES;
      const pctChange = ((delta / BASELINE_BYTES) * 100).toFixed(1);
      const pass = newBytes < BASELINE_BYTES;
      if (!pass) allPass = false;
      rows.push({
        scenario: "trimmed availability payload smaller than baseline",
        pass,
        details: {
          salonId: BASELINE_SALON_ID,
          slotCount: allSlots.length,
          serviceCount: Object.keys(services).length,
          staffCount: Object.keys(staff).length,
          baselineBytes: BASELINE_BYTES,
          newBytes,
          delta,
          pctChange: `${pctChange}%`,
        },
      });
    }
  }

  console.log("Ring 2b kill test: next_available_dates RPC + availability/[salon_id] payload trim\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring2b-kill-test] threw:", err);
  process.exit(1);
});
