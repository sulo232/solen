/**
 * send-outreach-emails.ts
 * Sends outreach emails to unclaimed directory entries (max 50/day).
 *
 * Run: npx tsx scripts/send-outreach-emails.ts [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
}

// ── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_KEY = process.env.RESEND_API_KEY!;
const DRY_RUN = process.argv.includes("--dry-run");
const DAILY_LIMIT = 50;
const DELAY_MS = 500; // 500ms between sends to avoid rate limiting

if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_KEY) {
  console.error("❌ Missing env vars. Check .env.local for NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY");
  process.exit(1);
}

if (DRY_RUN) {
  console.log("🔎 DRY RUN mode — no emails will be sent, no DB updates\n");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Send via Resend directly ──────────────────────────────────────────────────
async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "solen.ch <hello@solen.ch>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  Resend error: ${err}`);
    return false;
  }
  return true;
}

// ── Email template ────────────────────────────────────────────────────────────
function buildEmail(salonName: string, claimUrl: string, email: string): { subject: string; html: string } {
  return {
    subject: `${salonName} ist jetzt auf solen.ch gelistet — kostenlos Buchungen aktivieren`,
    html: `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A2E;background:#fff">
  <div style="padding:32px 24px">
    <img src="https://solen.ch/logo.png" alt="solen.ch" style="height:32px;margin-bottom:24px">

    <h2 style="font-size:22px;margin-bottom:8px">Ihr Salon ist auf solen.ch</h2>
    <p style="color:#555;margin-bottom:24px">
      <strong>${salonName}</strong> ist ab sofort auf <a href="https://solen.ch" style="color:#4ECDC4">solen.ch</a> gelistet —
      dem führenden Beauty-Buchungsportal der Region Basel.
    </p>

    <p>Kunden können Ihren Salon bereits finden und Ihre Kontaktdaten einsehen.
      Wenn Sie Online-Buchungen aktivieren möchten, beanspruchen Sie Ihren Salon — kostenlos:</p>

    <div style="text-align:center;margin:32px 0">
      <a href="${claimUrl}"
         style="display:inline-block;padding:14px 28px;background:#4ECDC4;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
        Salon jetzt beanspruchen →
      </a>
    </div>

    <h3 style="font-size:16px">Was Sie erhalten:</h3>
    <ul style="color:#555;line-height:2">
      <li>📅 Online-Buchungen 24/7 entgegennehmen</li>
      <li>⚡ Last-Minute-Angebote in Echtzeit veröffentlichen</li>
      <li>💬 Direktnachrichten von Kunden</li>
      <li>📊 Buchungsstatistiken &amp; Kundenverwaltung</li>
      <li>✅ Kostenlos — keine Grundgebühr</li>
    </ul>

    <p style="color:#555">Bei Fragen: <a href="mailto:support@solen.ch" style="color:#4ECDC4">support@solen.ch</a></p>

    <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
    <p style="font-size:11px;color:#aaa;line-height:1.6">
      solen.ch · Beauty-Buchungsplattform Basel ·
      <a href="https://solen.ch/unsubscribe?email=${encodeURIComponent(email)}" style="color:#aaa">Abmelden</a><br>
      Diese E-Mail wurde an ${email} gesendet, da Ihr Salon öffentlich gelistet ist (nDSG Art. 31).
      Wenn Sie keine weiteren E-Mails von uns wünschen, klicken Sie bitte auf "Abmelden".
    </p>
  </div>
</body>
</html>`,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`📧 Outreach email sender — limit: ${DAILY_LIMIT}/day\n`);

  // Fetch pending entries
  const { data: entries, error } = await supabase
    .from("salon_directory")
    .select("id, name, email")
    .is("outreach_email_sent_at", null)
    .eq("is_claimed", false)
    .not("email", "is", null)
    .limit(DAILY_LIMIT);

  if (error) {
    console.error("❌ Failed to fetch entries:", error.message);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("✅ No pending outreach entries found — all done!");
    return;
  }

  console.log(`Found ${entries.length} entries to contact\n`);

  let sent = 0;
  let failed = 0;

  for (const entry of entries) {
    const claimUrl = `https://solen.ch/de/directory?claim=${entry.id}`;
    const { subject, html } = buildEmail(entry.name, claimUrl, entry.email);

    if (DRY_RUN) {
      console.log(`  [DRY] Would send to: ${entry.email} — ${entry.name}`);
      sent++;
      continue;
    }

    const ok = await sendViaResend(entry.email, subject, html);
    if (ok) {
      await supabase.from("salon_directory").update({
        outreach_email_sent_at: new Date().toISOString(),
      }).eq("id", entry.id);
      console.log(`  ✓ Sent to ${entry.email} — ${entry.name}`);
      sent++;
    } else {
      console.error(`  ✗ Failed for ${entry.email} — ${entry.name}`);
      failed++;
    }

    // Rate limit delay
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\n${DRY_RUN ? "🔎 DRY RUN" : "✅"} Complete — Sent: ${sent}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
