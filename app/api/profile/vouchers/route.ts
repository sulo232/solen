export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/profile/vouchers
 * Fetches all vouchers purchased by the authenticated user (buyer_id)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all vouchers for this user as buyer
    const { data: vouchers, error } = await supabase
      .from("vouchers")
      .select(
        `
        id,
        code,
        amount,
        remaining_amount,
        created_at,
        redeemed_at,
        expires_at,
        message,
        recipient_email,
        recipient_name,
        salons (id, name_de, name_en)
        `
      )
      .eq("buyer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ProfileVouchers] error fetching vouchers:", error);
      return NextResponse.json(
        { error: "Failed to fetch vouchers" },
        { status: 500 }
      );
    }

    // Categorize vouchers
    const now = new Date();
    const active = vouchers?.filter((v) => {
      const isExpired = v.expires_at && new Date(v.expires_at) < now;
      const isRedeemed = v.redeemed_at !== null;
      return !isExpired && !isRedeemed && v.remaining_amount > 0;
    }) ?? [];

    const used = vouchers?.filter((v) => {
      const isExpired = v.expires_at && new Date(v.expires_at) < now;
      const isRedeemed = v.redeemed_at !== null;
      return !isExpired && (isRedeemed || v.remaining_amount === 0);
    }) ?? [];

    const expired = vouchers?.filter((v) => {
      const isExpired = v.expires_at && new Date(v.expires_at) < now;
      return isExpired;
    }) ?? [];

    return NextResponse.json({
      active,
      used,
      expired,
      total: vouchers?.length ?? 0,
    });
  } catch (error) {
    console.error("[ProfileVouchers] unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
