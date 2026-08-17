// exists-check: net-new vs lib/referral/code.ts (unrelated), grep confirmed no other
// "loadTerminalData" symbol in the repo. Extracted verbatim from the query that used to
// live inline in page.tsx (round 1 of this mockup), so three direction routes (a/b/c) can
// import ONE data loader instead of three copies drifting apart.
//
// Dev-only data loader for the merchant terminal mockup. Not used in production code paths.

import { createAdminSupabaseClient } from "@/lib/supabase";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import type { TerminalBooking, TerminalQueueEntry, TerminalStaff } from "./Terminal";

export const TERMINAL_SALON_ID = "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f";

// Supabase embeds a to-one relation as an object OR (depending on client typing) a 1-item array.
// Normalise both shapes to a single object or null.
function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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
  ends_at: string;
  status: string;
  guest_name: string | null;
  estimated_price: number | null;
  payment_status: string | null;
  created_at: string;
  // arrived_at has existed on bookings since 2026-06-23 with ZERO write sites anywhere in the
  // product: 1 row of 984 carries a value. It is the column the counter needs and nobody has ever
  // been able to set. The terminal is the screen that sets it.
  arrived_at: string | null;
  services: { name_de: string; name_en: string } | { name_de: string; name_en: string }[] | null;
  staff_members:
    | { id: string; name: string; avatar_url: string | null }
    | { id: string; name: string; avatar_url: string | null }[]
    | null;
}

interface QueueRow {
  id: string;
  customer_name: string;
  status: string;
  position: number;
  ticket_code: string;
  estimated_wait_minutes: number | null;
  // Confirmed on the LIVE table, not assumed from a type: barber_walkin_queue carries joined_at.
  // Without it the screen can only repeat the estimate it gave, never notice the estimate was wrong.
  joined_at: string | null;
  started_at: string | null;
  // duration_minutes is a real column on `services`, confirmed on the live table. Without it the
  // board can say who is in a chair but never when that chair frees, which is the one thing the
  // person at the counter is actually asked all day.
  services:
    | { name_de: string; name_en: string; duration_minutes: number | null }
    | { name_de: string; name_en: string; duration_minutes: number | null }[]
    | null;
  staff_members:
    | { id: string; name: string; avatar_url: string | null }
    | { id: string; name: string; avatar_url: string | null }[]
    | null;
}

interface StaffRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface TerminalData {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

export async function loadTerminalData(): Promise<TerminalData> {
  const admin = createAdminSupabaseClient();
  const dateStr = zurichTodayDateStr();
  const dayStart = zurichWallClockToUtc(dateStr, 0, 0);
  const dayEnd = zurichWallClockToUtc(addDaysToDateStr(dateStr, 1), 0, 0);

  let bookings: TerminalBooking[] = [];
  let queue: TerminalQueueEntry[] = [];
  let staff: TerminalStaff[] = [];
  let salonName = "The Fade Factory";

  try {
    const [{ data: salonRow }, { data: bookingRows }, { data: queueRows }, { data: staffRows }] =
      await Promise.all([
        admin.from("salons").select("name").eq("id", TERMINAL_SALON_ID).single(),
        admin
          .from("bookings")
          .select(
            "id, starts_at, ends_at, status, guest_name, estimated_price, payment_status, created_at, arrived_at, services(name_de, name_en), staff_members(id, name, avatar_url)"
          )
          .eq("salon_id", TERMINAL_SALON_ID)
          .gte("starts_at", dayStart.toISOString())
          .lt("starts_at", dayEnd.toISOString())
          .order("starts_at", { ascending: true }),
        admin
          .from("barber_walkin_queue")
          .select(
            "id, customer_name, status, position, ticket_code, estimated_wait_minutes, joined_at, started_at, services(name_de, name_en, duration_minutes), staff_members!assigned_barber_id(id, name, avatar_url)"
          )
          .eq("salon_id", TERMINAL_SALON_ID)
          .in("status", ["waiting", "in_chair"])
          .order("position", { ascending: true }),
        admin
          .from("staff_members")
          .select("id, name, avatar_url")
          .eq("salon_id", TERMINAL_SALON_ID)
          .eq("is_active", true),
      ]);

    if (salonRow?.name) salonName = salonRow.name;

    bookings = ((bookingRows ?? []) as BookingRow[]).map((row) => {
      const service = one(row.services);
      const member = one(row.staff_members);
      return {
        id: row.id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        customerName: row.guest_name ?? "Guest",
        serviceName: service?.name_en ?? service?.name_de ?? "Service",
        price: row.estimated_price ?? 0,
        paymentStatus: row.payment_status ?? "none",
        createdAt: row.created_at,
        arrivedAt: row.arrived_at,
        staffId: member?.id ?? null,
        staffName: member?.name ?? null,
      };
    });

    queue = ((queueRows ?? []) as QueueRow[]).map((row) => {
      const service = one(row.services);
      const member = one(row.staff_members);
      return {
        id: row.id,
        customerName: row.customer_name,
        status: row.status,
        position: row.position,
        ticketCode: row.ticket_code,
        estimatedWaitMinutes: row.estimated_wait_minutes ?? 0,
        joinedAt: row.joined_at,
        startedAt: row.started_at,
        durationMinutes: service?.duration_minutes ?? null,
        serviceName: service?.name_en ?? service?.name_de ?? "Service",
        staffId: member?.id ?? null,
        staffName: member?.name ?? null,
      };
    });

    staff = ((staffRows ?? []) as StaffRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
    }));
  } catch (err) {
    console.error("[loadTerminalData] failed to load salon terminal data:", err);
    bookings = [];
    queue = [];
    staff = [];
  }

  return { salonName, bookings, queue, staff };
}
