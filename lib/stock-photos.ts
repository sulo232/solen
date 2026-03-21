// lib/stock-photos.ts — Unified Unsplash + Pexels + Pixabay client
// Server-side only. Never call from browser.

interface StockPhoto {
  id: string;
  url: string;
  thumbnail: string;
  author: string;
  author_url: string;
  source: "unsplash" | "pexels" | "pixabay";
  tags: string[];
  alt_text: string;
  width: number;
  height: number;
}

interface StockSearchResult {
  photos: StockPhoto[];
  total: number;
  page: number;
}

// ─── Unsplash ───
async function searchUnsplash(query: string, page: number): Promise<StockPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=portrait&page=${page}&per_page=30`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((p: any) => ({
      id: `unsplash-${p.id}`,
      url: p.urls?.regular ?? p.urls?.small,
      thumbnail: p.urls?.thumb ?? p.urls?.small,
      author: p.user?.name ?? "Unknown",
      author_url: p.user?.links?.html ?? "",
      source: "unsplash" as const,
      tags: (p.tags ?? []).map((t: any) => t.title).filter(Boolean),
      alt_text: p.alt_description ?? p.description ?? "",
      width: p.width ?? 0,
      height: p.height ?? 0,
    }));
  } catch (err) {
    console.error("[stock-photos] Unsplash error:", err);
    return [];
  }
}

// ─── Pexels ───
async function searchPexels(query: string, page: number): Promise<StockPhoto[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&page=${page}&per_page=30`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos ?? []).map((p: any) => ({
      id: `pexels-${p.id}`,
      url: p.src?.large ?? p.src?.medium,
      thumbnail: p.src?.medium ?? p.src?.small,
      author: p.photographer ?? "Unknown",
      author_url: p.photographer_url ?? "",
      source: "pexels" as const,
      tags: [],
      alt_text: p.alt ?? "",
      width: p.width ?? 0,
      height: p.height ?? 0,
    }));
  } catch (err) {
    console.error("[stock-photos] Pexels error:", err);
    return [];
  }
}

// ─── Pixabay ───
async function searchPixabay(query: string, page: number): Promise<StockPhoto[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&orientation=vertical&page=${page}&per_page=30&image_type=photo`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits ?? []).map((p: any) => ({
      id: `pixabay-${p.id}`,
      url: p.largeImageURL ?? p.webformatURL,
      thumbnail: p.previewURL ?? p.webformatURL,
      author: p.user ?? "Unknown",
      author_url: `https://pixabay.com/users/${p.user_id}/`,
      source: "pixabay" as const,
      tags: (p.tags ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
      alt_text: p.tags ?? "",
      width: p.imageWidth ?? 0,
      height: p.imageHeight ?? 0,
    }));
  } catch (err) {
    console.error("[stock-photos] Pixabay error:", err);
    return [];
  }
}

// ─── Unified search ───
export async function searchStockPhotos(
  query: string,
  category: string,
  source: "unsplash" | "pexels" | "pixabay" | "all" = "all",
  page: number = 1
): Promise<StockSearchResult> {
  const searchQuery = `${query} ${category} beauty salon`;
  let photos: StockPhoto[] = [];

  if (source === "all") {
    const [unsplash, pexels, pixabay] = await Promise.all([
      searchUnsplash(searchQuery, page),
      searchPexels(searchQuery, page),
      searchPixabay(searchQuery, page),
    ]);
    photos = [...unsplash, ...pexels, ...pixabay];
  } else if (source === "unsplash") {
    photos = await searchUnsplash(searchQuery, page);
  } else if (source === "pexels") {
    photos = await searchPexels(searchQuery, page);
  } else if (source === "pixabay") {
    photos = await searchPixabay(searchQuery, page);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = photos.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return { photos: deduped, total: deduped.length, page };
}

export type { StockPhoto, StockSearchResult };
