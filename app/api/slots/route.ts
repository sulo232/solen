export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, createSlotSchema } from "@/lib/validations";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/slots?salon_id=&date=&service_id=&staff_member_id=
// (or ?week= for a 7-day window, or ?from=&to= for an explicit range - see below)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salon_id = searchParams.get("salon_id");
  const date = searchParams.get("date"); // YYYY-MM-DD (single day)
  const week = searchParams.get("week"); // YYYY-MM-DD anchor -> 7-day window (dashboard calendar, G3/V3-D421)
  // B2 fix (dashboard calendar month grid): the month view renders up to 42 visible days,
  // which `week=` can never cover (always exactly 7). from/to let a caller ask for the
  // whole visible grid in one request instead of one `week=` call per row. Both required
  // together; `to` is inclusive. Capped at 45 days so a malformed/huge span can't pull the
  // whole table.
  const from = searchParams.get("from"); // YYYY-MM-DD, range start (inclusive)
  const to = searchParams.get("to"); // YYYY-MM-DD, range end (inclusive)
  // Round 3 fix: from/to alone still returns raw rows, and PostgREST caps an unspecified
  // query at 1000 rows, so a busy salon's 42-day window (4k-47k rows measured live) came back
  // truncated to whatever 7 days happened to fit in the first 1000, with no signal that it was
  // cut. summary=1 skips rows entirely and asks slot_day_status_summary for a per-day
  // total/available/booked/blocked count instead, which is also all the month grid ever needed.
  const summary = searchParams.get("summary") === "1";
  const service_id = searchParams.get("service_id");
  const staff_member_id = searchParams.get("staff_member_id");

  const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
  const hasRange = Boolean(from && to);

  if (!salon_id || (!date && !week && !hasRange)) {
    return NextResponse.json(
      { message: "salon_id and (date or week or from+to) are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (hasRange && (!YMD_RE.test(from as string) || !YMD_RE.test(to as string))) {
    return NextResponse.json(
      { message: "from/to must be YYYY-MM-DD", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // 1..45 day span cap applies to BOTH the summary and the row-returning from/to path (a
  // malformed/huge span shouldn't be able to pull the whole table either way).
  if (hasRange) {
    const [fy, fm, fd] = (from as string).split("-").map(Number);
    const [ty, tm, td] = (to as string).split("-").map(Number);
    const fromDate = new Date(Date.UTC(fy, fm - 1, fd));
    const toDateExclusive = new Date(Date.UTC(ty, tm - 1, td + 1)); // `to` is inclusive
    const spanDays = (toDateExclusive.getTime() - fromDate.getTime()) / 86400000;
    if (!(spanDays > 0) || spanDays > 45) {
      return NextResponse.json(
        { message: "from/to span must be between 1 and 45 days", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
  }

  // Summary path: per-day counts only, never rows. Round 4: the desktop month grid needs the
  // booked/available/blocked breakdown back (it renders three status dots, an owner-approved
  // look that must not change), so this calls slot_day_status_summary (day, total, available,
  // booked, blocked), not the plainer slot_day_summary from round 3. See
  // supabase/migrations/20260904220000_slot_day_summary.sql for both functions (SECURITY
  // DEFINER, counts only, no row-level fields).
  if (hasRange && summary) {
    // "as any": slot_day_status_summary is applied live (confirmed via a direct REST rpc call
    // before wiring this) but the generated Database types have not been regenerated yet, so
    // tsc does not know this RPC name. Same escape hatch the codebase already uses for a
    // function ahead of its generated types (discovery_feed_v2 in
    // app/api/discovery/feed/route.ts). Drop the cast once types are regenerated.
    const { data: days, error: rpcError } = await supabase.rpc("slot_day_status_summary" as any, {
      p_salon_id: salon_id,
      p_from: from,
      p_to: to,
    });
    if (rpcError) {
      console.error("[slots] slot_day_status_summary RPC failed:", rpcError.message);
      return NextResponse.json({ message: rpcError.message, code: "DB_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ days: days ?? [] });
  }

  // Build time range: single day (`date`), a 7-day window (`week` anchor), or an explicit
  // from/to range. Date.UTC handles month/year rollover TZ-stably; comparison strings stay
  // naive (matches the stored starts_at format / prior single-day behavior).
  let startOfRange: string;
  let endOfRange: string;
  if (hasRange) {
    const [fy, fm, fd] = (from as string).split("-").map(Number);
    const [ty, tm, td] = (to as string).split("-").map(Number);
    const toDateExclusive = new Date(Date.UTC(ty, tm - 1, td + 1)); // `to` is inclusive
    startOfRange = `${from}T00:00:00`;
    endOfRange = `${toDateExclusive.toISOString().slice(0, 10)}T00:00:00`;
  } else {
    const anchor = (week ?? date) as string;
    const span = week ? 7 : 1;
    const [ay, am, ad] = anchor.split("-").map(Number);
    const endDate = new Date(Date.UTC(ay, am - 1, ad + span));
    startOfRange = `${anchor}T00:00:00`;
    endOfRange = `${endDate.toISOString().slice(0, 10)}T00:00:00`;
  }

  // Column allowlist: this GET has no auth check, so a client-supplied salon_id can be
  // queried by anyone. select("*") used to also return booked_by/booking_id/client_id
  // (customer-identifying columns) to any unauthenticated caller. Only the scheduling +
  // price-quote fields the calendar UI renders are selected here.
  let query = supabase
    .from("availability_slots")
    .select("id, salon_id, service_id, staff_member_id, starts_at, ends_at, status, price_override, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)")
    .eq("salon_id", salon_id)
    .gte("starts_at", startOfRange)
    .lt("starts_at", endOfRange)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);
  // Round 3 fix: an explicit cap on the row-returning from/to path so a large-window request
  // can never silently return an incomplete page with no signal (see `truncated` below). The
  // week/date path is untouched: a single day or a 7-day window never approaches 1000 rows.
  if (hasRange) query = query.limit(1000);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Apply off-peak discounts to matching slots
  const slots = data ?? [];
  if (date && slots.length > 0) {
    const slotDate = new Date(date + "T00:00:00");
    const dayOfWeek = slotDate.getDay();

    const { data: offPeakRules } = await supabase
      .from("off_peak_slots")
      .select("start_time, end_time, discount_percent")
      .eq("salon_id", salon_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (offPeakRules && offPeakRules.length > 0) {
      // off_peak_slots.start_time/end_time are Zurich wall-clock; starts_at is a true UTC
      // instant, so compare in Europe/Zurich, not a raw UTC string slice (was matching
      // the wrong window whenever CH offset != 0, e.g. every slot during CEST).
      const zurichTimeFmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Zurich",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      for (const slot of slots) {
        const slotTime = zurichTimeFmt.format(new Date(slot.starts_at as string));
        const match = offPeakRules.find(
          (r) => slotTime >= r.start_time.slice(0, 5) && slotTime < r.end_time.slice(0, 5)
        );
        const basePrice = (slot as any).price_override ?? (slot as any).services?.price;
        if (match && basePrice) {
          (slot as any).discounted_price = Math.round(
            basePrice * (1 - match.discount_percent / 100)
          );
          (slot as any).off_peak_discount = match.discount_percent;
        }
      }
    }
  }

  // `slots` alias: the dashboard calendar reads `data.slots`; `items` kept for back-compat.
  // `truncated: true` fires only on the from/to path when the explicit 1000-row cap above was
  // actually hit, so a caller building a full list (never the month grid, which uses summary=1)
  // knows the result is not the whole range instead of silently getting a partial answer.
  const truncated = hasRange && slots.length >= 1000;
  return NextResponse.json({ items: slots, slots, total: slots.length, ...(truncated ? { truncated: true } : {}) });
}

// POST /api/slots — create ONE availability slot (dashboard SlotCreateModal).
// Body: { date: "YYYY-MM-DD", start_time: "HH:MM", service_id, staff_member_id?: uuid|null }.
// No salon_id by design: it's derived from the service, then ownership is verified. ends_at is
// computed from the service's duration_minutes. New slots are always status='available'.
// The modal ignores the body and re-fetches via loadSlots(); we still return { slot } (the
// G1 GET contract) so callers/tests can read the created row.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error("[slots] POST invalid JSON body:", err);
    return NextResponse.json({ message: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { data: validated, error: valError } = validateBody(createSlotSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { date, start_time, service_id, staff_member_id } = validated;

  // 1. Resolve the service -> its salon + duration. service_id is NOT NULL on the slot table,
  //    so a valid, existing service is mandatory. salon_id is taken from the service (the modal
  //    never sends it) which also means a slot can only ever attach to the service's own salon.
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, salon_id, duration_minutes")
    .eq("id", service_id)
    .single();
  if (serviceError || !service) {
    return NextResponse.json({ message: "Service not found", code: "SERVICE_NOT_FOUND" }, { status: 404 });
  }

  // 2. Ownership: the caller MUST own the service's salon. Never create a slot for a salon you
  //    don't own. RLS (slots_manage_owner) is the DB-level backstop; this returns a clean 403.
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", service.salon_id)
    .single();
  if (salonError || !salon) {
    return NextResponse.json({ message: "Salon not found", code: "SALON_NOT_FOUND" }, { status: 404 });
  }
  if (salon.owner_id !== user.id) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // 2b. staff_member_id (when supplied) must belong to the same salon as the service,
  //     otherwise a slot can cross-reference another salon's staff and pollute that
  //     salon's analytics (bookings/reviews there are only filtered by staff_member_id).
  if (staff_member_id) {
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", staff_member_id)
      .eq("salon_id", service.salon_id)
      .single();
    if (!staffMember) {
      return NextResponse.json({ message: "staff_member_id does not belong to this salon", code: "STAFF_SALON_MISMATCH" }, { status: 400 });
    }
  }

  // 3. Compute starts_at / ends_at. The owner picks a Zurich wall-clock date+time in the
  //    dashboard; convert it to the true UTC instant the cron and every consumer assume
  //    (zurichWallClockToUtc, DST-safe) instead of storing the naive wall-clock as if it
  //    were already UTC.
  const duration = service.duration_minutes ?? 60;
  const [startH, startM] = start_time.split(":").map(Number);
  const startDate = zurichWallClockToUtc(date, startH, startM);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ message: "Invalid date/time", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const endDate = new Date(startDate.getTime() + duration * 60000);
  const startsAt = startDate.toISOString();
  const endsAt = endDate.toISOString();

  // 4. Insert one available slot via the RLS client (slots_manage_owner gates it again).
  const { data: slot, error: insertError } = await supabase
    .from("availability_slots")
    .insert({
      salon_id: service.salon_id,
      service_id,
      staff_member_id: staff_member_id ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "available",
    })
    .select("*, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)")
    .single();

  if (insertError) {
    // PostgREST PGRST204 = a column in the payload doesn't exist on the live table (schema
    // drift). Surface it clearly instead of a 500 so the caller knows it's a missing column.
    if (insertError.code === "PGRST204") {
      console.error("[slots] POST schema drift — column missing on availability_slots:", insertError);
      return NextResponse.json(
        { message: `availability_slots is missing a required column: ${insertError.message}`, code: "SCHEMA_DRIFT" },
        { status: 500 },
      );
    }
    console.error("[slots] POST insert failed:", insertError);
    return NextResponse.json({ message: insertError.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ slot }, { status: 201 });
}
