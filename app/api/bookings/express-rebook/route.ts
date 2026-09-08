export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, expressRebookSchema } from "@/lib/validations";
import { localizedField } from "@/lib/i18n/localized-field";

// POST /api/bookings/express-rebook — One-tap rebook: find next available slot
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(expressRebookSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { rebook_from_booking_id } = validated;

  const admin = createAdminSupabaseClient();

  // Caller's own locale (A9-email-locale pattern): this response's serviceName goes straight
  // to the caller who is currently logged in, so their profile.locale is the source of truth.
  const { data: callerProfile } = await admin.from("profiles").select("locale").eq("id", user.id).maybeSingle();
  const locale = (callerProfile?.locale as "de" | "en" | "fr" | "it") ?? "de";

  // Fetch source booking. rebook_from_booking_id is optional in the schema (lib/validations.ts);
  // when missing, this .eq() cannot match a row and the existing `if (!source)` 404 below
  // handles it, same as before typing (type-only cast, no new branch).
  const { data: source } = await admin
    .from("bookings")
    .select("id, salon_id, service_id, staff_member_id, price_paid, services(name_de, name_en, name_fr, name_it, duration_minutes), staff_members(name)")
    .eq("id", rebook_from_booking_id as string)
    .eq("user_id", user.id)
    .single();

  if (!source) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const service = source.services as any;
  const staff = source.staff_members as any;

  // Find next available slot for this barber + service
  const now = new Date();
  let { data: slot } = await admin
    .from("availability_slots")
    .select("id, starts_at, ends_at")
    .eq("salon_id", source.salon_id)
    // postgrest-js's eq() type requires NonNullable, but the cast doesn't touch the runtime
    // value: a null staff_member_id still sends eq.null over the wire (PostgREST IS-NULL
    // match), byte-identical to pre-typing behavior.
    .eq("staff_member_id", source.staff_member_id as string)
    .eq("status", "available")
    .gt("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let fallbackBarber = false;

  // If preferred barber unavailable, find any available barber
  if (!slot) {
    const { data: anySlot } = await admin
      .from("availability_slots")
      .select("id, starts_at, ends_at, staff_member_id, staff_members(name)")
      .eq("salon_id", source.salon_id)
      .eq("status", "available")
      .gt("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anySlot) {
      slot = anySlot;
      fallbackBarber = true;
    }
  }

  if (!slot) {
    return NextResponse.json({ error: "No available slots" }, { status: 404 });
  }

  const suggestedDate = new Date(slot.starts_at);

  // Format date and time in Europe/Zurich so the label the customer sees
  // matches the slot's local time, regardless of the server's timezone.
  const zurichTimeFmt = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Format date as YYYY-MM-DD (Intl gives DD.MM.YYYY in de-CH, so use en-CA for ISO)
  const zurichDateIsoFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" });

  return NextResponse.json({
    suggestedSlot: {
      slotId: slot.id,
      date: zurichDateIsoFmt.format(suggestedDate),
      time: zurichTimeFmt.format(suggestedDate),
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
    },
    serviceId: source.service_id,
    serviceName: service ? localizedField(service, "name", locale) || null : null,
    staffId: source.staff_member_id,
    staffName: staff?.name ?? null,
    price: source.price_paid,
    fallbackBarber,
    sourceBookingId: source.id,
  });
}
