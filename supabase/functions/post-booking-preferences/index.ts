// Edge Function: post-booking-preferences
// Triggered by database webhook on INSERT into bookings
// Updates user_preferences after each booking

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record; // the new booking row

    if (!record?.id) {
      return new Response("No record", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch booking with salon + service data
    const { data: booking } = await supabase
      .from("bookings")
      .select("user_id, salon_id, service_id, salons(quartier), services(name_de, category)")
      .eq("id", record.id)
      .single();

    if (!booking) return new Response("Booking not found", { status: 404 });

    const userId = booking.user_id;
    const quartier = (booking.salons as { quartier: string } | null)?.quartier;
    const serviceName = (booking.services as { name_de: string } | null)?.name_de ?? "";

    // Fetch existing preferences
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const quartierCounts: Record<string, number> = existing?.quartier_visit_counts ?? {};
    if (quartier) {
      quartierCounts[quartier] = (quartierCounts[quartier] ?? 0) + 1;
    }

    // Sort favorite quartiers by count
    const favoriteQuartiersIds = Object.entries(quartierCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([q]) => q);

    // Update favorite services
    const favServices: string[] = existing?.favorite_service_slugs ?? [];
    if (serviceName && !favServices.includes(serviceName)) {
      favServices.unshift(serviceName);
    }

    await supabase.from("user_preferences").upsert({
      user_id: userId,
      quartier_visit_counts: quartierCounts,
      favorite_quartier_ids: favoriteQuartiersIds,
      favorite_service_slugs: favServices.slice(0, 10),
      last_booked_service: serviceName,
    }, { onConflict: "user_id" });

    // If this is user's first booking, flip is_first_visit_default
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_first_visit_default")
      .eq("id", userId)
      .single();

    if (profile?.is_first_visit_default === true) {
      await supabase
        .from("profiles")
        .update({ is_first_visit_default: false })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("post-booking-preferences error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
