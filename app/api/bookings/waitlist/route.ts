import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { waitlistSchema, validateBody } from "@/lib/validations";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const validation = validateBody(waitlistSchema, body);
    if (validation.error) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }
    const { salon_id, service_id, preferred_date } = validation.data;

    const { data, error } = await supabase
      .from("booking_waitlist")
      .insert({
        user_id: user.id,
        // salon_id is optional in the schema (lib/validations.ts) but NOT NULL in the DB;
        // if missing, the insert below fails and hits the existing catch-all 500, same as
        // before typing (type-only cast, no new branch).
        salon_id: salon_id as string,
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

