// scripts/seed-review-text.mjs
//
// BACKFILL, not fabrication: taste rule 1 (CLAUDE.md, amended 2026-08-02, owner verbatim)
// "SEEDING THE DATABASE IS NOT FABRICATION, IT IS THE FIX... a row in the database that the UI
// reads through its normal query is a live source, whoever inserted it." Solen is pre-launch,
// every row already in `reviews` is seed data. 260 reviews exist, 41 carry a written comment,
// 219 do not (comment IS NULL, confirmed live, never an empty string). This script writes ONLY
// the `comment` column, ONLY on rows where it is currently null. It changes no rating, no
// user_id, no salon_id, no moderation_status, no date on any row.
//
// This is a DIFFERENT job from the `case "reviews"` block in
// app/api/admin/test-salon/seed/route.ts (read, not touched): that route INSERTS five fresh
// review rows for one freshly-created test salon. This script UPDATES the comment column on
// rows that already exist across the whole table. Column set (salon_id, user_id, rating,
// comment, staff_member_id, created_at) and the phantom-column warning that route carries
// forward here too: `reviews` has no `service_id` column, only booking_id + staff_member_id
// link a review to what it was about, and this script never inserts a row at all so that
// column is moot, noted only because the copy bank below deliberately never claims a specific
// service or a specific named staff member per row: staff_member_id is null on most of the
// empty rows (confirmed against the backup), so naming a person or service that row's own data
// does not back would be exactly the fabrication taste rule 1 still forbids. The voice below
// stays generic-but-specific (a detail, a wait, a price, a tone) rather than a specific name.
//
// ENV + CLIENT PATTERN: copied from scripts/lib/stuck-rows.mjs (read before writing this,
// matched rather than reinvented). Hand-rolled .env.local read, no dotenv dependency,
// service-role key, @supabase/supabase-js imported LAZILY inside the async function so a
// caller that never reaches the DB call never pays the import cost.
//
// COMPARE-AND-SET: copied from app/api/cron/walkin-no-show/route.ts. The WHERE clause on the
// UPDATE re-asserts `comment IS NULL`, the same emptiness check the initial SELECT used, so a
// row that gained text between the SELECT and this script's own UPDATE (another process, a
// manual edit) is left alone: PostgREST returns error:null on a zero-row update, so the CAS is
// proven by chaining .select().maybeSingle() and checking the result is non-null, not by the
// absence of an error. A zero-row match is a silent skip, not a failure.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BACKUP_PATH = "/private/tmp/claude-501/reviews-backup.json";

function loadEnv(repoRoot) {
  for (const p of [
    join(repoRoot, ".env.local"),
    join(process.cwd(), ".env.local"),
    "/Users/sulo/Documents/solen/.env.local",
  ]) {
    if (!existsSync(p)) continue;
    const out = {};
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const i = line.indexOf("=");
      if (i < 1 || line.trim().startsWith("#")) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return out;
  }
  return null;
}

