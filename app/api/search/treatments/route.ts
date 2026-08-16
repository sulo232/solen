export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { SALON_PUBLIC_COLS } from "@/lib/salons/public-columns";
import { minPriceService, MIN_PRICE_SERVICE_COLUMNS, type PricedServiceRow } from "@/lib/min-price-service";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const treatment = searchParams.get("treatment")?.trim();
  const categorySlug = searchParams.get("category_slug")?.trim();
  const city = searchParams.get("city")?.trim();
  const sort = searchParams.get("sort") ?? "rating_desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  if (!treatment && !categorySlug) {
    return NextResponse.json({ message: "treatment or category_slug required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Find matching services
  let serviceQuery = supabase
    .from("services")
    .select(`id, salon_id, category, duration_minutes, ${MIN_PRICE_SERVICE_COLUMNS}`)
    .eq("is_active", true);

  if (treatment) {
    // Strip PostgREST .or() delimiters (commas, parens) from user input so
    // treatment can't break out, mirroring app/api/help/route.ts.
    const safeTreatment = treatment.replace(/[,()]/g, " ");
    serviceQuery = serviceQuery.or(`name_de.ilike.%${safeTreatment}%,name_en.ilike.%${safeTreatment}%`);
  }

  if (categorySlug) {
    // Look up category to find matching service category value
    const { data: cat } = await supabase
      .from("service_categories")
      .select("name_de, slug, level")
      .eq("slug", categorySlug)
      .single();

    if (cat) {
      // If level 1 category, filter by the services.category field directly
      if (cat.level === 1) {
        const categoryValue = cat.slug; // e.g., 'coiffeur'
        serviceQuery = serviceQuery.eq("category", categoryValue);
      }
      // For level 2+3, search by treatment name
      if ((cat.level ?? 0) >= 2) {
        const safeCatName = cat.name_de.replace(/[,()]/g, " ");
        serviceQuery = serviceQuery.or(`name_de.ilike.%${safeCatName}%,name_en.ilike.%${safeCatName}%`);
      }
    }
  }

  const { data: services, error: svcError } = await serviceQuery;

  if (svcError) {
    return NextResponse.json({ message: svcError.message, code: "DB_ERROR" }, { status: 500 });
  }

  if (!services || services.length === 0) {
    return NextResponse.json({ items: [], total: 0, page, limit });
  }

  // Get unique salon IDs
  const salonIds = [...new Set(services.map((s) => s.salon_id))];

  // Fetch salons. Explicit public column allowlist (see lib/salons/public-columns.ts),
  // replaces the old `select('*')` which shipped internal owner/payment/moderation
  // columns (stripe_account_id, owner_id, frozen_reason, rejection_reason, approved_by,
  // warning_count, verification_warnings, score_details, phone) to anonymous clients.
  let salonQuery = supabase
    .from("salons")
    .select(SALON_PUBLIC_COLS, { count: "exact" })
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .in("id", salonIds);

  if (city) {
    salonQuery = salonQuery.ilike("address", `%${city}%`);
  }

  // Apply sorting
  switch (sort) {
    case "price_asc":
      salonQuery = salonQuery.order("average_rating", { ascending: false }); // secondary sort; primary done client-side
      break;
    case "rating_desc":
      salonQuery = salonQuery.order("average_rating", { ascending: false });
      break;
    default:
      salonQuery = salonQuery.order("average_rating", { ascending: false });
  }

  salonQuery = salonQuery.range(offset, offset + limit - 1);

  const { data: salons, error: salonError, count } = await salonQuery;

  if (salonError) {
    return NextResponse.json({ message: salonError.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Enrich each salon with matching treatment info
  const results = (salons ?? []).map((salon) => {
    const matchingServices = services.filter((s) => s.salon_id === salon.id);
    // Same shared rule the salons route and the homepage use. Art. 13 PBV: the from-price this
    // page advertises must name the concrete offer, and the card that renders it printed the
    // "ab" wording with nothing attached until 2026-08-16.
    const { minPrice, names } = minPriceService(matchingServices as PricedServiceRow[]);
    return {
      ...salon,
      matching_services: matchingServices.slice(0, 3),
      min_price: minPrice,
      min_price_service_de: names.de,
      min_price_service_en: names.en,
      min_price_service_fr: names.fr,
      min_price_service_it: names.it,
    };
  });

  // Client-side sort by price if needed
  if (sort === "price_asc") {
    results.sort((a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity));
  }

  return NextResponse.json({ items: results, total: count ?? 0, page, limit });
}
