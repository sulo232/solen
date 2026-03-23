/**
 * collect-basel-salons.ts
 * Collects Basel beauty/wellness businesses from Google Places API
 * and upserts them into the salon_directory table.
 *
 * Run: npx tsx scripts/collect-basel-salons.ts
 *
 * Requires: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!GOOGLE_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing env vars. Check .env.local for GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Category mapping ──────────────────────────────────────────────────────────
const QUERIES: { query: string; category: string }[] = [
  { query: "coiffeur Basel", category: "coiffeur" },
  { query: "Friseur Basel", category: "coiffeur" },
  { query: "barbershop Basel", category: "barbershop" },
  { query: "nail salon Basel", category: "nails" },
  { query: "Nagelstudio Basel", category: "nails" },
  { query: "spa Basel", category: "spa" },
  { query: "wellness Basel", category: "spa" },
  { query: "makeup studio Basel", category: "makeup" },
  { query: "kosmetik Basel", category: "makeup" },
  { query: "waxing Basel", category: "waxing" },
];

// ── Quartier detection from postal code ───────────────────────────────────────
const POSTAL_TO_QUARTIER: Record<string, string> = {
  "4001": "Innenstadt",
  "4051": "Altstadt Grossbasel",
  "4052": "Gundeldingen",
  "4053": "Breite",
  "4054": "Bachletten",
  "4055": "St. Alban",
  "4056": "St. Johann",
  "4057": "Matthäus",
  "4058": "Kleinhüningen",
  "4059": "Binningen",
};

function detectQuartier(address: string): string {
  const postalMatch = address.match(/\b(40\d{2})\b/);
  if (postalMatch) {
    return POSTAL_TO_QUARTIER[postalMatch[1]] ?? "Basel";
  }
  return "Basel";
}

function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(40\d{2})\b/);
  return match ? match[1] : null;
}

// ── Google Places API helpers ─────────────────────────────────────────────────
interface PlaceSummary {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: { photo_reference: string }[];
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  opening_hours?: { periods?: unknown };
}

async function textSearch(query: string): Promise<PlaceSummary[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_KEY}&language=de&region=ch`;
  const res = await fetch(url);
  const data = (await res.json()) as { results: PlaceSummary[]; status: string; next_page_token?: string };
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.warn(`  ⚠️  Places API status: ${data.status} for "${query}"`);
  }
  return data.results ?? [];
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fields = "name,formatted_address,formatted_phone_number,website,url,opening_hours";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_KEY}&language=de`;
  const res = await fetch(url);
  const data = (await res.json()) as { result?: PlaceDetails; status: string };
  return data.result ?? null;
}

function photoUrl(photoRef: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_KEY}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Starting Basel salon directory collection...\n");

  // Track processed place_ids to avoid duplicate detail calls
  const processed = new Set<string>();
  const upserted: { name: string; category: string }[] = [];
  const skipped: string[] = [];

  for (const { query, category } of QUERIES) {
    console.log(`📍 Searching: "${query}"`);
    const results = await textSearch(query);
    console.log(`   Found ${results.length} results`);

    for (const place of results) {
      if (processed.has(place.place_id)) {
        // Merge category into existing entry
        const { data: existing } = await supabase
          .from("salon_directory")
          .select("id, categories")
          .eq("google_place_id", place.place_id)
          .single();
        if (existing && !existing.categories.includes(category)) {
          await supabase.from("salon_directory").update({
            categories: [...existing.categories, category],
          }).eq("id", existing.id);
        }
        continue;
      }

      processed.add(place.place_id);

      // Rate limit: 1 detail call / 200ms to stay under Google's QPS limit
      await new Promise((r) => setTimeout(r, 200));
      const details = await getPlaceDetails(place.place_id);

      const address = details?.formatted_address ?? place.formatted_address;
      const postalCode = extractPostalCode(address);
      const quartier = detectQuartier(address);
      const photo = place.photos?.[0]?.photo_reference
        ? photoUrl(place.photos[0].photo_reference)
        : null;

      const row = {
        name: place.name,
        address,
        postal_code: postalCode,
        quartier,
        phone: details?.formatted_phone_number ?? null,
        website: details?.website ?? null,
        google_maps_url: details?.url ?? null,
        google_place_id: place.place_id,
        google_rating: place.rating ?? null,
        google_review_count: place.user_ratings_total ?? 0,
        categories: [category],
        photo_url: photo,
        opening_hours: details?.opening_hours ?? null,
        is_claimed: false,
      };

      const { error } = await supabase
        .from("salon_directory")
        .upsert(row, { onConflict: "google_place_id", ignoreDuplicates: false });

      if (error) {
        console.error(`   ❌ Failed to upsert "${place.name}": ${error.message}`);
        skipped.push(place.name);
      } else {
        upserted.push({ name: place.name, category });
        process.stdout.write(`   ✓ ${place.name} (${quartier})\n`);
      }
    }

    // Pause between queries to respect rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n✅ Done!`);
  console.log(`   Upserted: ${upserted.length} entries`);
  console.log(`   Skipped (errors): ${skipped.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
