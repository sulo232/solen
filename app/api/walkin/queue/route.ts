export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinJoinSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

// GET /api/walkin/queue?salon_id=... — Public: current queue summary
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Verify barbershop category
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("id", salonId).single();
  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
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

  // Verify barbershop
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("id", validated.salon_id).single();
  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
  }

  // Get current max position
  const { data: lastEntry } = await admin
    .from("barber_walkin_queue")
    .select("position")
    .eq("salon_id", validated.salon_id)
    .in("status", ["waiting", "in_chair"])
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (lastEntry?.position ?? 0) + 1;
  const trackingToken = nanoid(12);

  // Estimate wait
  const { data: waitingCount } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", validated.salon_id)
    .eq("status", "waiting");

  const { data: activeStaff } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", validated.salon_id)
    .eq("is_active", true);

  const estimatedWait = estimateWaitMinutes(
    (waitingCount as any) ?? 0,
    30, // default avg
    activeStaff?.length ?? 1
  );

  // Check if user is authenticated
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const customerId = session?.user?.id ?? null;

  const { data: entry, error } = await admin
    .from("barber_walkin_queue")
    .insert({
      salon_id: validated.salon_id,
      customer_id: customerId,
      customer_name: validated.customer_name,
      customer_phone: validated.customer_phone ?? null,
      service_id: validated.service_id ?? null,
      preferred_barber_id: validated.preferred_barber_id ?? null,
      position,
      estimated_wait_minutes: estimatedWait,
      tracking_token: trackingToken,
      join_method: validated.join_method,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    entry,
    trackingToken,
    position,
    estimatedWait,
    trackingUrl: `/queue/${trackingToken}`,
  });
}
