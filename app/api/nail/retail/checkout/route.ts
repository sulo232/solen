export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter, getClientIp } from "@/lib/ratelimit";

// POST — process a retail checkout: decrement stock and record sale
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id, ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { salon_id, items } = body as {
    salon_id?: string;
    items?: { product_id: string; quantity: number }[];
  };

  if (!salon_id) return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("owner_id", user.id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found or not owned" }, { status: 403 });

  // Fetch current stock for all product IDs in this order
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: fetchErr } = await supabase
    .from("nail_retail_products")
    .select("id, stock_count, price, name")
    .eq("salon_id", salon_id)
    .in("id", productIds);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // Validate stock availability
  for (const item of items) {
    const product = products?.find((p) => p.id === item.product_id);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 404 });
    }
    if (product.stock_count < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}` },
        { status: 409 }
      );
    }
  }

  // Decrement stock for each item
  for (const item of items) {
    const product = products!.find((p) => p.id === item.product_id)!;
    const newStock = product.stock_count - item.quantity;
    const { error: updateErr } = await supabase
      .from("nail_retail_products")
      .update({ stock_count: newStock })
      .eq("id", item.product_id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Calculate total for response
  const total = items.reduce((sum, item) => {
    const product = products!.find((p) => p.id === item.product_id)!;
    return sum + product.price * item.quantity;
  }, 0);

  return NextResponse.json({ success: true, total }, { status: 200 });
}
