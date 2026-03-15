import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { SalonProfile } from "@/lib/types";

/**
 * GET /api/salons/[slug]
 * Returns full salon profile with services, staff, reviews, and gallery.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: salon, error } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !salon) {
    return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Fetch services, staff, reviews in parallel
  const [servicesRes, staffRes, reviewsRes] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salon.id).eq("is_active", true),
    supabase.from("staff_members").select("*").eq("salon_id", salon.id).eq("is_active", true),
    supabase
      .from("reviews")
      .select("*, profiles(display_name, avatar_url)")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profile: SalonProfile = {
    ...salon,
    services: servicesRes.data ?? [],
    staff:    staffRes.data   ?? [],
    reviews:  reviewsRes.data ?? [],
  };

  return NextResponse.json(profile);
}
