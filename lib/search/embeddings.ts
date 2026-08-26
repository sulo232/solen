import { getServerEnv } from "@/lib/env";

// gemini-embedding-001 (text-embedding-004 was retired -> 404 on embedContent).
// Truncated to 768 dims to match the search_embeddings vector(768) column + HNSW
// index. The index is cosine, so truncation needs no L2 renormalization.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

/**
 * Generate a 768-dim embedding via Gemini (REST embedContent).
 *
 * taskType defaults to RETRIEVAL_QUERY (query-time callers: /api/salons/search,
 * /api/search/smart). Index/backfill callers should pass "RETRIEVAL_DOCUMENT"
 * so document and query vectors live in the asymmetric-retrieval space.
 */
export async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const apiKey = getServerEnv().GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMS,
        taskType,
      }),
      // 10000ms: every search which misses cache goes through this call,
      // same bound as app/api/auth/verify-phone/send/route.ts (gateway/short call)
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini embedContent failed: ${res.status} ${(await res.text()).slice(0, 160)}`);
  }
  const json = (await res.json()) as { embedding?: { values?: number[] } };
  const values = json.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMS) {
    throw new Error(`Gemini embedContent returned ${values?.length ?? 0} dims (expected ${EMBEDDING_DIMS})`);
  }
  return values;
}

/**
 * Build a searchable text representation of a service for embedding.
 */
export function buildServiceEmbeddingText(service: {
  name_de: string;
  name_en?: string;
  category: string;
  price?: number;
}): string {
  const parts = [
    service.name_de,
    service.name_en ?? "",
    `Kategorie: ${service.category}`,
  ];
  if (service.price) parts.push(`${service.price} CHF`);
  return parts.filter(Boolean).join(" | ");
}
