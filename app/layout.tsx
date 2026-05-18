import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup und mehr.",
};

// V3-D73 (2026-05-18) — Premium production polish per advanced-UI/UX doc audit.
// `viewport-fit=cover` enables `env(safe-area-inset-*)` to work edge-to-edge
// (without it, those values silently no-op on devices with notches/dynamic island).
// `maximumScale=1 + userScalable=false` locks the structural UI so accidental
// pinch-zoom or double-tap doesn't break the grid system. Content pinch-zoom on
// specific elements (photos, maps) still works via touch-action: pinch-zoom on
// those elements if needed.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F4F4F6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        {/* V2-D## (2026-05-09) typography override of V2-D15-3:
            Peace Sans (display) + Open Sauce One (body) via cdnfonts;
            Inter via Google Fonts is the safety-net fallback for body. */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      {/* `bg-white` removed 2026-05-09: it was hiding the page-wide §5g
          atmosphere wash defined in globals.css (body::before + body::after
          z -1 / -2 — wash painted BEHIND opaque white). Body bg now
          transparent (set in globals.css `body { background: transparent }`)
          so the wash shows. text-s-ink kept. */}
      <body style={{ margin: 0, padding: 0 }} className="text-s-ink">
        {children}
      </body>
    </html>
  );
}
