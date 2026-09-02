export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, bearerVerifyLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinJoinSchema } from "@/lib/validations";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";
import { joinWalkinQueue } from "@/lib/walkin/join";
import { resolveRequestUser } from "@/lib/auth/request-user";

// GET /api/walkin/queue?salon_id=... — Public: current queue summary
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Walk-in must be enabled for this salon (Phase 2 de-gate: was barbershop-only).
  const { data: salon } = await admin
    .from("salons").select("id, walkin_enabled").eq("id", salonId).single();
  if (!(salon as any)?.walkin_enabled) {
    return NextResponse.json({ error: "Walk-in is not enabled for this salon" }, { status: 403 });
  }

  // Get active queue entries
  const { data: queue } = await admin
    .from("barber_walkin_queue")
    .select("id, customer_name, position, status, estimated_wait_minutes, joined_at, preferred_barber_id")
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"])
    .order("position", { ascending: true });

  // Count active barbers (staff currently assigned)
  const { data: activeStaff } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true);

  const waiting = (queue ?? []).filter((q) => q.status === "waiting");
  const inChair = (queue ?? []).filter((q) => q.status === "in_chair");

  // Get avg service duration for wait estimate
  const { data: services } = await admin
    .from("services")
    .select("duration_minutes")
    .eq("salon_id", salonId)
    .eq("is_active", true);
  const avgDuration = services?.length
    ? Math.round(services.reduce((s, sv) => s + sv.duration_minutes, 0) / services.length)
    : 30;

  const currentWait = estimateWaitMinutes(
    waiting.length,
    avgDuration,
    activeStaff?.length ?? 1
  );

  return NextResponse.json({
    queue: waiting,
    inChair,
    currentWait,
    queueLength: waiting.length,
    activeBarbers: activeStaff?.length ?? 0,
  });
}

// POST /api/walkin/queue — Public: join queue
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkinJoinSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Walk-in must be ENABLED for this salon (any category — not just barbershops),
  // and not currently paused. (Phase 2 de-gate: was `categories.includes('barbershop')`.)
  const { data: salon } = await admin
    .from("salons").select("id, walkin_enabled, walkin_paused, walkin_mode, timezone").eq("id", validated.salon_id).single();
  if (!(salon as any)?.walkin_enabled) {
    return NextResponse.json({ error: "Walk-in is not enabled for this salon" }, { status: 403 });
  }
  if ((salon as any).walkin_paused) {
    return NextResponse.json({ error: "This shop has paused new walk-ins right now" }, { status: 409 });
  }
  // Pay-first shops can't be joined for free — the queue number is gated on payment
  // (the customer goes /pay-intent → /confirm, which creates the entry). Block the
  // free-join path so a pay_first shop's line can't be jumped without paying.
  if ((salon as any).walkin_mode === "pay_first") {
    return NextResponse.json({ error: "This shop requires payment to join the line", code: "PAYMENT_REQUIRED" }, { status: 402 });
  }

  // Capture customer_id if logged in (guest = null). resolveRequestUser resolves the caller
  // from either the web session cookie or an iOS `Authorization: Bearer <token>` header,
  // verifying the token server-side against the Supabase Auth server. Without this, a logged-in
  // app customer joining the queue fell through to the guest branch below (customerId stayed
  // null), so their own ticket never carried their user id and would not show as theirs. An
  // invalid/expired Bearer token returns its own 401 from resolveRequestUser and must NEVER
  // fall through here to a null (anonymous) customerId, same contract as app/api/bookings/route.ts.
  if (req.headers.get("Authorization")) {
    const authFlood = await applyRateLimit(bearerVerifyLimiter, { ip: getClientIp(req) });
    if (authFlood) return authFlood;
  }
  const resolvedUser = await resolveRequestUser(req);
  if (resolvedUser instanceof NextResponse) return resolvedUser;
  const customerId = resolvedUser.user?.id ?? null;

  // Race-safe insert via the shared helper (atomic position retry).
  const result = await joinWalkinQueue(admin, {
    salonId: validated.salon_id,
    customerId,
    customerName: validated.customer_name,
    customerPhone: validated.customer_phone ?? null,
    serviceId: validated.service_id ?? null,
    preferredBarberId: validated.preferred_barber_id ?? null,
    joinMethod: validated.join_method,
  });
  if (!result) {
    return NextResponse.json({ error: "Could not join the queue, please try again" }, { status: 503 });
  }

  return NextResponse.json({
    entry: result.entry,
    trackingToken: result.trackingToken,
    position: result.position,
    estimatedWait: result.estimatedWait,
    ticketCode: result.ticketCode,
    trackingUrl: `/queue/${result.trackingToken}`,
  });
}