// COPY BANK. German, formal Sie register (never du), no em-dash, no en-dash, no exclamation
// marks, no superlatives. An ordinary Swiss customer voice: a wait, a price, a detail, a tone,
// sometimes a real complaint, never a specific name the row's own data cannot back. Each tier
// clears the required minimum (5-star and 4-star >= 6, 3-star >= 3, 2-star >= 2, 1-star >= 1).
const COMMENTS_BY_RATING = {
  5: [
    "Sehr zufrieden mit dem Ergebnis. Die Beratung vor dem Termin war ausführlich, und ich wurde genau nach meinen Wünschen gefragt.",
    "Pünktlicher Termin, freundliches Team und ein Ergebnis, das genau meinen Vorstellungen entsprach. Gerne wieder.",
    "Ich komme seit über einem Jahr regelmässig hierher und bin jedes Mal zufrieden. Man nimmt sich Zeit und hört genau zu.",
    "Kompetente Beratung, sauberes Studio und ein Resultat, das hält. Kann ich uneingeschränkt empfehlen.",
    "Der Termin lief entspannt ab, keine Hektik, und das Ergebnis hat meine Erwartungen übertroffen.",
    "Schon der dritte Besuch hier, und bisher war jedes Ergebnis überzeugend. Die Preise sind fair für die Qualität.",
    "Angenehme Atmosphäre, das Personal ist eingespielt, und das Ergebnis stimmt bis ins Detail.",
    "Habe spontan einen Termin bekommen und war positiv überrascht, wie genau auf meine Wünsche eingegangen wurde.",
  ],
  4: [
    "Guter Termin, das Ergebnis passt. Einzig die Wartezeit im Salon war etwas länger als erwartet.",
    "Freundliche Beratung und ein solides Ergebnis. Die Parkplatzsituation in der Nähe ist allerdings mühsam.",
    "Insgesamt zufrieden, auch wenn der Termin knapp zehn Minuten später als vereinbart begonnen hat.",
    "Das Ergebnis ist gut, die Terminbuchung hätte online aber klarer sein können.",
    "Freundliches Personal, ordentliches Ergebnis. Die Preise liegen etwas über dem, was ich erwartet hatte.",
    "Schöner Salon, gutes Ergebnis, nur die Musik war für meinen Geschmack etwas laut.",
    "Bin zufrieden mit dem Termin, die Beratung hätte aber etwas ausführlicher sein dürfen.",
    "Solides Ergebnis und ein freundlicher Empfang, auch wenn es beim Bezahlen etwas gedauert hat.",
  ],
  3: [
    "Das Ergebnis war in Ordnung, aber nicht das, was ich mir vorgestellt hatte. Die Beratung war eher kurz.",
    "Habe fast 30 Minuten auf meinen Termin gewartet, ohne dass jemand Bescheid gesagt hat. Das Ergebnis selbst war akzeptabel.",
    "Freundliches Personal, aber das Ergebnis hat mich nicht ganz überzeugt. Werde es vielleicht noch einmal versuchen.",
    "Der Termin war pünktlich, das Ergebnis aber eher durchschnittlich für den Preis.",
  ],
  2: [
    "Lange gewartet, obwohl ich einen festen Termin hatte. Das Ergebnis hat meine Erwartungen leider nicht erfüllt.",
    "Die Beratung war knapp, und das Ergebnis entsprach nicht dem, was besprochen wurde. Für den Preis hatte ich mehr erwartet.",
    "Der Termin wurde ohne Vorwarnung um eine halbe Stunde verschoben. Das Ergebnis war zudem nur mittelmässig.",
  ],
  1: [
    "Der Termin wurde kurzfristig abgesagt, ohne dass ich informiert wurde. Ich habe umsonst freigenommen und bin nicht mehr zurückgekommen.",
    "Das Ergebnis entsprach überhaupt nicht dem, was ich gebucht hatte, und eine Nachbesserung wurde mir nicht angeboten.",
  ],
};

