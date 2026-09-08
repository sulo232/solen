export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/dashboard/nail/retail-sales?salon_id=...
//
// A-6: reads the REAL settled-purchase table (retail_purchases), NOT the drift table
// retail_sales (nothing writes it). Each purchase row carries a product_ids array and
// its paid_amount (Rappen); v1 = quantity 1 per SKU per purchase, so we unnest
// product_ids to one unit each and re-read the unit price from nail_retail_products at
// render. Response shape is unchanged (RetailSalesDashboard.tsx consumes it verbatim):
//   kpis { total_revenue, total_units, avg_sale, top_product }  (Rappen; units = count)
//   weekly [{ week, revenue }]
//   top_products [{ name, units, revenue }]
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (finance) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "finance");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  // Settled purchases (paid or refunded) for the last 8 weeks, by settle/create time.
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: purchases } = await admin
    .from("retail_purchases")
    .select("id, product_ids, created_at, status")
    .eq("salon_id", salonId)
    .in("status", ["paid", "refunded"])
    .gte("created_at", eightWeeksAgo);

  const allPurchases = purchases ?? [];

  // Unnest product_ids -> one unit per SKU per purchase (v1 quantity = 1).
  // Each line carries the purchase's created_at for the weekly bucket.
  const lines: { product_id: string; created_at: string }[] = [];
  for (const p of allPurchases) {
    const ids = (p.product_ids as string[] | null) ?? [];
    for (const pid of ids) lines.push({ product_id: pid, created_at: p.created_at as string });
  }

  // Re-read unit price + name from the products at render (never denormalized).
  const productIds = [...new Set(lines.map((l) => l.product_id))];
  const priceMap = new Map<string, { name: string; price: number }>();
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from("nail_retail_products")
      .select("id, name, price")
      .in("id", productIds);
    for (const pr of products ?? []) {
      priceMap.set(pr.id as string, { name: (pr.name as string) ?? "Product", price: (pr.price as number) ?? 0 });
    }
  }

  const unitPrice = (id: string) => priceMap.get(id)?.price ?? 0;

  const totalRevenue = lines.reduce((s, l) => s + unitPrice(l.product_id), 0);
  const totalUnits = lines.length;
  // avg per PURCHASE (matches the previous "revenue / number of sale rows" semantic;
  // a sale row was one purchase event).
  const avgSale = allPurchases.length > 0 ? Math.round(totalRevenue / allPurchases.length) : 0;

  // Top products by revenue.
  const productMap = new Map<string, { units: number; revenue: number }>();
  for (const l of lines) {
    const existing = productMap.get(l.product_id) ?? { units: 0, revenue: 0 };
    productMap.set(l.product_id, {
      units: existing.units + 1,
      revenue: existing.revenue + unitPrice(l.product_id),
    });
  }
  const topProductIds = [...productMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  const topProducts: { name: string; units: number; revenue: number }[] = topProductIds.map((id) => ({
    name: priceMap.get(id)?.name ?? "Product",
    ...(productMap.get(id) ?? { units: 0, revenue: 0 }),
  }));

  // Weekly breakdown (same KW bucket keying as before, over the purchase created_at).
  const now = new Date();
  const weeklyMap = new Map<string, number>();
  for (let w = 7; w >= 0; w--) {
    const d = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const key = `KW${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    weeklyMap.set(key, 0);
  }
  for (const l of lines) {
    const d = new Date(l.created_at);
    const key = `KW${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    if (weeklyMap.has(key)) {
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + unitPrice(l.product_id));
    }
  }
  const weekly = [...weeklyMap.entries()].map(([week, revenue]) => ({ week, revenue }));

  return NextResponse.json({
    kpis: {
      total_revenue: totalRevenue,
      total_units: totalUnits,
      avg_sale: avgSale,
      top_product: topProducts[0]?.name ?? null,
    },
    weekly,
    top_products: topProducts,
  });
}
