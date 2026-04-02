import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { validateQuery, discoveryFeedSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("discovery");
    if (disabled) return disabled;

    const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;

    const { data: filters, error } = validateQuery(discoveryFeedSchema, req.nextUrl.searchParams);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    // Optional auth for personalization
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const admin = createAdminSupabaseClient();
    let query = admin.from("discovery_items").select("*", { count: "exact" })
      .eq("status", "published")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
    if (filters.gender && filters.gender !== "all") query = query.eq("gender", filters.gender);
    if (filters.texture) query = query.eq("texture", filters.texture);
    if (filters.style) query = query.eq("style_name", filters.style);
    if (filters.creator) query = query.ilike("author_name", `%${filters.creator}%`);
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,style_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Gender-aware: if user is female, suppress beard
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("disc_gender").eq("id", userId).single();
      if (profile?.disc_gender === "female" && (!filters.category || filters.category === "all")) {
        query = query.neq("category", "beard");
      }
    }

    // Pagination
    const limit = filters.limit;
    const offset = (filters.page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error: dbError, count } = await query;
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page: filters.page,
      limit,
      has_more: (count ?? 0) > offset + limit,
    });
  } catch (e: any) {
    // Graceful fallback when Supabase admin client can't be created
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      limit: 30,
      has_more: false,
    });
  }
}
