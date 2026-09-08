export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isSalonHidden } from "@/lib/salon-detail";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch staff member with salon info. is_active/listed_on_marketplace/is_test added to
  // the salons embed (security review, 2026-09-04): this route only ever filtered
  // staff_members.is_active, so a staff member of a hidden (unlisted/test/inactive) salon
  // still had their bio, portfolio, services and reviews served publicly. Explicit column
  // list (not "*"): the fields this handler's response actually reads below.
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select(
      "id, name, avatar_url, specialties, languages, bio, instagram_url, years_experience, appointments_completed, clients_served, salons(name, slug, categories, is_active, listed_on_marketplace, is_test)"
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // No owner/admin bypass here on purpose: this is a public read (no session is resolved
  // above), unlike the booking-page/booking-POST gates which have a signed-in caller to check.
  if (!staff.salons || isSalonHidden(staff.salons)) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Fetch portfolio, services, and reviews in parallel
  const [portfolioRes, servicesRes, reviewsRes, ratingRes] = await Promise.all([
    supabase
      .from("staff_portfolio_images")
      .select("id, image_url, sort_order, created_at")
      .eq("staff_id", id)
      .order("sort_order", { ascending: true })
      .limit(30),
    supabase
      .from("staff_services")
      .select("service_id, services(id, name_de, name_en, name_fr, name_it, duration_minutes, price)")
      .eq("staff_member_id", id),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_photos(id, photo_url)")
      .eq("staff_member_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("staff_ratings_view")
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
      .map((ss: Record<string, unknown>) => ss.services)
      .filter(Boolean),
    reviews: reviewsRes.data ?? [],
  });
}
