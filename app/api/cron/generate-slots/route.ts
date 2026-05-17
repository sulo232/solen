export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

// Cron: Generate availability_slots from staff_schedules. Nightly.
// Bridges staff_schedules → availability_slots for the next 30 days.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get all active salons (include categories for nail station limiting)
  const { data: salons } = await admin
    .from("salons")
    .select("id, categories")
    .eq("is_active", true);

  let totalGenerated = 0;

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

      // Default to 60 min slots if no services assigned
      const slotDuration = staffServices?.[0]
        ? ((staffServices[0].services as any)?.duration_minutes ?? 60) + ((staffServices[0].services as any)?.buffer_minutes ?? 0)
        : 60;

      // Generate slots for next 30 days
      for (let d = new Date(now); d < thirtyDaysFromNow; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay(); // 0=Sun

        // Skip closures and time off
        if (closureDates.has(dateStr) || offDates.has(dateStr)) continue;

        // Find schedule for this day
        const schedule = schedules.find((s) => s.day_of_week === dayOfWeek);
        if (!schedule) continue;

        // Check alternate week parity if applicable
        if (schedule.is_alternate_week) {
          const weekNum = Math.floor((d.getTime() - new Date("2026-01-05").getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weekNum % 2 !== (schedule.alternate_week_parity ?? 0)) continue;
        }

        // Generate time slots
        const [startH, startM] = schedule.start_time.split(":").map(Number);
        const [endH, endM] = schedule.end_time.split(":").map(Number);

        let slotStart = new Date(d);
        slotStart.setHours(startH, startM, 0, 0);

        const dayEnd = new Date(d);
        dayEnd.setHours(endH, endM, 0, 0);

        // Get breaks for this day
        const dayBreaks = (breaks ?? []).filter((b) => b.day_of_week === dayOfWeek);

        while (slotStart.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          // Skip if overlaps with a break
          const overlapsBreak = dayBreaks.some((b) => {
            const [bsH, bsM] = b.start_time.split(":").map(Number);
            const [beH, beM] = b.end_time.split(":").map(Number);
            const breakStart = new Date(d);
            breakStart.setHours(bsH, bsM, 0, 0);
            const breakEnd = new Date(d);
            breakEnd.setHours(beH, beM, 0, 0);
            return slotStart < breakEnd && slotEnd > breakStart;
          });

          if (!overlapsBreak) {
            // Check if slot already exists
            const { data: existing } = await admin
              .from("availability_slots")
              .select("id")
              .eq("salon_id", salon.id)
              .eq("staff_member_id", staff.id)
              .eq("starts_at", slotStart.toISOString())
              .single();

            if (!existing) {
              await admin.from("availability_slots").insert({
                salon_id: salon.id,
                staff_member_id: staff.id,
                service_id: staffServices?.[0]?.service_id ?? null,
                starts_at: slotStart.toISOString(),
                ends_at: slotEnd.toISOString(),
                status: "available",
              });
              totalGenerated++;
            }
          }

          slotStart = slotEnd;
        }
      }
    }
  }

  // Post-processing: station limiting for nail salons
  // Block excess concurrent slots when more staff slots exist than physical stations
  for (const salon of salons ?? []) {
    if (!salon.categories?.includes("nails")) continue;
    try {
      const { data: stationConfig } = await admin
        .from("nail_stations").select("station_count, sterilization_buffer_minutes")
        .eq("salon_id", salon.id).single();
      if (!stationConfig) continue;

      const stationCount = stationConfig.station_count;
      const bufferMs = (stationConfig.sterilization_buffer_minutes || 0) * 60 * 1000;

      // Get all future available slots for this salon
      const { data: slots } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at")
        .eq("salon_id", salon.id)
        .eq("status", "available")
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true });

      if (!slots?.length) continue;

      // For each slot, count how many other slots overlap it (including buffer)
      // If concurrent count > station_count, block the excess
      for (const slot of slots) {
        const slotStart = new Date(slot.starts_at);
        const slotEndBuffered = new Date(new Date(slot.ends_at).getTime() + bufferMs);
        const concurrent = slots.filter((s) => {
          if (s.id === slot.id) return false;
          const sStart = new Date(s.starts_at);
          const sEnd = new Date(s.ends_at);
          return sStart < slotEndBuffered && sEnd > slotStart;
        });
        // +1 for the slot itself
        if (concurrent.length + 1 > stationCount) {
          await admin.from("availability_slots")
            .update({ status: "blocked" })
            .eq("id", slot.id);
        }
      }
    } catch (err) {
      // Station check failure must NEVER break slot generation for other salons
      console.error(`[generate-slots] Station limiting failed for salon ${salon.id}:`, err);
    }
  }

  // Post-processing: chair limiting for barbershops
  for (const salon of salons ?? []) {
    if (!salon.categories?.includes("barbershop")) continue;
    try {
      const { data: chairConfig } = await admin
        .from("barber_chairs").select("chair_count, buffer_minutes")
        .eq("salon_id", salon.id).single();
      if (!chairConfig) continue;

      const chairCount = chairConfig.chair_count;
      const bufferMs = (chairConfig.buffer_minutes || 0) * 60 * 1000;

      const { data: slots } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at")
        .eq("salon_id", salon.id)
        .eq("status", "available")
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true });

      if (!slots?.length) continue;

      for (const slot of slots) {
        const slotStart = new Date(slot.starts_at);
        const slotEndBuffered = new Date(new Date(slot.ends_at).getTime() + bufferMs);
        const concurrent = slots.filter((s) => {
          if (s.id === slot.id) return false;
          const sStart = new Date(s.starts_at);
          const sEnd = new Date(s.ends_at);
          return sStart < slotEndBuffered && sEnd > slotStart;
        });
        if (concurrent.length + 1 > chairCount) {
          await admin.from("availability_slots")
            .update({ status: "blocked" })
            .eq("id", slot.id);
        }
      }
    } catch (err) {
      console.error(`[generate-slots] Chair limiting failed for salon ${salon.id}:`, err);
    }
  }

  return NextResponse.json({ generated: totalGenerated });
}
