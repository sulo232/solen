import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// Cache categories for 5 minutes (they rarely change)
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name_de, name_en, name_fr, name_it, slug, parent_id, icon_name, sort_order, level")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Build tree structure
  const categories = data ?? [];
  const roots = categories.filter((c) => c.level === 1);
  const tree = roots.map((root) => {
    const children = categories
      .filter((c) => c.parent_id === root.id)
      .map((child) => ({
        ...child,
        children: categories.filter((c) => c.parent_id === child.id),
      }));
    return { ...root, children };
  });

  return NextResponse.json({ items: tree, flat: categories });
}
