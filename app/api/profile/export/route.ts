export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminSupabaseClient();
    
    // Fetch profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch owned salons
    const { data: salons } = await admin
      .from("salons")
      .select("*")
      .eq("owner_id", user.id);

    // Fetch bookings (as customer)
    const { data: bookings } = await admin
      .from("bookings")
      .select("*, booking_services(*)")
      .eq("user_id", user.id);

    // Fetch reviews
    const { data: reviews } = await admin
      .from("reviews")
      .select("*")
      .eq("user_id", user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile,
      salons: salons || [],
      bookings: bookings || [],
      reviews: reviews || []
    };

    // Log the export action
    await logAuditEvent(req, user.id, "account.data_export", "user", user.id, { record_count: (salons?.length || 0) + (bookings?.length || 0) + (reviews?.length || 0) });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="solen-data-export-${user.id}.json"`,
      },
    });

  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
