// Supabase Edge Function: post-booking-preferences
// Triggered via database webhook on INSERT into bookings table.
// Updates user_preferences after every new booking.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let record: Record<string, unknown>;
  try {
    const body = await req.json();
    record = body.record ?? body; // webhook wraps in { record: {...} }
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const bookingId = record.id as string;
  const userId    = record.user_id as string;
  const salonId   = record.salon_id as string;

  // Fetch full booking with salon data (quartier)
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, salons(quartier, categories), services(name_de, name_en, category)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return new Response("Booking not found", { status: 404 });
  }

  const salon   = booking.salons as { quartier: string };
  const service = booking.services as { name_de: string; category: string };

  // Fetch existing preferences
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  const quartierCounts: Record<string, number> = (existing?.quartier_visit_counts as Record<string, number>) ?? {};
  quartierCounts[salon.quartier] = (quartierCounts[salon.quartier] ?? 0) + 1;

  // Sort quartiers by visit count descending
  const sortedQuartiers = Object.entries(quartierCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([q]) => q);

  // Update favorite services list
  const favoriteServices: string[] = existing?.favorite_service_slugs ?? [];
  const serviceSlug = service.name_de.toLowerCase().replace(/\s+/g, "-");
  const filteredServices = favoriteServices.filter((s: string) => s !== serviceSlug);
  filteredServices.unshift(serviceSlug);

  // Upsert preferences
  await supabase
    .from("user_preferences")
    .upsert({
      user_id:                userId,
      favorite_quartier_ids:  sortedQuartiers,
      favorite_service_slugs: filteredServices.slice(0, 10),
      quartier_visit_counts:  quartierCounts,
      last_booked_service:    serviceSlug,
    }, { onConflict: "user_id" });

  // If first booking ever, flip is_first_visit_default to false
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 1) {
    await supabase
      .from("profiles")
      .update({ is_first_visit_default: false })
      .eq("id", userId);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
