export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch staff member with salon info
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("*, salons(name, slug, categories)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Fetch portfolio, services, and reviews in parallel
  const [portfolioRes, servicesRes, reviewsRes] = await Promise.all([
    supabase
      .from("staff_portfolio_images")
      .select("id, image_url, sort_order, created_at")
      .eq("staff_id", id)
      .order("sort_order", { ascending: true })
      .limit(30),
    supabase
      .from("staff_services")
      .select("service_id, services(id, name_de, name_en, duration_minutes, price)")
      .eq("staff_member_id", id),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_photos(id, photo_url)")
      .eq("staff_member_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    staff: {
      id: staff.id,
      name: staff.name,
      avatar_url: staff.avatar_url,
      specialties: staff.specialties,
      bio: staff.bio,
      instagram_url: staff.instagram_url,
      years_experience: staff.years_experience,
      average_rating: staff.average_rating,
      review_count: staff.review_count,
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
