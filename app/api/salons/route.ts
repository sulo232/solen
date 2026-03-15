import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { PaginatedResponse, Salon } from "@/lib/types";

/**
 * GET /api/salons
 * List salons with filtering, sorting, and pagination.
 * Query params: category, quartier, min_price, max_price, min_rating,
 *               sort (rating|price|distance), page, limit
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category  = searchParams.get("category");
  const quartier  = searchParams.get("quartier");
  const minRating = searchParams.get("min_rating");
  const sort      = searchParams.get("sort") ?? "rating";
  const page      = parseInt(searchParams.get("page") ?? "1", 10);
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset    = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("salons")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (category) {
    query = query.contains("categories", [category]);
  }
  if (quartier) {
    query = query.eq("quartier", quartier);
  }
  if (minRating) {
    query = query.gte("average_rating", parseFloat(minRating));
  }

  // Sorting
  if (sort === "rating") {
    query = query.order("average_rating", { ascending: false });
  } else if (sort === "price") {
    // Handled client-side via services join — return by rating as fallback
    query = query.order("average_rating", { ascending: false });
  } else {
    query = query.order("average_rating", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  const response: PaginatedResponse<Salon> = {
    items: (data as Salon[]) ?? [],
    total: count ?? 0,
    page,
    limit,
  };

  return NextResponse.json(response);
}
