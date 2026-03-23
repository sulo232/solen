/**
 * Backfill embeddings for all active services.
 * Usage: npx tsx scripts/backfill-embeddings.ts
 *
 * Requires env vars: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-004";
const BATCH_SIZE = 10;

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const geminiKey = requireEnv("GEMINI_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseKey);
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Fetch all active services
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name_de, name_en, category, price, salon_id")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch services:", error.message);
    process.exit(1);
  }

  console.log(`Found ${services.length} active services to embed.`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < services.length; i += BATCH_SIZE) {
    const batch = services.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (service) => {
        const text = [
          service.name_de,
          service.name_en ?? "",
          `Kategorie: ${service.category}`,
          service.price ? `${service.price} CHF` : "",
        ]
          .filter(Boolean)
          .join(" | ");

        const embResult = await model.embedContent(text);
        const embedding = embResult.embedding.values;

        const { error: upsertError } = await supabase
          .from("search_embeddings")
          .upsert(
            {
              entity_type: "service",
              entity_id: service.id,
              category: service.category,
              text_content: text,
              embedding: JSON.stringify(embedding),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "entity_type,entity_id" }
          );

        if (upsertError) throw upsertError;
      })
    );

    results.forEach((r) => {
      if (r.status === "fulfilled") processed++;
      else {
        errors++;
        console.error("Embedding error:", (r as PromiseRejectedResult).reason);
      }
    });

    console.log(`Progress: ${processed + errors}/${services.length} (${errors} errors)`);

    // Cooldown between batches
    if (i + BATCH_SIZE < services.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! Processed: ${processed}, Errors: ${errors}, Total: ${services.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
