/**
 * One-off backfill of public.search_embeddings (Smart Search Phase 5).
 *
 * Embeds every active service + every visible salon with Gemini
 * text-embedding-004 (768-dim) and upserts into search_embeddings, so the
 * hybrid ranker's vector component (cross-lingual fr/it recall) has data.
 *
 * Run:  npx tsx _tasks/backfill-search-embeddings.ts   (from the main checkout)
 * Re-runnable: upserts on (entity_type, entity_id). Costs a few Gemini calls.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI = env.GEMINI_API_KEY;
if (!URL || !KEY || !GEMINI) {
  console.error("[backfill] missing env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY)");
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

// REST embedContent: gemini-embedding-001 truncated to 768 dims (matches the
// search_embeddings vector(768) column + HNSW index). taskType RETRIEVAL_DOCUMENT
// (these are documents to be searched; queries use RETRIEVAL_QUERY). Cosine index,
// so no L2 renormalization needed after truncation.
async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 140)}`);
  const j: any = await res.json();
  const v = j?.embedding?.values;
  if (!Array.isArray(v) || v.length !== 768) throw new Error(`bad embedding (len ${v?.length})`);
  return v;
}

type Row = { entity_type: string; entity_id: string; category: string; text_content: string };

const svcText = (s: any): string =>
  [s.name_de, s.name_en ?? "", `Kategorie: ${s.category}`, s.price ? `${s.price} CHF` : ""].filter(Boolean).join(" | ");
const salonText = (s: any): string =>
  [s.name, s.description_de ?? "", s.description_en ?? "", (s.categories ?? []).join(", ")].filter(Boolean).join(" | ");

async function run() {
  const rows: Row[] = [];

  const { data: svcs, error: e1 } = await supabase
    .from("services").select("id,name_de,name_en,category,price").eq("is_active", true);
  if (e1) throw e1;
  for (const s of svcs ?? []) rows.push({ entity_type: "service", entity_id: s.id, category: s.category ?? "service", text_content: svcText(s) });

  const { data: sals, error: e2 } = await supabase
    .from("salons").select("id,name,description_de,description_en,categories,is_test")
    .eq("is_active", true).eq("listed_on_marketplace", true);
  if (e2) throw e2;
  for (const s of (sals ?? []).filter((x: any) => !x.is_test))
    rows.push({ entity_type: "salon", entity_id: s.id, category: s.categories?.[0] ?? "salon", text_content: salonText(s) });

  console.log(`[backfill] embedding ${rows.length} rows (${svcs?.length ?? 0} services + ${rows.length - (svcs?.length ?? 0)} salons)...`);

  let done = 0, errs = 0;
  const BATCH = 10;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const out: any[] = [];
    for (const r of batch) {
      try {
        out.push({ ...r, embedding: JSON.stringify(await embed(r.text_content)) });
      } catch (err) {
        errs++;
        console.error(`[backfill] embed failed ${r.entity_type}:${r.entity_id}:`, (err as Error).message);
      }
    }
    if (out.length) {
      const { error } = await supabase.from("search_embeddings").upsert(out, { onConflict: "entity_type,entity_id" });
      if (error) { errs += out.length; console.error("[backfill] upsert error:", error.message); }
      else done += out.length;
    }
    console.log(`[backfill] ${done}/${rows.length} embedded (errs ${errs})`);
    if (i + BATCH < rows.length) await new Promise((r) => setTimeout(r, 1100)); // Gemini rate-limit cooldown
  }

  const { count } = await supabase.from("search_embeddings").select("*", { count: "exact", head: true });
  console.log(`[backfill] DONE: ${done} embedded, ${errs} errors. search_embeddings now has ${count} rows.`);
  if (errs > 0) process.exit(1);
}
run().catch((e) => { console.error("[backfill] fatal:", e); process.exit(1); });
