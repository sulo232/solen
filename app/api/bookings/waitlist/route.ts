import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { salon_id, service_id, preferred_date } = body;

    if (!salon_id || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("booking_waitlist")
      .insert({
        user_id: session.user.id,
        salon_id,
        service_id: service_id || null,
        preferred_date,
        status: "waiting"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating waitlist entry:", error);
      return NextResponse.json({ error: "Failed to create waitlist entry" }, { status: 500 });
    }

    return NextResponse.json({ success: true, waitlist: data }, { status: 200 });

  } catch (err) {
    console.error("Waitlist API parsing error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

