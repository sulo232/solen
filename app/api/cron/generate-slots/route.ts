export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import { withCronRun } from "@/lib/cron-run";
import { classifyOverlapBlocks } from "@/lib/slots/overlap";

// Cron: Generate availability_slots from staff_schedules. Nightly.
// Bridges staff_schedules -> availability_slots for the next 30 days.

// staff_schedules times are SWISS WALL-CLOCK. zurichWallClockToUtc (lib/time/zurich)
// resolves wall-clock -> true UTC via the zone offset at that moment (DST-safe), shared
// with the manual dashboard slot-create paths so both write the same instant convention.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("generate-slots", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get all active salons (include categories for nail station limiting)
  const { data: salons } = await admin
    .from("salons")
    .select("id, categories, vacation_start, vacation_end")
    .eq("is_active", true);

  let totalGenerated = 0;
  // RING 3b: lightweight stage timing + counts, returned in `stages` below
  // (passes through withCronRun into the response body for the GH-actions
  // log; cron_runs itself only stores ok/processed/duration_ms/errors).
  let slotsChecked = 0;
  const slotGenStartedAt = Date.now();

  for (const salon of salons ?? []) {
    // Get closures for this salon
    const { data: closures } = await admin
      .from("salon_closures")
      .select("start_date, end_date")
      .eq("salon_id", salon.id)
      .gte("end_date", now.toISOString().split("T")[0]);

    const closureDates = new Set<string>();
    for (const c of closures ?? []) {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        closureDates.add(d.toISOString().split("T")[0]);
      }
    }

    // All salon services (fallback list for staff with no explicit mappings).
    const { data: salonServices } = await admin
      .from("services")
      .select("id, duration_minutes, buffer_minutes")
      .eq("salon_id", salon.id);
    const salonServiceIds = (salonServices ?? []).map((s) => s.id);
    // Per-service duration+buffer, keyed by service_id: used so each generated
    // slot row's ends_at reflects its own service, not one shared per-staff value.
    const salonServiceDuration = new Map<string, number>();
    for (const s of salonServices ?? []) {
      salonServiceDuration.set(s.id, (s.duration_minutes ?? 60) + (s.buffer_minutes ?? 0));
    }

    // Get staff members
    const { data: staffMembers } = await admin
      .from("staff_members")
      .select("id")
      .eq("salon_id", salon.id)
      .eq("is_active", true);

    for (const staff of staffMembers ?? []) {
      // Get schedule
      const { data: schedules } = await admin
        .from("staff_schedules")
        .select("*")
        .eq("staff_member_id", staff.id);

      if (!schedules?.length) continue;

      // Get time off
      const { data: timeOff } = await admin
        .from("staff_time_off")
        .select("start_date, end_date")
        .eq("staff_member_id", staff.id)
        .eq("status", "approved")
        .gte("end_date", now.toISOString().split("T")[0]);

      const offDates = new Set<string>();
      for (const to of timeOff ?? []) {
        const start = new Date(to.start_date);
        const end = new Date(to.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          offDates.add(d.toISOString().split("T")[0]);
        }
      }

      // Get breaks
      const { data: breaks } = await admin
        .from("staff_breaks")
        .select("day_of_week, start_time, end_time")
        .eq("staff_member_id", staff.id);

      // Get services assigned to this staff member
      const { data: staffServices } = await admin
        .from("staff_services")
        .select("service_id, services(duration_minutes, buffer_minutes)")
        .eq("staff_member_id", staff.id);

      // Default to 60 min slots if no services assigned (grid step only; each row's
      // own ends_at below is derived per-service, see the duration map)
      const slotDuration = staffServices?.[0]
        ? ((staffServices[0].services as any)?.duration_minutes ?? 60) + ((staffServices[0].services as any)?.buffer_minutes ?? 0)
        : 60;

      // Per-service duration+buffer for this staff member's mapped services.
      const staffServiceDuration = new Map<string, number>();
      for (const s of staffServices ?? []) {
        staffServiceDuration.set(s.service_id, ((s.services as any)?.duration_minutes ?? 60) + ((s.services as any)?.buffer_minutes ?? 0));
      }

      // Generate slots for next 30 days
      for (let d = new Date(now); d < thirtyDaysFromNow; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay(); // 0=Sun

        // Skip closures, time off, and the salon's vacation range
        const onVacation = !!(salon.vacation_start && salon.vacation_end && dateStr >= salon.vacation_start && dateStr <= salon.vacation_end);
        if (closureDates.has(dateStr) || offDates.has(dateStr) || onVacation) continue;

        // Find schedule for this day. is_working defaults to true, so treat
        // null/undefined as working; only an explicit false skips generation.
        const schedule = schedules.find((s) => s.day_of_week === dayOfWeek && s.is_working !== false);
        if (!schedule) continue;

        // Check alternate week parity if applicable
        if (schedule.is_alternate_week) {
          const weekNum = Math.floor((d.getTime() - new Date("2026-01-05").getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weekNum % 2 !== (schedule.alternate_week_parity ?? 0)) continue;
        }

        // Generate time slots (schedule times are Zurich wall-clock, see helper above)
        const [startH, startM] = schedule.start_time.split(":").map(Number);
        const [endH, endM] = schedule.end_time.split(":").map(Number);

        let slotStart = zurichWallClockToUtc(dateStr, startH, startM);
        const dayEnd = zurichWallClockToUtc(dateStr, endH, endM);

        // Get breaks for this day
        const dayBreaks = (breaks ?? []).filter((b) => b.day_of_week === dayOfWeek);

        while (slotStart.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          // Skip slots already in the past (today's earlier hours) so the cron never
          // (re)generates bookable inventory for a time that has already passed.
          if (slotStart.getTime() <= now.getTime()) {
            slotStart = slotEnd;
            continue;
          }

          // Skip if overlaps with a break
          const overlapsBreak = dayBreaks.some((b) => {
            const [bsH, bsM] = b.start_time.split(":").map(Number);
            const [beH, beM] = b.end_time.split(":").map(Number);
            const breakStart = zurichWallClockToUtc(dateStr, bsH, bsM);
            const breakEnd = zurichWallClockToUtc(dateStr, beH, beM);
            return slotStart < breakEnd && slotEnd > breakStart;
          });

          if (!overlapsBreak) {
            // One row PER mapped service (the consumer booking API resolves by
            // salon+service+starts_at; first-service-only rows 409'd every other
            // service). Matches the seed shape: N service rows per time.
            // service_id is NOT NULL; staff with no mappings can do ALL salon
            // services (same convention as the booking staff filter).
            const serviceIds: string[] = staffServices?.length
              ? staffServices.map((s) => s.service_id)
              : salonServiceIds;
            if (!serviceIds.length) { slotStart = slotEnd; continue; }

            slotsChecked++;
            // Existing rows for this staff+time (any service) in one query.
            const { data: existingRows } = await admin
              .from("availability_slots")
              .select("service_id")
              .eq("salon_id", salon.id)
              .eq("staff_member_id", staff.id)
              .eq("starts_at", slotStart.toISOString());
            const existingSvc = new Set((existingRows ?? []).map((r) => r.service_id));

            const missing = serviceIds.filter((id) => !existingSvc.has(id));
            if (missing.length) {
              await admin.from("availability_slots").insert(
                missing.map((service_id) => {
                  // ends_at from THIS service's own duration+buffer, not the shared
                  // per-staff slotDuration (staff-service order is nondeterministic,
                  // so slot[0]'s duration was stamping every other service wrong).
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
              totalGenerated += missing.length;
            }
          }

          slotStart = slotEnd;
        }
      }
    }
  }

  const slotGenerationElapsedMs = Date.now() - slotGenStartedAt;

  // Post-processing: station limiting for nail salons
  // Block excess concurrent slots when more staff slots exist than physical stations
  //
  // Re-evaluated every pass: availability_slots.block_reason distinguishes this pass's
  // own blocks ('capacity') from a salon-owner manual block ('manual') or a vacation
  // block ('vacation'). Before recomputing, this salon's prior capacity blocks are
  // reverted back to available so the pass re-decides from a clean slate; manual/
  // vacation blocks are never touched (different block_reason), and booked slots are
  // never touched (different status).
  let nailSlotsChecked = 0;
  let nailSlotsBlocked = 0;
  const nailStartedAt = Date.now();

  for (const salon of salons ?? []) {
    if (!salon.categories?.includes("nails")) continue;
    try {
      const { data: stationConfig } = await admin
        .from("nail_stations").select("station_count, sterilization_buffer_minutes")
        .eq("salon_id", salon.id).single();
      if (!stationConfig) continue;

      const stationCount = stationConfig.station_count;
      const bufferMs = (stationConfig.sterilization_buffer_minutes || 0) * 60 * 1000;

      // Revert this cron's own prior capacity blocks before re-applying the limit, so
      // this pass recomputes over the current concurrency instead of accumulating
      // forever. Scoped identically to the slot fetch below (same salon_id + future
      // window). Only rows THIS pass authored (status='blocked' AND
      // block_reason='capacity') are touched.
      const { error: revertErr } = await admin
        .from("availability_slots")
        .update({ status: "available", block_reason: null })
        .eq("salon_id", salon.id)
        .eq("status", "blocked")
        .eq("block_reason", "capacity")
        .gte("starts_at", now.toISOString());
      if (revertErr) console.error("[generate-slots] nail capacity-block revert failed for salon " + salon.id + ":", revertErr.message);

      // Get all future available slots for this salon
      const { data: slots } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at")
        .eq("salon_id", salon.id)
        .eq("status", "available")
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true });

      if (!slots?.length) continue;

      nailSlotsChecked += slots.length;

      // RING 3b: the O(n^2) all-pairs scan (for each slot, filter the whole
      // array for overlap) is replaced by an O(n log n) sort + bounded-window
      // classification. Same "concurrent count + 1 > capacity" decision per
      // slot, same blocked-id set; see lib/slots/overlap.ts for the preserved
      // predicate and scripts/ring3b-kill-test.ts for the equivalence proof
      // (old O(n^2) logic copied verbatim vs this call, diffed on synthetic
      // + randomized inputs).
      const blockedIds = classifyOverlapBlocks(slots, bufferMs, stationCount);
      nailSlotsBlocked += blockedIds.size;
      for (const id of blockedIds) {
        const { error: blockErr } = await admin.from("availability_slots")
          .update({ status: "blocked", block_reason: "capacity" })
          .eq("id", id);
        if (blockErr) console.error("[generate-slots] nail capacity block failed for salon " + salon.id + " slot " + id + ":", blockErr.message);
      }
    } catch (err) {
      // Station check failure must NEVER break slot generation for other salons
      console.error(`[generate-slots] Station limiting failed for salon ${salon.id}:`, err);
    }
  }

  const nailElapsedMs = Date.now() - nailStartedAt;

  // Post-processing: chair limiting for barbershops
  // Same re-evaluate-every-pass approach as the nail-station pass above: revert this
  // cron's own prior capacity blocks ('capacity') before recomputing, never touching
  // manual ('manual') or vacation ('vacation') blocks or booked slots.
  let barberSlotsChecked = 0;
  let barberSlotsBlocked = 0;
  const barberStartedAt = Date.now();

  for (const salon of salons ?? []) {
    if (!salon.categories?.includes("barbershop")) continue;
    try {
      const { data: chairConfig } = await admin
        .from("barber_chairs").select("chair_count, buffer_minutes")
        .eq("salon_id", salon.id).single();
      if (!chairConfig) continue;

      const chairCount = chairConfig.chair_count;
      const bufferMs = (chairConfig.buffer_minutes || 0) * 60 * 1000;

      // Revert this cron's own prior capacity blocks before re-applying the limit
      // (same reasoning + scope as the nail-station pass above).
      const { error: revertErr } = await admin
        .from("availability_slots")
        .update({ status: "available", block_reason: null })
        .eq("salon_id", salon.id)
        .eq("status", "blocked")
        .eq("block_reason", "capacity")
        .gte("starts_at", now.toISOString());
      if (revertErr) console.error("[generate-slots] barber capacity-block revert failed for salon " + salon.id + ":", revertErr.message);

      const { data: slots } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at")
        .eq("salon_id", salon.id)
        .eq("status", "available")
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true });

      if (!slots?.length) continue;

      barberSlotsChecked += slots.length;

      // RING 3b: same O(n log n) replacement as the nail pass above (identical
      // predicate, see lib/slots/overlap.ts + scripts/ring3b-kill-test.ts).
      const blockedIds = classifyOverlapBlocks(slots, bufferMs, chairCount);
      barberSlotsBlocked += blockedIds.size;
      for (const id of blockedIds) {
        const { error: blockErr } = await admin.from("availability_slots")
          .update({ status: "blocked", block_reason: "capacity" })
          .eq("id", id);
        if (blockErr) console.error("[generate-slots] barber capacity block failed for salon " + salon.id + " slot " + id + ":", blockErr.message);
      }
    } catch (err) {
      console.error(`[generate-slots] Chair limiting failed for salon ${salon.id}:`, err);
    }
  }

  const barberElapsedMs = Date.now() - barberStartedAt;

  return {
    generated: totalGenerated,
    processed: totalGenerated,
    // RING 3b: per-stage timing + counts for the GH-actions cron log (not
    // persisted to cron_runs, which only keeps ok/processed/duration_ms/errors).
    stages: {
      slotGeneration: { elapsedMs: slotGenerationElapsedMs, slotsChecked, slotsInserted: totalGenerated },
      nailCapacity: { elapsedMs: nailElapsedMs, slotsChecked: nailSlotsChecked, slotsBlocked: nailSlotsBlocked },
      barberCapacity: { elapsedMs: barberElapsedMs, slotsChecked: barberSlotsChecked, slotsBlocked: barberSlotsBlocked },
    },
  };
  });
}
