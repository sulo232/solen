// exists-check: net-new vs lib/alert-admin.ts (that one is a single-event money-path
// alert, no scheduled summary) and app/api/cron/reconcile (daily, but Stripe<->DB drift
// only, not a general ops summary). No existing "digest"/daily-summary surface (npm run
// exists digest: 0 matches). This is the founder daily digest: yesterday's booking volume
// + cron health + pending reviews, one email, reusing lib/email.ts sendEmail and the new
// lib/cron-run.ts withCronRun wrapper.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import { withCronRun } from "@/lib/cron-run";
import { EXPECTED_CRON_INTERVALS_MS, findOverdueCrons } from "@/lib/cron-heartbeat";

/** Escape the few chars that would break out of an HTML text context. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Cron: founder daily digest email. Daily 05:15 UTC (after the 03:00/04:00 UTC batch
// of daily crons has had time to run, so the cron-health section reflects that night's
// runs). Composes yesterday's Europe/Zurich day: bookings created, bookings completed,
// cron_runs failures in the last 24h, crons that are MISSING or STALE against their
// own schedule (lib/cron-heartbeat.ts, A11-cron-heartbeat 2026-07-27; a cron that
// never fires writes no cron_runs row and the failures-only section above would miss
// it), and the current pending-reviews backlog. Sends ONE email to ADMIN_EMAIL. Only
// sections whose query succeeded are rendered, never a fabricated 0.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("daily-digest", async () => {
    const adminEmail = getServerEnv().ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("[daily-digest] ADMIN_EMAIL not set, skipping");
      return { skipped: true, reason: "no_admin_email" };
    }

    const admin = createAdminSupabaseClient();

    // Yesterday's Europe/Zurich calendar day, resolved to a true UTC window
    // (DST-safe) via the same helper generate-slots uses for wall-clock -> UTC.
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
    const [ty, tm, td] = todayStr.split("-").map(Number);
    const yesterdayStr = new Date(Date.UTC(ty, tm - 1, td - 1)).toISOString().split("T")[0];
    const dayStart = zurichWallClockToUtc(yesterdayStr, 0, 0);
    const dayEnd = zurichWallClockToUtc(todayStr, 0, 0);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const errors: string[] = [];
    const sections: string[] = [];
    let sectionsOk = 0;

    // 1. Bookings created yesterday.
    {
      const { count, error } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lt("created_at", dayEnd.toISOString());
      if (error) {
        console.error("[daily-digest] bookings-created query failed:", error.message);
        errors.push(`bookings-created query failed: ${error.message}`);
      } else {
        sectionsOk++;
        sections.push(`<li><strong>${count ?? 0}</strong> bookings created</li>`);
      }
    }

    // 2. Bookings completed yesterday.
    {
      const { count, error } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", dayStart.toISOString())
        .lt("completed_at", dayEnd.toISOString());
      if (error) {
        console.error("[daily-digest] bookings-completed query failed:", error.message);
        errors.push(`bookings-completed query failed: ${error.message}`);
      } else {
        sectionsOk++;
        sections.push(`<li><strong>${count ?? 0}</strong> bookings completed</li>`);
      }
    }

    // 3. cron_runs failures in the last 24h (name + error snippet).
    {
      const { data: failures, error } = await admin
        .from("cron_runs")
        .select("name, ran_at, errors")
        .eq("ok", false)
        .gte("ran_at", twentyFourHoursAgo)
        .order("ran_at", { ascending: false })
        .limit(20);
      if (error) {
        console.error("[daily-digest] cron_runs query failed:", error.message);
        errors.push(`cron_runs query failed: ${error.message}`);
      } else {
        sectionsOk++;
        const rows = failures ?? [];
        if (rows.length === 0) {
          sections.push(`<li><strong>0</strong> cron failures in the last 24h</li>`);
        } else {
          const items = rows
            .map((f) => {
              const snippet = Array.isArray(f.errors) ? String(f.errors[0] ?? "") : String(f.errors ?? "");
              return `<li style="color:#C0362C"><strong>${escapeHtml(f.name)}</strong>: ${escapeHtml(snippet).slice(0, 200)} (${escapeHtml(f.ran_at)})</li>`;
            })
            .join("");
          sections.push(`<li><strong>${rows.length}</strong> cron failure(s) in the last 24h:<ul>${items}</ul></li>`);
        }
      }
    }

    // 4. Pending reviews (no owner reply yet). Round 10 Y3: reviews.salon_response is
    // retired (see _design-system/REMOVED.md); review_replies is the winning table,
    // and its UNIQUE(review_id) means its total row count already equals the number
    // of DISTINCT reviews that have been replied to, platform-wide.
    {
      const [totalRes, repliedRes] = await Promise.all([
        admin.from("reviews").select("id", { count: "exact", head: true }),
        admin.from("review_replies").select("id", { count: "exact", head: true }),
      ]);
      if (totalRes.error || repliedRes.error) {
        const msg = totalRes.error?.message ?? repliedRes.error?.message ?? "unknown error";
        console.error("[daily-digest] pending-reviews query failed:", msg);
        errors.push(`pending-reviews query failed: ${msg}`);
      } else {
        sectionsOk++;
        const pending = Math.max(0, (totalRes.count ?? 0) - (repliedRes.count ?? 0));
        sections.push(`<li><strong>${pending}</strong> reviews awaiting a salon response</li>`);
      }
    }

    // 5. Cron heartbeat: which crons in EXPECTED_CRON_INTERVALS_MS have NOT
    // written a cron_runs row within 2x their own scheduled interval. Section 3
    // above only catches an explicit ok:false row; a cron that never fires
    // writes no row at all and rendered as "0 cron failures" until this
    // section existed (the failure this was written for: five straight missed
    // GitHub Actions runs of this workflow, reported as nothing).
    {
      const names = Object.keys(EXPECTED_CRON_INTERVALS_MS);
      const maxIntervalMs = Math.max(...Object.values(EXPECTED_CRON_INTERVALS_MS));
      const heartbeatCutoff = new Date(Date.now() - maxIntervalMs * 2).toISOString();
      const { data: recentRuns, error } = await admin
        .from("cron_runs")
        .select("name, ran_at")
        .in("name", names)
        .gte("ran_at", heartbeatCutoff)
        .order("ran_at", { ascending: false });
      if (error) {
        console.error("[daily-digest] cron heartbeat query failed:", error.message);
        errors.push(`cron heartbeat query failed: ${error.message}`);
      } else {
        sectionsOk++;
        const lastRanAtByName: Record<string, string> = {};
        for (const row of recentRuns ?? []) {
          if (!lastRanAtByName[row.name]) lastRanAtByName[row.name] = row.ran_at;
        }
        const overdue = findOverdueCrons(lastRanAtByName);
        if (overdue.length === 0) {
          sections.push(`<li><strong>0</strong> crons overdue (no run within 2x their schedule)</li>`);
        } else {
          const items = overdue.map((name) => `<li style="color:#C0362C">${escapeHtml(name)}</li>`).join("");
          sections.push(
            `<li><strong>${overdue.length}</strong> cron(s) overdue, missing or stale (no run within 2x schedule):<ul>${items}</ul></li>`,
          );
        }
      }
    }

    // 6. observability-8: booking failure rate, trended over the last 7 Zurich
    // days. "Created" and "completed" above are raw counts; neither answers
    // "how often does a booking actually fail," which _backend-system's own
    // observability research (section 3) names as the actual missing baseline
    // before an honest SLO can be picked. A "failed" attempt here = a booking
    // the system itself auto-cancelled because the customer/salon flow never
    // completed (abandon-sweep's payment_timeout, pending-timeout's no-response),
    // not a normal voluntary cancellation by choice. One query, bucketed in JS
    // since a 28-salon dataset is small enough that a GROUP BY RPC isn't needed yet.
    {
      const FAILURE_REASONS = ["abandoned_payment_timeout", "automatic_timeout_no_response"];
      const sevenDaysAgoStr = new Date(Date.UTC(ty, tm - 1, td - 7)).toISOString().split("T")[0];
      const windowStart = zurichWallClockToUtc(sevenDaysAgoStr, 0, 0);
      const { data: recentBookings, error } = await admin
        .from("bookings")
        .select("created_at, cancellation_reason")
        .gte("created_at", windowStart.toISOString())
        .lt("created_at", dayEnd.toISOString());
      if (error) {
        console.error("[daily-digest] booking-failure-rate query failed:", error.message);
        errors.push(`booking-failure-rate query failed: ${error.message}`);
      } else {
        sectionsOk++;
        const totalByDay = new Map<string, number>();
        const failedByDay = new Map<string, number>();
        for (const row of recentBookings ?? []) {
          if (!row.created_at) continue;
          const dayKey = new Date(row.created_at).toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
          totalByDay.set(dayKey, (totalByDay.get(dayKey) ?? 0) + 1);
          if (FAILURE_REASONS.includes(row.cancellation_reason ?? "")) {
            failedByDay.set(dayKey, (failedByDay.get(dayKey) ?? 0) + 1);
          }
        }
        const dayKeys: string[] = [];
        for (let i = 6; i >= 0; i--) {
          dayKeys.push(new Date(Date.UTC(ty, tm - 1, td - i)).toISOString().split("T")[0]);
        }
        const items = dayKeys
          .map((day) => {
            const total = totalByDay.get(day) ?? 0;
            const failed = failedByDay.get(day) ?? 0;
            const pct = total > 0 ? ((failed / total) * 100).toFixed(1) : "0.0";
            return `<li>${escapeHtml(day)}: <strong>${failed}/${total}</strong> failed (${pct}%)</li>`;
          })
          .join("");
        sections.push(`<li>Booking failure rate, last 7 days:<ul>${items}</ul></li>`);
      }
    }

    if (sections.length > 0) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Solen daily digest, ${yesterdayStr}`,
          html:
            `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">` +
            `<h2 style="color:#0A0A0A">Solen daily digest, ${yesterdayStr}</h2>` +
            `<ul>${sections.join("")}</ul>` +
            `<p style="color:#999;font-size:12px;margin-top:16px">Automated digest. Sent at ${new Date().toISOString()}.</p>` +
            `</div>`,
        });
      } catch (err) {
        console.error("[daily-digest] sendEmail failed:", err);
        errors.push(`sendEmail failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      sent: sections.length > 0 && errors.every((e) => !e.startsWith("sendEmail")),
      sectionsOk,
      sectionsTotal: 6,
      processed: sectionsOk,
      ...(errors.length ? { errors } : {}),
    };
  });
}
