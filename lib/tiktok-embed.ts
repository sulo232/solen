// lib/tiktok-embed.ts — Server-side TikTok oEmbed client
// CORS blocks browser calls — always use from API routes only.
// Free, no key needed, ~100 req/min undocumented limit.

export interface TikTokEmbedResult {
  html: string;
  thumbnail_url: string;
  author_name: string;
  title: string;
  provider_name: string;
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      continue;
    }
    return res;
  }
  throw new Error("TikTok oEmbed rate limited after retries");
}

export async function fetchTikTokEmbed(url: string): Promise<TikTokEmbedResult | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetchWithRetry(oembedUrl);
    if (!res.ok) {
      console.error(`[tiktok-embed] oEmbed returned ${res.status} for: ${url}`);
      return null;
    }
    const data = await res.json();
    return {
      html: data.html ?? "",
      thumbnail_url: data.thumbnail_url ?? "",
      author_name: data.author_name ?? "",
      title: data.title ?? "",
      provider_name: data.provider_name ?? "TikTok",
    };
  } catch (err) {
    console.error("[tiktok-embed] Error fetching oEmbed:", err);
    return null;
  }
}

/**
 * Validate a TikTok URL format.
 * Accepts: https://www.tiktok.com/@user/video/1234567890
 *          https://vm.tiktok.com/abc123/
 */
export function isValidTikTokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "www.tiktok.com" || parsed.hostname === "tiktok.com" || parsed.hostname === "vm.tiktok.com") &&
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/**
 * Batch fetch TikTok embeds with rate limit protection.
 * Max 10 concurrent, 500ms delay between batches.
 */
export async function batchFetchTikTokEmbeds(
  urls: string[]
): Promise<Map<string, TikTokEmbedResult | null>> {
  const results = new Map<string, TikTokEmbedResult | null>();
  const batchSize = 10;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await fetchTikTokEmbed(url);
        return [url, result] as const;
      })
    );
    for (const [url, result] of batchResults) {
      results.set(url, result);
    }
    // Rate limit protection between batches
    if (i + batchSize < urls.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
