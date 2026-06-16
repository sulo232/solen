// Backfill: persist every active discovery look's TikTok thumbnail into our own
// Supabase Storage (`discovery-images/tiktok-cache/<id>.jpg`), so the thumbnail
// survives TikTok's ~6-month signed-URL expiry AND video deletion / embed
// disabling. Run this ONCE now (while the videos are still reachable) to capture
// the current 17; after that the /api/discovery/thumb/[id] proxy persists any
// newly-ingested look on first fetch, so this is only needed for a one-off
// catch-up or after a bulk import.
//
//   node scripts/backfill-discovery-thumbs.mjs
//
// Idempotent: re-running re-fetches + upserts (last good copy wins). A look
// whose TikTok is already dead (oEmbed 400) is skipped + reported, not fatal.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "discovery-images";
const PREFIX = "tiktok-cache";
const OEMBED = "https://www.tiktok.com/oembed";

// --- minimal .env.local loader (only the two vars we need) ---
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  } catch {
    // fall back to process.env below
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function main() {
  const { url, key } = loadEnv();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: items, error } = await admin
    .from("discovery_items")
    .select("id, style_name, tiktok_url")
    .eq("is_active", true)
    .eq("status", "published")
    .not("tiktok_url", "is", null);
  if (error) {
    console.error("DB query failed:", error.message);
    process.exit(1);
  }
  console.log(`Backfilling ${items.length} active looks → ${BUCKET}/${PREFIX}/\n`);

  let ok = 0;
  let skipped = 0;
  for (const it of items) {
    const label = (it.style_name || it.id).slice(0, 42);
    try {
      // 1) fresh signed thumbnail via oEmbed (stable share-link → never expires)
      const oe = await fetch(`${OEMBED}?url=${encodeURIComponent(it.tiktok_url)}`, { cache: "no-store" });
      if (!oe.ok) { console.log(`  SKIP  ${label}  (oembed ${oe.status} — video dead/embed-off)`); skipped++; continue; }
      const thumbUrl = (await oe.json())?.thumbnail_url;
      if (!thumbUrl) { console.log(`  SKIP  ${label}  (no thumbnail_url in oembed)`); skipped++; continue; }

      // 2) fetch the image bytes
      const img = await fetch(thumbUrl);
      if (!img.ok) { console.log(`  SKIP  ${label}  (image ${img.status})`); skipped++; continue; }
      const bytes = Buffer.from(await img.arrayBuffer());
      const contentType = img.headers.get("content-type") || "image/jpeg";

      // 3) persist to Storage (upsert)
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(`${PREFIX}/${it.id}.jpg`, bytes, { contentType, upsert: true });
      if (upErr) { console.log(`  FAIL  ${label}  (upload: ${upErr.message})`); skipped++; continue; }

      console.log(`  OK    ${label}  (${(bytes.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (e) {
      console.log(`  FAIL  ${label}  (${String(e)})`);
      skipped++;
    }
  }

  // verify by listing what landed
  const { data: listed } = await admin.storage.from(BUCKET).list(PREFIX, { limit: 1000 });
  console.log(`\nDone: ${ok} persisted, ${skipped} skipped. Storage now holds ${listed?.length ?? "?"} cached thumbnails.`);
}

main();
