#!/usr/bin/env node
/**
 * backfill-translations , fill fr/it on rows that have German but no translation.
 *
 * Owner 2026-07-27: "salon cant rlly translte every service they have yk like auto translate".
 * The write paths now auto-translate (app/api/services/route.ts, .../[id]/route.ts), but every
 * row that already existed has NULL fr/it. This fills them once.
 *
 * MEASURED BEFORE WRITING IT (live SQL, 2026-07-27): 264 services carry only 59 DISTINCT
 * German names. Translating per DISTINCT NAME rather than per row turns 264 calls into 59, and
 * guarantees the same service reads identically across salons, which per-row translation would
 * not. Same for descriptions: 19 services and 22 salons actually have one.
 *
 * SAFETY, in the order it matters:
 *   - Only ever writes a column that is currently NULL or empty. A salon's own translation, or
 *     an earlier run's, is never overwritten. Re-running is therefore safe and resumable.
 *   - A failed translation returns "" and is SKIPPED, never written. The column stays NULL and
 *     lib/i18n/localized-field.ts falls back to German, which is the correct degraded state.
 *   - --dry-run (the default) writes nothing and prints what it would do. --apply commits.
 *
 *   node scripts/backfill-translations.mjs             # dry run
 *   node scripts/backfill-translations.mjs --apply     # write
 *   node scripts/backfill-translations.mjs --apply --limit 10
 */
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

function loadEnv() {
  for (const p of [".env.local", path.join(process.cwd(), ".env.local"), "/Users/sulo/Documents/solen/.env.local"]) {
    if (!fs.existsSync(p)) continue;
    const out = {};
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const i = line.indexOf("=");
      if (i < 1 || line.trim().startsWith("#")) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return out;
  }
  throw new Error("no .env.local found");
}

const env = loadEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-2.5-flash" });

// Mirrors lib/ai/translate.ts. Kept in sync by hand on purpose: this is a node script and that
// is a TS module behind the app's path aliases, so importing it would need a build step for a
// one-off backfill. If the rules there change, change them here.
const LANG = { fr: "French", it: "Italian" };
const REGISTER = {
  fr: "Address the reader formally (vous), matching Solen's existing French UI.",
  it: "Address the reader informally (tu), matching Solen's Italian UI.",
};
const FIELD_RULE = {
  name: "This is a SERVICE NAME on a price list. Keep it a short noun phrase of the same shape and length. Do not add articles, explanations or punctuation.",
  description: "This is a short description shown to customers. TRANSLATE it, do not summarise, shorten, rewrite or improve it. Every fact in the source must appear in the output: if the source lists what is included, the output lists the same things. Keep the length within 20 percent of the source.",
};

async function translate(text, to, kind) {
  if (!text || !text.trim()) return "";
  const prompt =
    `Translate the following German text into natural, professional ${LANG[to]} for a Swiss ` +
    `beauty and wellness booking marketplace.\n${FIELD_RULE[kind]}\n${REGISTER[to]}\n` +
    `Swiss conventions: prices stay in CHF, and Swiss German spelling uses ss rather than the eszett.\n` +
    `Return ONLY the translated text. No explanation, no markdown, no surrounding quotes.\n\n` +
    `<TEXT_TO_TRANSLATE>\n${text}\n</TEXT_TO_TRANSLATE>`;
  try {
    const out = (await model.generateContent(prompt)).response.text().trim();
    // A refusal or an explanation is a failure, not a translation.
    if (!out || out.length > Math.max(60, text.length * 4)) return "";
    return out;
  } catch (e) {
    console.error(`  ! translate failed (${to}): ${String(e).slice(0, 90)}`);
    return "";
  }
}

let wrote = 0, skipped = 0, failed = 0;

async function backfillServiceNames() {
  const { data, error } = await db
    .from("services")
    .select("id, name_de, name_fr, name_it")
    .not("name_de", "is", null);
  if (error) throw error;

  // group by DISTINCT German name , 264 rows, 59 names
  const byName = new Map();
  for (const r of data) {
    if (!r.name_de?.trim()) continue;
    if (r.name_fr && r.name_it) { skipped++; continue; }
    if (!byName.has(r.name_de)) byName.set(r.name_de, []);
    byName.get(r.name_de).push(r);
  }
  console.log(`\nSERVICE NAMES: ${data.length} rows, ${byName.size} distinct names needing work`);

  let n = 0;
  for (const [nameDe, rows] of byName) {
    if (n++ >= LIMIT) break;
    const [fr, it] = await Promise.all([translate(nameDe, "fr", "name"), translate(nameDe, "it", "name")]);
    if (!fr && !it) { failed++; console.log(`  FAIL  ${nameDe}`); continue; }
    console.log(`  ${nameDe}  ->  fr:${fr || "-"}  it:${it || "-"}   (${rows.length} row${rows.length > 1 ? "s" : ""})`);
    if (!APPLY) continue;
    const patch = {};
    if (fr) patch.name_fr = fr;
    if (it) patch.name_it = it;
    // Only rows still missing it , never clobber a salon's own translation.
    for (const r of rows) {
      const p = {};
      if (fr && !r.name_fr) p.name_fr = fr;
      if (it && !r.name_it) p.name_it = it;
      if (!Object.keys(p).length) continue;
      const { error: e } = await db.from("services").update(p).eq("id", r.id);
      if (e) console.error(`  ! update ${r.id}: ${e.message}`);
      else wrote++;
    }
  }
}

async function backfillDescriptions(table, base) {
  const cols = `id, ${base}_de, ${base}_fr, ${base}_it`;
  const { data, error } = await db.from(table).select(cols).not(`${base}_de`, "is", null);
  if (error) throw error;
  const todo = data.filter((r) => r[`${base}_de`]?.trim() && (!r[`${base}_fr`] || !r[`${base}_it`]));
  console.log(`\n${table.toUpperCase()}.${base}: ${data.length} with German, ${todo.length} needing work`);

  let n = 0;
  for (const r of todo) {
    if (n++ >= LIMIT) break;
    const src = r[`${base}_de`];
    const [fr, it] = await Promise.all([translate(src, "fr", "description"), translate(src, "it", "description")]);
    if (!fr && !it) { failed++; console.log(`  FAIL  ${src.slice(0, 50)}...`); continue; }
    console.log(`  ${src.slice(0, 46)}...  ->  fr:${(fr || "-").slice(0, 34)}...`);
    if (!APPLY) continue;
    const p = {};
    if (fr && !r[`${base}_fr`]) p[`${base}_fr`] = fr;
    if (it && !r[`${base}_it`]) p[`${base}_it`] = it;
    if (!Object.keys(p).length) continue;
    const { error: e } = await db.from(table).update(p).eq("id", r.id);
    if (e) console.error(`  ! update ${r.id}: ${e.message}`);
    else wrote++;
  }
}

console.log(APPLY ? "MODE: APPLY (writing)" : "MODE: DRY RUN (writing nothing, pass --apply to commit)");
await backfillServiceNames();
await backfillDescriptions("services", "description");
await backfillDescriptions("salons", "description");
console.log(`\nrows written: ${wrote} | already complete: ${skipped} | translation failures: ${failed}`);
