import { getServerEnv } from "@/lib/env";

// gemini-embedding-001 (text-embedding-004 was retired -> 404 on embedContent).
// Truncated to 768 dims to match the search_embeddings vector(768) column + HNSW
// index. The index is cosine, so truncation needs no L2 renormalization.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

// In-memory TTL cache, module-scope (same pattern as app/api/transit/nearest-stop/
// route.ts's stopCache and app/api/search/geocode/route.ts's servedCitiesCache).
// Only RETRIEVAL_QUERY embeddings are cached here: RETRIEVAL_DOCUMENT embeddings
// are generated once during backfill over thousands of distinct service texts, so
// caching them would just grow memory for no hit rate (each text is seen once).
// Query text is repeat-typed by many users ("haar", "haarschnitt", ...), so this
// is the side with an actual cache hit rate.
//
// TTL is 6 hours. An embedding for a fixed string is deterministic for a fixed
// model, so the TTL is not there for correctness, it exists only to bound memory
// and to let a model change (EMBEDDING_MODEL bump) take effect within a bounded
// window instead of living forever.
const QUERY_EMBEDDING_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// The cache key is user-controlled text, so an unbounded Map would be a memory
// leak an attacker could drive by sending millions of distinct search strings.
// Capped at 500 entries; once full, the oldest entry (by fetchedAt) is evicted
// before inserting a new one. A plain loop over 500 entries is cheap enough that
// no library / heap structure is needed here.
const QUERY_EMBEDDING_CACHE_MAX_SIZE = 500;

type CachedEmbedding = { embedding: number[]; fetchedAt: number };
const queryEmbeddingCache = new Map<string, CachedEmbedding>();

function queryEmbeddingCacheKey(text: string, taskType: string): string {
  // Normalized so "Haar", "haar", and " haar " all hit the same entry. taskType
  // is included so a future RETRIEVAL_DOCUMENT cache (if ever added) can never
  // collide with a RETRIEVAL_QUERY entry for the same text.
  return `${taskType}:${text.trim().toLowerCase()}`;
}

function evictOldestQueryEmbedding(): void {
  let oldestKey: string | undefined;
  let oldestAt = Infinity;
  for (const [key, entry] of queryEmbeddingCache) {
    if (entry.fetchedAt < oldestAt) {
      oldestAt = entry.fetchedAt;
      oldestKey = key;
    }
  }
  if (oldestKey !== undefined) queryEmbeddingCache.delete(oldestKey);
}

/** Test-only: clears the query embedding cache between test cases. */
export function __resetEmbeddingCache(): void {
  queryEmbeddingCache.clear();
}

/**
 * Generate a 768-dim embedding via Gemini (REST embedContent).
 *
 * taskType defaults to RETRIEVAL_QUERY (query-time callers: /api/salons/search,
 * /api/search/smart). Index/backfill callers should pass "RETRIEVAL_DOCUMENT"
 * so document and query vectors live in the asymmetric-retrieval space.
 *
 * RETRIEVAL_QUERY calls are served from an in-memory TTL cache when the same
 * (normalized) text was embedded within the last 6 hours, see
 * queryEmbeddingCache above. A failed call (missing key, non-200, wrong dim
 * count) is never cached, so one Gemini blip cannot poison a query for 6 hours.
 */
export async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const cacheKey = taskType === "RETRIEVAL_QUERY" ? queryEmbeddingCacheKey(text, taskType) : null;
  if (cacheKey !== null) {
    const cached = queryEmbeddingCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < QUERY_EMBEDDING_CACHE_TTL_MS) {
      return [...cached.embedding];
    }
  }

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

  if (cacheKey !== null) {
    if (queryEmbeddingCache.size >= QUERY_EMBEDDING_CACHE_MAX_SIZE && !queryEmbeddingCache.has(cacheKey)) {
      evictOldestQueryEmbedding();
    }
    queryEmbeddingCache.set(cacheKey, { embedding: values, fetchedAt: Date.now() });
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
