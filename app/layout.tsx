import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";

// Self-hosted via next/font — Next downloads these at build time and serves the
// woff2 from our own origin (/_next/static/media), so they always load (no runtime
// fetch to fonts.gstatic.com that defaulted to the system font on phone/LAN).
// 2026-05-30: Inter Tight REMOVED per user. Hanken Grotesk is now the ONE app font
// (headings + body); JetBrains Mono stays for codes/receipts. Do NOT reintroduce
// Inter Tight or Geist. Hanken loads up to 800 so bold headings render properly.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa und mehr.",
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
    <html lang="de" className={`${hanken.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        {/* Google Fonts preconnects removed — fonts are now self-hosted via next/font
            (same-origin), so there's no fonts.gstatic.com fetch to warm up. */}
      </head>
      {/* `bg-white` removed 2026-05-09: it was hiding the page-wide §5g
          atmosphere wash defined in globals.css (body::before + body::after
          z -1 / -2 — wash painted BEHIND opaque white). Body bg now
          transparent (set in globals.css `body { background: transparent }`)
          so the wash shows. text-s-ink kept. */}
      <body style={{ margin: 0, padding: 0 }} className="text-s-ink">
        {/* DS-A4 / LOCKFILE 16.3 (2026-06-11): View Transitions provider — enables
            the ONE shared-element moment (salon card photo -> PDP hero) via the
            native View Transitions API. No-ops on unsupported browsers. */}
        <ViewTransitions>{children}</ViewTransitions>
      </body>
    </html>
  );
}
