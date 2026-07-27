// Color and font constants for server-rendered HTML that lives OUTSIDE the
// React/Tailwind component tree (printable invoices, PDF exports, and any
// other route that returns a raw HTML string). These surfaces cannot use
// Tailwind classes, so they must import their values from here instead of
// typing a fresh hex inline. Values are mirrored 1:1 from LOCKFILE.md §1 /
// tailwind.config.js -- if a token changes there, update it here too.
// See _design-system/LOCKFILE.md "Non-Tailwind rendering surfaces".

export const BRAND_HTML_COLORS = {
  ink: "#0A0A0A",       // s-ink DEFAULT
  ink2: "#6B6B6B",      // s-ink-2 / s-ink.secondary
  border: "#E4E4E7",    // s-border
  bgSunken: "#F4F4F5",  // s-bg.sunken
} as const;

export const BRAND_HTML_FONT_STACK =
  "'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif";
