export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// exists-check: net-new vs app/api/salon/retail/route.ts because `npm run exists bundles`
// found NO bundles API endpoint (only the service_bundles table + /dev mockup). This
// mirrors the retail GET public-read shape ({ bundles: [...] }) for the new PDP section.
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { computeBundlePriceChf } from "@/lib/pricing/bundle";

// GET /api/salon/bundles?salon_id=xxx , Public: list ACTIVE service bundles for a salon.
//
// A5 Phase B-3. Uses the anon/session server client so the Postgres RLS on
// service_bundles + service_bundle_items does the visibility gating (active
// bundle AND marketplace-visible salon, see migration
// 20260703090001_service_bundles_a5.sql). We do NOT use the admin client here:
// the RLS marketplace-visibility predicate is the security boundary a hidden or
// test salon relies on, and the admin client would bypass it.
//
// Price is computed AT READ from the live services.price (CHF decimal) per the
// plan, never denormalized. The child join returns each service's name +
// duration + price so the client can render the struck sum + bundle price.
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();

  // Bundles for this salon (RLS restricts to is_active + marketplace-visible salon).
  const { data: bundles, error: bundlesError } = await supabase
    .from("service_bundles")
    .select("id, name, pricing_mode, custom_price, percent_off, sort_order")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });

  if (bundlesError) {
    console.error("[api/salon/bundles] bundles query failed:", bundlesError.message);
    return NextResponse.json({ error: bundlesError.message }, { status: 500 });
  }
  if (!bundles?.length) return NextResponse.json({ bundles: [] });

  // Items for these bundles (child RLS joins through the visible parent bundle).
  const bundleIds = bundles.map((b) => b.id);
  const { data: items, error: itemsError } = await supabase
    .from("service_bundle_items")
    .select("bundle_id, service_id, sort_order")
    .in("bundle_id", bundleIds)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("[api/salon/bundles] items query failed:", itemsError.message);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Live service rows for name + duration + price (CHF decimal). services RLS
  // already restricts to visible salons; we only read the ids referenced above.
  const serviceIds = [...new Set((items ?? []).map((i) => i.service_id))];
  const { data: services, error: servicesError } = serviceIds.length
    ? await supabase
        .from("services")
        .select("id, name_de, name_en, price, duration_minutes")
        .in("id", serviceIds)
    : { data: [], error: null };

  if (servicesError) {
    console.error("[api/salon/bundles] services query failed:", servicesError.message);
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const svcById = new Map((services ?? []).map((s) => [s.id, s]));

  // Assemble each bundle with its ordered services + the computed prices.
  const assembled = bundles
    .map((b) => {
      const bundleServices = (items ?? [])
        .filter((i) => i.bundle_id === b.id)
        .map((i) => svcById.get(i.service_id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .map((s) => ({
          id: s.id,
          name_de: s.name_de,
          name_en: s.name_en,
          price: Number(s.price),
          duration_minutes: s.duration_minutes,
        }));

      // The >=2-items DB trigger gates activation, but defend at read too:
      // a bundle that resolved to <2 live services is never a bookable 0/1-item.
      if (bundleServices.length < 2) return null;

      // A5 FIX-2: price via the SHARED util so the display, booking-write, and pay-intent charge
      // all produce the SAME CHF (2dp) by construction. Anon client here (RLS is the boundary),
      // so only the pure math , the guarded admin load lives in the write/charge paths.
      const sumPrice = bundleServices.reduce((acc, s) => acc + s.price, 0);
      const bundlePrice = computeBundlePriceChf(b.pricing_mode, sumPrice, {
        customPrice: b.custom_price,
        percentOff: b.percent_off,
      });

      return {
        id: b.id,
        name: b.name,
        pricing_mode: b.pricing_mode,
        percent_off: b.percent_off,
        services: bundleServices,
        sum_price: sumPrice,
        bundle_price: bundlePrice,
      };
    })
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  return NextResponse.json({ bundles: assembled });
}
