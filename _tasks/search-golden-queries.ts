/**
 * search-golden-queries.ts
 *
 * Golden-query verification harness for the Smart Search engine (Phase 1):
 * Postgres FTS + trigram (typo + as-you-type prefix) + one-way synonyms
 * (de colloquial + fr + it -> canonical) + rating-blended ranking, exposed as
 * the two SECURITY DEFINER RPCs:
 *
 *   - search_salons_ranked(p_q text, p_limit int) -> table(salon_id uuid, score real)
 *   - search_suggest(p_q text, p_city_id uuid, p_category text) -> jsonb {services[], salons[]}
 *
 * This script is READ-ONLY against the engine: it only CALLS the RPCs and reads
 * the salons table once (to build the "must never appear" set for the security
 * invariant). It never edits the RPCs, routes, migrations, or any DB row.
 *
 * It asserts INVARIANTS (not brittle hardcoded salon ids), prints a pass/fail
 * table, and exits non-zero if any assertion fails.
 *
 * Run:  npx tsx _tasks/search-golden-queries.ts
 *       (from the repo root: /Users/sulo/Documents/solen)
 *
 * Requires (loaded from .env.local, same as scripts/seed-coiffeur-rails.ts):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// -- Load .env.local (mirrors scripts/seed-coiffeur-rails.ts + enrich-coiffeur-demo.ts) --
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
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(
      `\n[search-golden] Missing env var: ${name}. ` +
        `Expected it in ${envPath} (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), ` +
        `matching scripts/seed-coiffeur-rails.ts.`,
    );
    process.exit(2);
  }
  return val;
}

// -- Types mirroring the RPC contract (read-only; we do not own these shapes) --
type RankedRow = { salon_id: string; score: number };
type SuggestService = {
  id: string;
  name_de: string;
  name_en: string | null;
  category: string;
  price: number | null;
};
type SuggestSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  cover_photo_url: string | null;
  cover_image: string | null;
};
type SuggestPayload = { services: SuggestService[]; salons: SuggestSalon[] };

type CaseResult = {
  name: string;
  query: string;
  expectation: string;
  pass: boolean;
  detail: string;
  // Optional root-cause classification for a KNOWN-shape failure, so the output
  // is self-diagnosing. One of: "engine-bug" | "test-data-gap" |
  // "contract-boundary". Left undefined when the case passes or the cause is
  // not pre-characterized.
  note?: string;
};

// -- Thin RPC wrappers (the only way this harness touches the engine) ----------
async function rankedFor(
  supabase: SupabaseClient,
  q: string,
  limit = 30,
): Promise<RankedRow[]> {
  const { data, error } = await supabase.rpc("search_salons_ranked", {
    p_q: q,
    p_limit: limit,
  });
  if (error) {
    throw new Error(`search_salons_ranked("${q}") RPC error: ${error.message}`);
  }
  return (data ?? []) as RankedRow[];
}

async function suggestFor(
  supabase: SupabaseClient,
  q: string,
  cityId: string | null = null,
  category: string | null = null,
): Promise<SuggestPayload> {
  const { data, error } = await supabase.rpc("search_suggest", {
    p_q: q,
    p_city_id: cityId,
    p_category: category,
  });
  if (error) {
    throw new Error(`search_suggest("${q}") RPC error: ${error.message}`);
  }
  const payload = (data ?? { services: [], salons: [] }) as SuggestPayload;
  return {
    services: payload.services ?? [],
    salons: payload.salons ?? [],
  };
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("[search-golden] Service-role env loaded cleanly.");
  console.log(`[search-golden] Target: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: CaseResult[] = [];
  const record = (
    name: string,
    query: string,
    expectation: string,
    pass: boolean,
    detail: string,
    note?: string,
  ) => results.push({ name, query, expectation, pass, detail, note });

  // ---------------------------------------------------------------------------
  // 1. exact: "Haarschnitt" -> >=1 salon
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "Haarschnitt");
    record(
      "exact",
      "Haarschnitt",
      ">=1 salon (FTS exact match)",
      rows.length >= 1,
      `${rows.length} salon(s)`,
    );
  } catch (e) {
    record("exact", "Haarschnitt", ">=1 salon", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 2. typo: "haarschnit" (missing trailing t) -> still >=1 (trigram)
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "haarschnit");
    record(
      "typo",
      "haarschnit",
      ">=1 salon (trigram tolerates 1-char typo)",
      rows.length >= 1,
      `${rows.length} salon(s)`,
    );
  } catch (e) {
    record("typo", "haarschnit", ">=1 salon", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 3. prefix / as-you-type: "herr" -> >=1 (should reach Herren...)
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "herr");
    record(
      "prefix",
      "herr",
      ">=1 salon (prefix reaches Herren* services)",
      rows.length >= 1,
      `${rows.length} salon(s)`,
    );
  } catch (e) {
    record("prefix", "herr", ">=1 salon", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 4. compound: "Haarschnitt" should also surface Herren-compound services via
  //    the ILIKE branch. Assert a salon offering a service whose name contains a
  //    "Herren...Haarschnitt"-style compound appears in the ranked result.
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "Haarschnitt");
    const rankedIds = new Set(rows.map((r) => r.salon_id));

    // Find salons that have a compound men's-haircut service. We look for service
    // names that contain "herren" AND a haircut token (haarschnitt/schnitt/cut),
    // restricted to the visible set so the assertion only holds the engine to
    // salons it is actually allowed to return.
    const { data: compoundServices, error: csErr } = await supabase
      .from("services")
      .select("salon_id, name_de, name_en, is_active")
      .eq("is_active", true)
      .ilike("name_de", "%herren%");
    if (csErr) throw new Error(`compound probe (services) failed: ${csErr.message}`);

    const compoundSalonIds = new Set(
      (compoundServices ?? [])
        .filter((s) => {
          const n = `${s.name_de ?? ""} ${s.name_en ?? ""}`.toLowerCase();
          return (
            n.includes("herren") &&
            (n.includes("haarschnitt") || n.includes("schnitt") || n.includes("cut"))
          );
        })
        .map((s) => s.salon_id as string),
    );

    // Of those compound-service salons, which are actually marketplace-visible?
    let visibleCompoundIds: string[] = [];
    if (compoundSalonIds.size > 0) {
      const { data: visRows, error: visErr } = await supabase
        .from("salons")
        .select("id, is_active, listed_on_marketplace, is_test")
        .in("id", Array.from(compoundSalonIds));
      if (visErr) throw new Error(`compound probe (salons) failed: ${visErr.message}`);
      visibleCompoundIds = (visRows ?? [])
        .filter(
          (s) =>
            s.is_active === true &&
            s.listed_on_marketplace === true &&
            s.is_test !== true,
        )
        .map((s) => s.id as string);
    }

    if (visibleCompoundIds.length === 0) {
      record(
        "compound",
        "Haarschnitt -> Herren-compound",
        "a salon with a Herren* compound haircut service appears",
        false,
        "SKIP/NO-DATA: no marketplace-visible salon has a Herren-compound haircut service to assert against",
      );
    } else {
      const hit = visibleCompoundIds.some((id) => rankedIds.has(id));
      record(
        "compound",
        "Haarschnitt -> Herren-compound",
        "a salon with a Herren* compound haircut service appears",
        hit,
        hit
          ? `matched (>=1 of ${visibleCompoundIds.length} compound salon(s) is in ranked result)`
          : `none of ${visibleCompoundIds.length} visible compound salon(s) appeared in ${rankedIds.size} ranked id(s)`,
      );
    }
  } catch (e) {
    record(
      "compound",
      "Haarschnitt -> Herren-compound",
      "a salon with a Herren* compound haircut service appears",
      false,
      (e as Error).message,
    );
  }

  // ---------------------------------------------------------------------------
  // 5. synonym de: "maenner" / "männer" -> hair-cut results.
  //    Both spellings expand via the synonym table to "herren haarschnitt".
  //    "männer" is a seeded term; "maenner" exercises unaccent/transliteration.
  //    Invariant: each returns >=1 salon, and the result overlaps the result for
  //    the canonical "herren haarschnitt" (proves it really expanded to haircuts,
  //    not just matched something incidental).
  // ---------------------------------------------------------------------------
  try {
    const canonical = await rankedFor(supabase, "herren haarschnitt");
    const canonicalIds = new Set(canonical.map((r) => r.salon_id));

    for (const variant of ["maenner", "männer"]) {
      const rows = await rankedFor(supabase, variant);
      const overlap = rows.some((r) => canonicalIds.has(r.salon_id));
      const pass =
        rows.length >= 1 && (canonicalIds.size === 0 ? true : overlap);
      // Pre-characterized failure notes (see SEARCH_GOLDEN_RESULTS.md):
      //  - "maenner": f_unaccent('männer')='manner', but 'maenner' stays
      //    'maenner'; no ae->ä transliteration and no 'maenner' synonym seed, so
      //    it never expands. test-data-gap (missing seed) / engine (no translit).
      //  - "männer": expands fine, but websearch_to_tsquery ANDs the original
      //    token with the canonical -> 'mann' & 'herr' & 'haarschnitt'; the real
      //    haircut docs lack literal 'mann', so FTS misses; the rows returned are
      //    only trigram hits on 'manner', hence zero overlap. engine-bug.
      const note = pass
        ? undefined
        : variant === "maenner"
          ? "test-data-gap: no 'maenner' synonym seed and f_unaccent has no ae->ä transliteration ('maenner' != 'manner'), so no expansion"
          : "engine-bug: synonym expansion is ANDed with the original token by websearch_to_tsquery ('mann' & 'herr' & 'haarschnitt'); haircut docs lack 'mann', so the canonical set is missed";
      record(
        `synonym-de:${variant}`,
        variant,
        ">=1 salon, expands to herren-haarschnitt set",
        pass,
        `${rows.length} salon(s); overlap-with-canonical=${overlap} (canonical set=${canonicalIds.size})`,
        note,
      );
    }
  } catch (e) {
    record(
      "synonym-de",
      "maenner / männer",
      ">=1 salon (synonym expansion)",
      false,
      (e as Error).message,
    );
  }

  // ---------------------------------------------------------------------------
  // 6. fr: "coupe homme" -> >=1 (fr->de synonym bridge to herren haarschnitt)
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "coupe homme");
    record(
      "fr",
      "coupe homme",
      ">=1 salon (fr->de synonym bridge)",
      rows.length >= 1,
      `${rows.length} salon(s)`,
    );
  } catch (e) {
    record("fr", "coupe homme", ">=1 salon", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 7. it: "taglio uomo" -> >=1 (it->de synonym bridge to herren haarschnitt)
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "taglio uomo");
    record(
      "it",
      "taglio uomo",
      ">=1 salon (it->de synonym bridge)",
      rows.length >= 1,
      `${rows.length} salon(s)`,
      rows.length >= 1
        ? undefined
        : "engine-bug: expands to 'taglio uomo herren haarschnitt' but websearch_to_tsquery ANDs all tokens ('taglio' & 'uomo' & 'herr' & 'haarschnitt'); no DE service doc contains 'taglio'/'uomo', so the AND can never match. (fr 'coupe homme' only passes because 3 salons happen to have bilingual fr+de docs.)",
    );
  } catch (e) {
    record("it", "taglio uomo", ">=1 salon", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 8. junk: "asdfqwerty" -> exactly 0
  // ---------------------------------------------------------------------------
  try {
    const rows = await rankedFor(supabase, "asdfqwerty");
    record(
      "junk",
      "asdfqwerty",
      "exactly 0 salons",
      rows.length === 0,
      `${rows.length} salon(s)`,
    );
  } catch (e) {
    record("junk", "asdfqwerty", "exactly 0 salons", false, (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // 9. short guard: "" and "a" -> 0.
  //    "" : the RPC nullifies blank input, so it returns 0. PASS expected.
  //    "a": the RPC has NO minimum-length guard. Its ILIKE branches run
  //         name ilike '%a%', which matches any name containing the letter "a",
  //         so a single char leaks many salons at the RPC layer. The 2-char
  //         guard lives ONLY in the HTTP routes (q.length < 2), not in the RPC.
  //         This case therefore intentionally FAILS to flag that any non-route
  //         caller of the RPC bypasses the guard (contract-boundary finding).
  // ---------------------------------------------------------------------------
  for (const q of ["", "a"]) {
    try {
      const rows = await rankedFor(supabase, q);
      const pass = rows.length === 0;
      record(
        `short-guard:"${q}"`,
        q === "" ? "(empty)" : q,
        "0 salons (too short / blank)",
        pass,
        `${rows.length} salon(s)`,
        pass || q !== "a"
          ? undefined
          : "contract-boundary: the 2-char minimum is enforced in the HTTP routes (q.length < 2), NOT in the RPC; calling the RPC directly with 'a' runs ILIKE '%a%' and leaks. Defense-in-depth gap for non-route RPC callers.",
      );
    } catch (e) {
      record(
        `short-guard:"${q}"`,
        q === "" ? "(empty)" : q,
        "0 salons",
        false,
        (e as Error).message,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 10. SECURITY INVARIANT (most important):
  //     No salon with is_test=true OR listed_on_marketplace=false OR
  //     is_active=false EVER appears in ANY search_salons_ranked result, across
  //     all golden cases AND a set of broad probe queries designed to surface as
  //     many salons as possible.
  //
  //     Implementation: read the salons table for the ids matching those
  //     conditions (the "must never appear" set), then assert NONE appear in any
  //     ranked result we collected.
  // ---------------------------------------------------------------------------
  try {
    // Build the hidden set exactly per spec: is_test=true OR
    // listed_on_marketplace=false OR is_active=false. PostgREST `.or()` ORs the
    // conditions together.
    const { data: hiddenRows, error: hiddenErr } = await supabase
      .from("salons")
      .select("id, name, is_test, listed_on_marketplace, is_active")
      .or("is_test.eq.true,listed_on_marketplace.eq.false,is_active.eq.false");
    if (hiddenErr) {
      throw new Error(`hidden-set read failed: ${hiddenErr.message}`);
    }
    const hiddenIds = new Set((hiddenRows ?? []).map((r) => r.id as string));

    // Collect every ranked salon id we have seen so far across the golden cases,
    // plus a battery of broad probes (each canonical/synonym family + bare
    // category words) to maximize coverage of what the engine can return.
    const probeQueries = [
      // golden-case queries (re-run so the security set is self-contained)
      "Haarschnitt",
      "haarschnit",
      "herr",
      "herren haarschnitt",
      "maenner",
      "männer",
      "coupe homme",
      "taglio uomo",
      // broad category / canonical probes
      "damen haarschnitt",
      "färben",
      "strähnen balayage",
      "bart",
      "nägel maniküre",
      "pediküre",
      "wimpern",
      "augenbrauen",
      "waxing",
      "make-up",
      "massage",
      "coiffeur",
      "salon",
      "studio",
      "haar",
      "beauty",
      "spa",
      "nails",
      "barber",
    ];

    const seenRankedIds = new Set<string>();
    // include ids already collected via the recorded cases is not trivially
    // available, so we re-run a high-limit ranked query per probe.
    for (const q of probeQueries) {
      const rows = await rankedFor(supabase, q, 500);
      rows.forEach((r) => seenRankedIds.add(r.salon_id));
    }

    const leaked = Array.from(seenRankedIds).filter((id) => hiddenIds.has(id));

    // Annotate leaks with why each is hidden, for a clear diagnosis.
    const leakDetail =
      leaked.length === 0
        ? `0 leaks. hidden-set size=${hiddenIds.size}; distinct ranked salons probed=${seenRankedIds.size}; probe queries=${probeQueries.length}`
        : leaked
            .map((id) => {
              const row = (hiddenRows ?? []).find((r) => r.id === id) as
                | {
                    name: string;
                    is_test: boolean;
                    listed_on_marketplace: boolean | null;
                    is_active: boolean;
                  }
                | undefined;
              const reasons = [
                row?.is_test === true ? "is_test=true" : null,
                row?.listed_on_marketplace === false
                  ? "listed_on_marketplace=false"
                  : null,
                row?.is_active === false ? "is_active=false" : null,
              ]
                .filter(Boolean)
                .join(" & ");
              return `${id} (${row?.name ?? "?"}) [${reasons}]`;
            })
            .join("; ");

    record(
      "SECURITY-INVARIANT",
      `${probeQueries.length} probe queries`,
      "0 hidden salons (test/unlisted/inactive) in ANY ranked result",
      leaked.length === 0,
      leakDetail,
    );
  } catch (e) {
    record(
      "SECURITY-INVARIANT",
      "(salons table read + probes)",
      "0 hidden salons in any ranked result",
      false,
      (e as Error).message,
    );
  }

  // ---------------------------------------------------------------------------
  // Bonus visibility check on suggest(): the suggest RPC must also obey the gates
  // for its salons[] group. Re-uses the hidden set. Non-fatal extra coverage; it
  // still counts toward pass/fail because suggest shares the same contract.
  // ---------------------------------------------------------------------------
  try {
    const { data: hiddenRows } = await supabase
      .from("salons")
      .select("id")
      .or("is_test.eq.true,listed_on_marketplace.eq.false,is_active.eq.false");
    const hiddenIds = new Set((hiddenRows ?? []).map((r) => r.id as string));

    const suggestProbes = ["haar", "salon", "coiffeur", "studio", "massage"];
    const leaked: string[] = [];
    for (const q of suggestProbes) {
      const payload = await suggestFor(supabase, q);
      payload.salons.forEach((s) => {
        if (hiddenIds.has(s.id)) leaked.push(`${s.id} (${s.name})`);
      });
    }
    record(
      "SECURITY-INVARIANT(suggest)",
      `${suggestProbes.length} suggest probes`,
      "0 hidden salons in any suggest salons[] group",
      leaked.length === 0,
      leaked.length === 0
        ? `0 leaks across ${suggestProbes.length} suggest probes`
        : `LEAK: ${leaked.join("; ")}`,
    );
  } catch (e) {
    record(
      "SECURITY-INVARIANT(suggest)",
      "(suggest probes)",
      "0 hidden salons in suggest salons[]",
      false,
      (e as Error).message,
    );
  }

  // ---------------------------------------------------------------------------
  // Print the pass/fail table.
  // ---------------------------------------------------------------------------
  const pad = (s: string, n: number) =>
    s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);

  console.log("=".repeat(110));
  console.log(
    `${pad("CASE", 26)} ${pad("QUERY", 22)} ${pad("RESULT", 7)} DETAIL`,
  );
  console.log("-".repeat(110));
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    console.log(
      `${pad(r.name, 26)} ${pad(r.query, 22)} ${pad(status, 7)} ${r.detail}`,
    );
  }
  console.log("=".repeat(110));

  const failed = results.filter((r) => !r.pass);
  const passed = results.length - failed.length;
  console.log(
    `\nSUMMARY: ${passed}/${results.length} cases passed, ${failed.length} failed.`,
  );

  const sec = results.find((r) => r.name === "SECURITY-INVARIANT");
  if (sec) {
    console.log(
      `SECURITY INVARIANT (ranked): ${sec.pass ? "PASS, no hidden salons leaked" : "FAIL: " + sec.detail}`,
    );
  }

  if (failed.length > 0) {
    console.log("\nFAILED CASES (with root-cause classification where known):");
    for (const r of failed) {
      console.log(`  - ${r.name} ("${r.query}"): expected ${r.expectation}; got ${r.detail}`);
      if (r.note) console.log(`      -> ${r.note}`);
    }
    process.exit(1);
  }

  console.log("\nAll golden-query invariants hold.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n[search-golden] Fatal error:", err);
  process.exit(1);
});
