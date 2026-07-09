export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";

// Internal-only route (invoked server-to-server by app/api/reviews/[id]/respond/route.ts).
// Never public: it sends email as an open relay and would otherwise let anyone
// spam arbitrary review_id targets.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = getServerEnv().CRON_SECRET;
    if (!cronSecret || req.headers.get("x-internal-secret") !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();
    const { review_id, reply_text } = await req.json();
    if (!review_id) return NextResponse.json({ error: "missing review_id" }, { status: 400 });

    const { data: review } = await admin.from("reviews")
      .select("*, salons(name, slug), profiles!user_id(email)")
      .eq("id", review_id)
      .single();

    if (!review || !review.profiles?.email) return NextResponse.json({ error: "not found" }, { status: 404 });

    await sendEmail({
        to: review.profiles.email,
        subject: `${review.salons.name} hat auf deine Bewertung geantwortet`,
        html: `
          <h3>Antwort auf deine Bewertung</h3>
          <p>Der Salon <strong>${review.salons.name}</strong> hat auf deine Bewertung geantwortet:</p>
          <blockquote style="border-left: 4px solid #F25C54; padding-left: 12px; margin-left: 0; color: #555;">
            ${escapeHtml(reply_text ?? "")}
          </blockquote>
          <p>
            <a href="https://solen.ch/de/salon/${review.salons.slug}" style="display:inline-block;padding:10px 20px;background:#F25C54;color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">
              Zum Salon Profil
            </a>
          </p>
        `
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