// A shuffled, self-refilling queue per rating so consecutive picks for the same rating do not
// repeat until every variant in that tier has been used once. Reduces the chance that two
// reviews at the same salon read identically.
function makeCycler(items) {
  let pool = [];
  function refill() {
    pool = [...items];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return function next() {
    if (pool.length === 0) refill();
    return pool.pop();
  };
}

async function main() {
  // Step 5: the backup must exist and be non-empty BEFORE anything else runs.
  if (!existsSync(BACKUP_PATH)) {
    console.error(`[seed-review-text] STOP: backup file missing at ${BACKUP_PATH}. Not touching the database.`);
    process.exit(1);
  }
  let backupRaw;
  try {
    backupRaw = readFileSync(BACKUP_PATH, "utf8");
  } catch (err) {
    console.error(`[seed-review-text] STOP: could not read backup file: ${err?.message || err}`);
    process.exit(1);
  }
  let backup;
  try {
    backup = JSON.parse(backupRaw);
  } catch (err) {
    console.error(`[seed-review-text] STOP: backup file is not valid JSON: ${err?.message || err}`);
    process.exit(1);
  }
  if (!Array.isArray(backup) || backup.length === 0) {
    console.error(`[seed-review-text] STOP: backup file at ${BACKUP_PATH} is empty or not an array (${Array.isArray(backup) ? backup.length : typeof backup} rows). Not touching the database.`);
    process.exit(1);
  }
  console.log(`[seed-review-text] backup confirmed: ${backup.length} rows at ${BACKUP_PATH}.`);

  const repoRoot = process.cwd();
  const env = loadEnv(repoRoot);
  const url = env?.NEXT_PUBLIC_SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[seed-review-text] STOP: no NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY found in .env.local");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, key, { auth: { persistSession: false } });

  // ---- BEFORE snapshot -------------------------------------------------------------
  const { count: totalBefore, error: totalErr } = await db.from("reviews").select("id", { count: "exact", head: true });
  if (totalErr) {
    console.error("[seed-review-text] STOP: could not count reviews:", totalErr.message);
    process.exit(1);
  }
  const { count: withTextBefore, error: textErr } = await db
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .not("comment", "is", null);
  if (textErr) {
    console.error("[seed-review-text] STOP: could not count reviews with text:", textErr.message);
    process.exit(1);
  }
  console.log(`[seed-review-text] BEFORE: total reviews ${totalBefore}, with text ${withTextBefore}, empty ${totalBefore - withTextBefore}.`);

  // ---- Load every empty row, paginated (no assumption the table stays under 1000) --
  const targets = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const to = from + PAGE - 1;
    const { data, error } = await db
      .from("reviews")
      .select("id, rating, salon_id")
      .is("comment", null)
      .order("id", { ascending: true })
      .range(from, to);
    if (error) {
      console.error("[seed-review-text] STOP: could not load empty rows:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    targets.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`[seed-review-text] found ${targets.length} rows with an empty comment.`);

  // Cyclers are scoped PER (salon_id, rating), not shared across the whole run. A single
  // global shuffled deck per rating, once consumed in DB id-order across every salon, can hand
  // two rows at the SAME salon a repeat well before the deck exhausts, because that salon's own
  // rows are interleaved with everyone else's in the draw order. Measured on the first run of
  // this script: Salon Lumiere's 7 five-star rows drew only 4 distinct texts (3 repeats), its 7
  // four-star rows drew only 5 (2 repeats), a same-salon duplicate the "vary them" requirement
  // was written to prevent. Scoping the cycler to (salon_id, rating) means a salon cannot repeat
  // a variant until it has used every one of that tier's texts at least once itself.
  const cyclersBySalonAndRating = new Map();
  function cyclerFor(salonId, rating) {
    const key = `${salonId}:${rating}`;
    let cycler = cyclersBySalonAndRating.get(key);
    if (!cycler) {
      const pool = COMMENTS_BY_RATING[String(rating)] ?? COMMENTS_BY_RATING[3];
      cycler = makeCycler(pool);
      cyclersBySalonAndRating.set(key, cycler);
    }
    return cycler;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of targets) {
    const cycler = cyclerFor(row.salon_id, row.rating);
    const text = cycler();

    // Compare-and-set: re-assert comment IS NULL in the UPDATE's own WHERE clause, same
    // discipline as app/api/cron/walkin-no-show/route.ts. Only the comment column is written.
    const { data: updated, error: updErr } = await db
      .from("reviews")
      .update({ comment: text })
      .eq("id", row.id)
      .is("comment", null)
      .select("id")
      .maybeSingle();

    if (updErr) {
      console.error(`[seed-review-text] row ${row.id}: update failed:`, updErr.message);
      failed++;
      continue;
    }
    if (!updated) {
      // 0 rows matched: this row gained text between our SELECT and this UPDATE. Not an
      // error, just a lost race, same treatment as the cron's no-show sweep.
      skipped++;
      continue;
    }
    written++;
  }

  // ---- AFTER snapshot ---------------------------------------------------------------
  const { count: totalAfter } = await db.from("reviews").select("id", { count: "exact", head: true });
  const { count: withTextAfter } = await db
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .not("comment", "is", null);

  console.log(`[seed-review-text] AFTER: total reviews ${totalAfter}, with text ${withTextAfter}, empty ${totalAfter - withTextAfter}.`);
  console.log(`[seed-review-text] wrote ${written}, skipped (raced/no-longer-empty) ${skipped}, failed ${failed}.`);
}

main().catch((err) => {
  console.error("[seed-review-text] unexpected error:", err?.message || err);
  process.exit(1);
});
