export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";
import { verifyCronSecret } from "@/lib/cron-auth";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/discovery-deadcheck
// Weekly cron: scans active discovery looks for DEAD TikToks — videos the creator deleted, made private, or turned
// embedding off. TikTok's oEmbed returns HTTP 400 for those (verified: that's exactly how the one dead look was
// found). Dead looks are hidden (is_active=false) and logged. We hide because the thumbnail is cached in Storage, so
// the card would otherwise still render but tapping play would error. Reuses the same oEmbed probe as
// /api/discovery/thumb. Conservative: only a definitive 400 hides a look; 429/5xx (transient) are skipped so a blip
// never hides a live video.
const OEMBED = "https://www.tiktok.com/oembed";

export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (!(await verifyCronSecret(request.headers.get("authorization"), cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("discovery-deadcheck", async () => {
  const admin = createAdminSupabaseClient();
  const { data: items, error } = await admin
    .from("discovery_items")
    .select("id, style_name, tiktok_url")
    .eq("is_active", true)
    .eq("status", "published")
    .not("tiktok_url", "is", null);
  if (error) return { error: error.message, errors: [error.message] };

  let checked = 0;
  let hidden = 0;
  const errorMsgs: string[] = [];
  const dead: { id: string; style_name: string | null }[] = [];

  for (const it of items ?? []) {
    checked++;
    try {
      const res = await fetch(`${OEMBED}?url=${encodeURIComponent(it.tiktok_url as string)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 400) {
        const { error: upErr } = await admin.from("discovery_items").update({ is_active: false }).eq("id", it.id);
        if (upErr) {
          errorMsgs.push(`item ${it.id}: hide failed: ${upErr.message}`);
          console.error("[deadcheck] hide failed:", it.id, upErr.message);
        } else {
          hidden++;
          dead.push({ id: it.id, style_name: it.style_name });
        }
      }
    } catch (e) {
      errorMsgs.push(`item ${it.id}: oembed exception: ${e instanceof Error ? e.message : String(e)}`);
      console.error("[deadcheck] oembed exception:", it.id, String(e));
    }
  }

  console.log(`[deadcheck] checked ${checked}, hid ${hidden} dead TikToks, ${errorMsgs.length} errors`);
  return {
    message: `Dead-TikTok scan: checked ${checked}, hid ${hidden}, ${errorMsgs.length} errors`,
    checked,
    hidden,
    errors: capErrors(errorMsgs),
    dead,
    processed: checked,
  };
  });
}
