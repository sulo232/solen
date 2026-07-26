import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Inter_Tight, Inter } from "next/font/google";
import "@/app/globals.css";

// Self-hosted via next/font (Next downloads these at build time and serves the
// woff2 from our own origin, /_next/static/media), so they always load with no
// runtime fetch to fonts.gstatic.com that could fall back to the system font on
// phone/LAN (the exact failure the old globals.css @import was exposed to).
// Inter Tight (display/headings) + Inter (body) per V3-D410/V3-D190/rule 8. Inter
// Tight loads up to 900 so bold headings render at full weight (V3-D190). JetBrains
// Mono is RETIRED (V3-D470): codes render Inter Tight tabular via .font-mono-code.
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-inter-tight", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa und mehr.",
};

// V3-D73 (2026-05-18) — Premium production polish per advanced-UI/UX doc audit.
// `viewport-fit=cover` enables `env(safe-area-inset-*)` to work edge-to-edge
// (without it, those values silently no-op on devices with notches/dynamic island).
// A3-viewport-zoom (2026-07-26, SUPERSEDES the maximumScale/userScalable lock this
// comment used to describe): removed `maximumScale=1` and `userScalable=false`.
// That pair blocked a low-vision user from pinch-zooming the ENTIRE site, WCAG
// 1.4.4 Resize Text (AA) failure F102. Checked for a component that genuinely
// needs gesture protection (map/gallery): both mapbox-gl instances
// (SalonLocation.tsx, NearbyMap.tsx) already run `interactive: false`, mapbox's
// own touch handling, not the document viewport, so nothing here actually
// depended on the sitewide lock. None added.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F4F6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${interTight.variable} ${inter.variable}`} suppressHydrationWarning>
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
