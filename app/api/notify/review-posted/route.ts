export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
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
      .select("email")
      .eq("id", review.salons.owner_id)
      .single();

    if (owner?.email) {
      const starText = review.rating === 1 ? "1 Stern" : `${review.rating} Sternen`;
      await sendEmail({
        to: owner.email,
        subject: `Neue Bewertung für ${review.salons.name}`,
        html: `
          <h3>Neue Kundenbewertung</h3>
          <p>Dein Salon <strong>${review.salons.name}</strong> hat eine neue Bewertung mit ${starText} erhalten.</p>
          ${review.comment ? `<blockquote>"${review.comment}"</blockquote>` : ""}
          <p>
            <a href="https://solen.ch/de/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:#F25C54;color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">
              Bewertungen im Dashboard ansehen
            </a>
          </p>
        `
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
