/**
 * Mockup-scope: whole-page
 *
 * exists-check: npm run exists "week calendar" and npm run exists "day grid" both returned
 * 0 matches (run 2026-08-18). Net new, so this is not a redraw of an existing surface.
 *
 * Grounded-in: app/[locale]/dev/terminal/loadTerminalData.ts (the query shape this file copies,
 * widened from a 2-day window to a 7-day one) and app/[locale]/dev/terminal/status.ts (the one
 * indication system, not reused with a new meaning on this page since no block here needs a
 * live status tone).
 *
 * Operator screen (TERMINAL_PRINCIPLES.md): a week strip plus a day grid for the merchant
 * terminal, proposed so a stylist's chair time and the shop's FREE time are both visible as
 * space, not only as a list of rows. See WeekScreen.tsx for the argument and the numbers.
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 *
 * DATA: real rows for the terminal salon. Bookings span the next 7 Zurich days from today.
 * Staff and the one seeded in-chair walk-in come from the live tables. The two "not a booking"
 * blocks (a lunch break, a stylist gone for the day) have no table yet, so WeekScreen hardcodes
 * them and the page's own footer names that.
 */
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import { TERMINAL_SALON_ID } from "../terminal/loadTerminalData";
import WeekScreen, {
  type WeekBooking,
  type WeekStaffMember,
  type WeekWalkIn,
} from "./WeekScreen";

function zurichTodayDateStr(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

interface BookingRow {
  id: string;
  starts_at: string;
  status: string;
  guest_name: string | null;
  services: { name_de: string; name_en: string; duration_minutes: number | null } | { name_de: string; name_en: string; duration_minutes: number | null }[] | null;
  staff_members: { id: string; name: string } | { id: string; name: string }[] | null;
}

interface WalkInRow {
  id: string;
  customer_name: string;
  started_at: string | null;
  assigned_barber_id: string | null;
  services: { name_de: string; name_en: string; duration_minutes: number | null } | { name_de: string; name_en: string; duration_minutes: number | null }[] | null;
}

interface StaffRow {
  id: string;
  name: string;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function TerminalWeekPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const admin = createAdminSupabaseClient();
  const todayStr = zurichTodayDateStr();
  const weekStart = zurichWallClockToUtc(todayStr, 0, 0);
  const weekEnd = zurichWallClockToUtc(addDaysToDateStr(todayStr, 7), 0, 0);

  let salonName = "The Fade Factory";
  let bookings: WeekBooking[] = [];
  let staff: WeekStaffMember[] = [];
  let walkIns: WeekWalkIn[] = [];

  try {
    const [{ data: salonRow }, { data: bookingRows }, { data: staffRows }, { data: walkInRows }] =
      await Promise.all([
        admin.from("salons").select("name").eq("id", TERMINAL_SALON_ID).single(),
        admin
          .from("bookings")
          .select(
            "id, starts_at, status, guest_name, services(name_de, name_en, duration_minutes), staff_members(id, name)"
          )
          .eq("salon_id", TERMINAL_SALON_ID)
          .gte("starts_at", weekStart.toISOString())
          .lt("starts_at", weekEnd.toISOString())
          .order("starts_at", { ascending: true }),
        admin
          .from("staff_members")
          .select("id, name")
          .eq("salon_id", TERMINAL_SALON_ID)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        // The one wired case of "a walk-in currently in a chair": whatever is genuinely
        // in_chair right now for this salon. Zero rows here means the block simply does not
        // render, never a fabricated stand-in.
        admin
          .from("barber_walkin_queue")
          .select(
            "id, customer_name, started_at, assigned_barber_id, services(name_de, name_en, duration_minutes)"
          )
          .eq("salon_id", TERMINAL_SALON_ID)
          .eq("status", "in_chair"),
      ]);

    if (salonRow?.name) salonName = salonRow.name;

    bookings = ((bookingRows ?? []) as BookingRow[]).map((row) => {
      const service = one(row.services);
      const member = one(row.staff_members);
      return {
        id: row.id,
        startsAt: row.starts_at,
        customerName: row.guest_name ?? "Guest",
        serviceName: service?.name_en ?? service?.name_de ?? "Service",
        durationMinutes: service?.duration_minutes ?? 30,
        staffId: member?.id ?? null,
      };
    });

    staff = ((staffRows ?? []) as StaffRow[]).map((row) => ({ id: row.id, name: row.name }));

    walkIns = ((walkInRows ?? []) as WalkInRow[])
      .filter((row) => row.started_at && row.assigned_barber_id)
      .map((row) => {
        const service = one(row.services);
        return {
          id: row.id,
          customerName: row.customer_name,
          serviceName: service?.name_en ?? service?.name_de ?? "Service",
          startedAt: row.started_at as string,
          durationMinutes: service?.duration_minutes ?? 30,
          staffId: row.assigned_barber_id as string,
        };
      });
  } catch (err) {
    console.error("[terminal-week] failed to load salon terminal data:", err);
    bookings = [];
    staff = [];
    walkIns = [];
  }

  return (
    <WeekScreen
      salonName={salonName}
      staff={staff}
      bookings={bookings}
      walkIns={walkIns}
      todayStr={todayStr}
    />
  );
}
