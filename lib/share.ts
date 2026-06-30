/**
 * shareOrCopy
 *
 * Centralises the Web Share API + clipboard-fallback block that was previously
 * copy-pasted verbatim into SalonHeader, SalonHero, SalonStickyTabNav,
 * BookingSuccess, and StaffProfilePage (sweep-backlog, codehealth).
 *
 * Behavior:
 *   1. Uses the Web Share API when available (mobile native sheet).
 *      Pass `text` for richer share sheets (e.g. booking confirmation).
 *   2. Falls back to clipboard.writeText(url) for desktop browsers.
 *   3. Both legs log errors via console.error (never empty-catch).
 *
 * Safe to call during SSR: the typeof navigator guard makes it a no-op on
 * the server.
 */
export async function shareOrCopy(
  title: string,
  url: string,
  text?: string,
): Promise<void> {
  if (typeof navigator === "undefined") return;

  if (navigator.share) {
    await navigator.share({ title, url, ...(text ? { text } : {}) }).catch((err) => {
      console.error("[shareOrCopy] navigator.share failed:", err);
    });
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(url).catch((err) => {
      console.error("[shareOrCopy] clipboard.writeText failed:", err);
    });
  }
}
