export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// POST /api/directory/:id/claim
// Step 1 — no body (or body without `code`): generate + send 6-digit code
// Step 2 — body { code }: verify code → mark claimed, return entry data for pre-fill
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  // Fetch directory entry
  const { data: entry, error: fetchErr } = await admin
    .from("salon_directory")
    .select("id, name, email, address, phone, website, categories, is_claimed")
    .eq("id", id)
    .single();

  if (fetchErr || !entry) {
    return NextResponse.json({ error: "Salon not found in directory" }, { status: 404 });
  }

  if (entry.is_claimed) {
    return NextResponse.json({ error: "This listing has already been claimed" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));

  // ── Step 2: Verify code ──────────────────────────────────────────────────
  if (body.code) {
    const { data: current } = await admin
      .from("salon_directory")
      .select("claim_verification_code, claim_verification_expires_at")
      .eq("id", id)
      .single();

    if (!current?.claim_verification_code) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    if (new Date(current.claim_verification_expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    const inputHashed = hashCode(String(body.code).trim());
    if (inputHashed !== current.claim_verification_code) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    // Mark claimed
    await admin.from("salon_directory").update({
      is_claimed: true,
      claim_verification_code: null,
      claim_verification_expires_at: null,
    }).eq("id", id);

    return NextResponse.json({
      verified: true,
      entry: {
        name: entry.name,
        address: entry.address,
        phone: entry.phone,
        website: entry.website,
        categories: entry.categories,
        email: entry.email,
      },
    });
  }

  // ── Step 1: Generate + send code ────────────────────────────────────────
  if (!entry.email) {
    return NextResponse.json(
      { error: "No email address on file for this listing. Contact support@solen.ch." },
      { status: 422 }
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await admin.from("salon_directory").update({
    claim_verification_code: hashCode(code),
    claim_verification_expires_at: expiresAt,
  }).eq("id", id);

  await sendEmail({
    to: entry.email,
    subject: `Ihr Bestätigungscode für solen.ch: ${code}`,
    html: `
      <p>Guten Tag,</p>
      <p>Sie haben beantragt, den Salon <strong>${entry.name}</strong> auf solen.ch zu beanspruchen.</p>
      <p>Ihr Bestätigungscode lautet: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p>
      <p>Der Code ist 15 Minuten gültig.</p>
      <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
      <p>Das solen.ch Team</p>
    `,
  });

  return NextResponse.json({ sent: true, email: entry.email.replace(/(.{2}).*(@.*)/, "$1***$2") });
}
