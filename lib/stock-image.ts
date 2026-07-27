// lib/stock-image.ts , is this image URL a stock placeholder or real Solen content?
//
// Owner, 2026-07-27 (verbatim): "for pics we use unsplash like stoco pics for previews
// cz we are not live yet but we need to be easy to acc distinguish cx u keep forgetting"
//
// Solen is pre-launch. salon_photos currently has 0 rows (live snapshot,
// _inventory/_db-snapshot.json), so EVERY salon image the app renders today comes from a
// stock host. That is a deliberate owner decision, not a bug. The bug is that the result
// looks identical to real salon photography, so a preview screenshot gets read as
// "Solen has photos" by whoever is looking , which has happened repeatedly.
//
// This module is the single source of truth for "which hosts are stock". Three consumers:
//   1. StockPhotoMarker  , the dev/preview-only visual badge over each stock image
//   2. scripts/check-invariants.mjs , counts stock usage on every run
//   3. ~/.claude/hooks/stock-photo-gate.py , blocks a new stock URL baked into a component
// Keep the host list here in sync with the gate's STOCK_HOST regex if either changes.
//
// PURE + ISOMORPHIC on purpose. lib/stock-photos.ts is the SERVER-ONLY stock search
// client (it reads API keys); this file must stay importable from a client component, so
// it has no imports and no env access.

/** Hosts that serve stock/placeholder imagery, never real salon content. */
export const STOCK_IMAGE_HOSTS = [
  "images.unsplash.com",
  "source.unsplash.com",
  "plus.unsplash.com",
  "api.unsplash.com",
  "images.pexels.com",
  "picsum.photos",
  "i.pravatar.cc",
  "placehold.co",
  "placeholder.com",
  "via.placeholder.com",
  "loremflickr.com",
  "dummyimage.com",
] as const;

/**
 * True when `url` points at a stock-photo host.
 *
 * Deliberately substring-based rather than URL-parsed: it must also work on a
 * srcset entry, a CSS background-image value, and a next/image `/_next/image?url=`
 * wrapper, where the real host sits inside an encoded query parameter.
 */
export function isStockImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  let s = String(url);
  // next/image rewrites to /_next/image?url=<encoded original>
  if (s.includes("/_next/image")) {
    try {
      s = decodeURIComponent(s);
    } catch {
      // a malformed escape sequence means we fall through and match on the raw
      // string, which still catches an unencoded host. Never throw from a predicate.
    }
  }
  const lower = s.toLowerCase();
  return STOCK_IMAGE_HOSTS.some((h) => lower.includes(h));
}

/** Which stock provider, for a label. Returns null when the URL is not stock. */
export function stockImageProvider(url: string | null | undefined): string | null {
  if (!isStockImageUrl(url)) return null;
  const lower = String(url).toLowerCase();
  if (lower.includes("unsplash")) return "Unsplash";
  if (lower.includes("pexels")) return "Pexels";
  if (lower.includes("picsum")) return "Picsum";
  if (lower.includes("pravatar")) return "Pravatar";
  return "Stock";
}
