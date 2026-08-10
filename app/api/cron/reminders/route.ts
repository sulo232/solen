export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";

/**
 * DEPRECATED (2026-06-03): superseded by /api/cron/sms-reminders.
 *
 * This handler never actually sent SMS — it only console.log'd "Would send" and then stamped
 * sms_sent_24h/1h = true. Because its booking window (now → +24h) was far wider than the real
 * sender's tight 23.5–24.5h window, it claimed bookings first and marked them sent, so the real
 * sender's `.eq(sms_sent_24h, false)` filter then skipped them and NO reminder went out.
 *
 * It is now a no-op so it can never steal bookings again. Removed from .github/workflows/cron-jobs.yml.
 * The real sender (/api/cron/sms-reminders) honors the per-salon sms_reminder_24h / sms_reminder_1h
 * toggles. Kept as a 410 stub so any stale scheduler hitting this path is harmless + observable.
 */
export async function GET(req: NextRequest) {
  const env = getServerEnv();
  const authHeader = req.headers.get("authorization");
  if (!env.CRON_SECRET || !(await verifyCronSecret(authHeader, env.CRON_SECRET))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.warn("[reminders] deprecated no-op invoked — use /api/cron/sms-reminders");
  return NextResponse.json({ deprecated: true, use: "/api/cron/sms-reminders" }, { status: 410 });
}
