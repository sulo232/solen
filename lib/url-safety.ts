// Shared open-redirect guard for any "redirect"/"next"/"to" query param a route or page
// resolves into a Location header or a client-side redirect. Only an internal relative
// path is safe to send a user to; everything else must fall back to a known-safe default.
export function isSafeRelativePath(path: string): boolean {
  // WHATWG URL parsing treats a backslash like a forward slash, so "/\evil.com" would
  // otherwise pass a bare startsWith("/") check yet resolve to an external origin.
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}
