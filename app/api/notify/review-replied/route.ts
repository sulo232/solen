export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, reviewRepliedEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { constantTimeStringEqual } from "@/lib/cron-auth";

// Internal-only route (invoked server-to-server by app/api/reviews/[id]/respond/route.ts).
// Never public: it sends email as an open relay and would otherwise let anyone
// spam arbitrary review_id targets.

export async function POST(req: NextRequest) {
  try {
    const cronSecret = getServerEnv().CRON_SECRET;
    const internalSecret = req.headers.get("x-internal-secret");
    if (!cronSecret || !internalSecret || !(await constantTimeStringEqual(internalSecret, cronSecret))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();
    const { review_id, reply_text } = await req.json();
    if (!review_id) return NextResponse.json({ error: "missing review_id" }, { status: 400 });

    const { data: review } = await admin.from("reviews")
      .select("*, salons(name, slug), profiles!user_id(email, locale)")
      .eq("id", review_id)
      .single();

    if (!review || !review.profiles?.email) return NextResponse.json({ error: "not found" }, { status: 404 });

    // A9-email-locale (2026-07-27): the reviewer's own profile.locale, was hardcoded German
    // inline HTML with no locale mechanism at all.
    const reviewerLocale = (review.profiles.locale as "de" | "en" | "fr" | "it") ?? "de";
    await sendEmail(reviewRepliedEmail(
      review.profiles.email,
      { salon: review.salons.name, salonSlug: review.salons.slug, replyText: reply_text ?? "" },
      reviewerLocale
    ));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[notify/review-replied] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
