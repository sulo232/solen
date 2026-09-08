export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { isSalonHidden, loadSalonDetailWithAccess } from "@/lib/salon-detail";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const salonSlug = request.nextUrl.searchParams.get("salon_slug")?.trim() || null;
  const accessResult = salonSlug
    ? await loadSalonDetailWithAccess(salonSlug)
    : null;

  if (salonSlug && !accessResult) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // A private slug-bound request has already passed the shared owner/admin Store gate.
  // Only that path uses the server-only client, so hidden previews can load the same profile.
  // Public rows stay on the request client, and the salon_id predicate prevents cross-Store reads.
  const db = accessResult?.isOwnerView ? createAdminSupabaseClient() : supabase;

  // Fetch staff member with salon info. is_active/listed_on_marketplace/is_test added to
  // the salons embed (security review, 2026-09-04): this route only ever filtered
  // staff_members.is_active, so a staff member of a hidden (unlisted/test/inactive) salon
  // still had their bio, portfolio, services and reviews served publicly. Explicit column
  // list (not "*"): the fields this handler's response actually reads below.
  let staffQuery = db
    .from("staff_members")
    .select(
      "id, salon_id, name, avatar_url, specialties, languages, bio, instagram_url, years_experience, appointments_completed, clients_served, salons(name, slug, categories, is_active, listed_on_marketplace, is_test)"
    )
    .eq("id", id)
    .eq("is_active", true);
  if (accessResult) {
    staffQuery = staffQuery.eq("salon_id", accessResult.salon.id);
  }
  const { data: staff, error } = await staffQuery.single();

  if (error || !staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Unbound callers retain the public-only behavior. Slug-bound callers have already passed
  // loadSalonDetailWithAccess, including the hidden owner/admin preview decision.
  if (!staff.salons || (!accessResult && isSalonHidden(staff.salons))) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Fetch portfolio, services, and reviews in parallel
  const [portfolioRes, servicesRes, reviewsRes, ratingRes] = await Promise.all([
    db
      .from("staff_portfolio_images")
      .select("id, image_url, sort_order, created_at")
      .eq("staff_id", id)
      .order("sort_order", { ascending: true })
      .limit(30),
    db
      .from("staff_services")
      .select("service_id, services!inner(id, name_de, name_en, name_fr, name_it, duration_minutes, price, is_active)")
      .eq("staff_member_id", id)
      .eq("services.is_active", true),
    db
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_photos(id, photo_url)")
      .eq("staff_member_id", id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("staff_ratings_view")
      .select("average_rating, review_count")
      .eq("staff_id", staff.id).maybeSingle(),
  ]);
  if (ratingRes.error) console.error("[staff/profile] rating lookup failed:", ratingRes.error);
  const rating = ratingRes.error ? null : ratingRes.data;

  return NextResponse.json({
    staff: {
      id: staff.id,
      name: staff.name,
      avatar_url: staff.avatar_url,
      specialties: staff.specialties,
      languages: staff.languages,
      bio: staff.bio,
      instagram_url: staff.instagram_url,
      years_experience: staff.years_experience,
      average_rating: rating?.average_rating ?? null,
      review_count: rating?.review_count ?? null,
      appointments_completed: staff.appointments_completed,
      clients_served: staff.clients_served,
      salon_name: staff.salons?.name,
      salon_slug: staff.salons?.slug,
      salon_categories: staff.salons?.categories,
    },
    portfolio: portfolioRes.data ?? [],
    services: (servicesRes.data ?? [])
      .map((ss: Record<string, unknown>) => {
        const service = ss.services as Record<string, unknown> | null;
        if (!service) return null;
        const publicService = { ...service };
        delete publicService.is_active;
        return publicService;
      })
      .filter(Boolean),
    reviews: reviewsRes.data ?? [],
  }, accessResult?.isOwnerView
    ? { headers: { "Cache-Control": "private, no-store" } }
    : undefined);
}
