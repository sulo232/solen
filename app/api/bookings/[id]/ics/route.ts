export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { buildBookingIcs } from "@/lib/ics";
import { localizedField } from "@/lib/i18n/localized-field";

const privateHeaders = { "Cache-Control": "private, no-store" };
const unavailable = () => NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });

// Reuses the existing booking-bound customer/Store/admin/guest authorization and ICS builder.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (limited) return limited;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return unavailable();
  const { actor, booking, userId } = await resolveBookingActor(request, id);
  if (!actor || !booking) return unavailable();
  if (userId) {
    const banned = await checkUserBanned(userId);
    if (banned) return banned;
    const userLimited = await applyRateLimit(generalLimiter, { userId });
    if (userLimited) return userLimited;
  }
  // A cancelled/pending booking must not become a CONFIRMED calendar event.
  if (!["confirmed", "completed"].includes(booking.status)) return unavailable();
  const starts = Date.parse(booking.starts_at), ends = Date.parse(booking.ends_at);
  if (!Number.isFinite(starts) || !Number.isFinite(ends) || ends <= starts) return unavailable();

  const admin = createAdminSupabaseClient();
  const [salonResult, serviceResult] = await Promise.all([
    admin.from("salons").select("name, address").eq("id", booking.salon_id).maybeSingle(),
    admin.from("services").select("name_de, name_en, name_fr, name_it").eq("id", booking.service_id).maybeSingle(),
  ]);
  if (salonResult.error || serviceResult.error || !salonResult.data || !serviceResult.data) {
    console.error("[bookings/ics] detail lookup failed", { salonError: salonResult.error, serviceError: serviceResult.error });
    return unavailable();
  }
  let locale = request.nextUrl.searchParams.get("locale");
  if (!locale && userId) {
    const { data, error } = await admin.from("profiles").select("locale").eq("id", userId).maybeSingle();
    if (error) console.error("[bookings/ics] profile locale lookup failed", error);
    locale = data?.locale ?? null;
  }
  const salon = salonResult.data;
  const serviceName = localizedField(serviceResult.data, "name", locale);
  const ics = buildBookingIcs({
    uid: id,
    title: `${serviceName} - ${salon.name}`,
    description: serviceName,
    location: salon.address ? `${salon.name}, ${salon.address}` : salon.name,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
  });
  return new NextResponse(ics, { headers: {
    ...privateHeaders,
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename=solen-${id.slice(0, 8)}.ics`,
  } });
}
