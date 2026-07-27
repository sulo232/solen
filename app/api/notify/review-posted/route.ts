export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, reviewPostedEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { constantTimeStringEqual } from "@/lib/cron-auth";

// Internal-only route (invoked server-to-server by app/api/reviews/route.ts).
// Never public: it sends email as an open relay to any salon owner otherwise.

export async function POST(req: NextRequest) {
  try {
    const cronSecret = getServerEnv().CRON_SECRET;
    const internalSecret = req.headers.get("x-internal-secret");
    if (!cronSecret || !internalSecret || !(await constantTimeStringEqual(internalSecret, cronSecret))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();
    // We expect { review_id }
    const { review_id } = await req.json();
    if (!review_id) return NextResponse.json({ error: "missing review_id" }, { status: 400 });

    // fetch review and salon owner email
    const { data: review } = await admin.from("reviews")
      .select("*, salons(owner_id, name)")
      .eq("id", review_id)
      .single();

    if (!review || !review.salons?.owner_id) return NextResponse.json({ error: "not found" }, { status: 404 });

    const { data: owner } = await admin.from("profiles")
      .select("email, locale")
      .eq("id", review.salons.owner_id)
      .single();

    if (owner?.email) {
      // A9-email-locale (2026-07-27): the owner's own profile.locale, was hardcoded German
      // inline HTML with no locale mechanism at all.
      const ownerLocale = (owner.locale as "de" | "en" | "fr" | "it") ?? "de";
      await sendEmail(reviewPostedEmail(
        owner.email,
        { salon: review.salons.name, rating: review.rating, comment: review.comment ?? undefined },
        ownerLocale
      ));
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[notify/review-posted] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
