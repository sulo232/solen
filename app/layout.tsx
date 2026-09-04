import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Inter_Tight, Inter } from "next/font/google";
import { headers } from "next/headers";
import { locales, defaultLocale } from "@/i18n";
import "@/app/globals.css";

// Self-hosted via next/font (Next downloads these at build time and serves the
// woff2 from our own origin, /_next/static/media), so they always load with no
// runtime fetch to fonts.gstatic.com that could fall back to the system font on
// phone/LAN (the exact failure the old globals.css @import was exposed to).
// Inter Tight (display/headings) + Inter (body) per V3-D410/V3-D190/rule 8. JetBrains
// Mono is RETIRED (V3-D470): codes render Inter Tight tabular via .font-mono-code.
// typography-03 (2026-07-27): weight array trimmed to 400-700. LOCKFILE section 2
// line 276 bans 800/900 ("NEVER 800/extrabold, clumsy") and V3-D317 already swept
// font-extrabold out of the codebase once, but loading 800/900 anyway meant every
// font-face for the banned weights sat downloaded and ready, so the ban kept
// re-drifting (24 live font-extrabold/font-black callsites found 2026-07-26).
// Not loading the weight is the enforcement: a font-weight 800/900 request now
// falls back to the nearest available face (700) per standard CSS font matching,
// so a stray font-extrabold degrades to bold instead of rendering full black.
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter-tight", display: "swap" });
// BODY FONT WAS NOT LOADING AT ALL, and had not been for some time. Owner 2026-08-16, and he had
// said it more than once: "the fonts are not rlly what i want bro i keep seeing ths ass font".
//
// MEASURED on the live page before this change:
//   - `document.fonts` held 28 real font-face rules for Inter Tight, pointing at real .woff2 files,
//     and ZERO for Inter. The only Inter entries were "Inter Fallback" and "Inter Fallback
//     Fallback", both `src: local("Arial")`.
//   - `--font-inter` on <html> computed to the EMPTY STRING, while `--font-inter-tight` computed to
//     "'Inter Tight', 'Inter Tight Fallback'".
//   - So `.font-display` resolved to Inter Tight and `.font-body` resolved to
//     `ui-sans-serif, system-ui, ...`, the browser default, on every element that used it.
//
// WHY THE WHOLE DECLARATION VANISHES, which is the part worth writing down: `font-family:
// var(--font-inter), "Inter", system-ui, ...` does NOT fall through to "Inter" when the variable is
// empty. An empty var() substitution makes the ENTIRE property invalid at computed-value time and
// the declaration is dropped whole, so the element silently inherits. One empty variable therefore
// took out every fallback in the list at once, and nothing anywhere reported an error.
//
// Net effect: every piece of body copy on every screen has been rendering in the device's system
// font. On his iPhone that is San Francisco, not Inter, which is exactly the font he kept saying he
// did not want. Headings were unaffected, which is why this survived so long: the screens looked
// deliberate, just wrong.
//
// THE FIX: request Inter as the VARIABLE font it now is on Google Fonts, rather than as four static
// cuts. Inter Tight resolves fine with a static weight array and Inter does not, which is the one
// asymmetry between two otherwise identical calls. Clearing the font fetch cache and restarting did
// NOT change it, so this was never a transient download failure.
//
// The weight ban the array used to enforce is NOT lost. See the note above: the point was that no
// face exists above 700, so a banned weight has nothing to resolve to. `axes` is left empty and the
// variable range is capped below, keeping that property. drift-ok: this comment explains the ban it
// is preserving and introduces no such class.
const inter = Inter({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel", // em-dash-ok: pre-existing title dash, unrelated to this edit
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A1-html-lang (2026-07-26, supersedes the hardcoded lang="de" this comment used to
  // sit next to): this layout is ABOVE the [locale] route segment (Next.js App Router
  // allows exactly one <html> tag, so it can't live in app/[locale]/layout.tsx), so it
  // has no route params. middleware.ts stamps the request pathname onto `x-pathname`;
  // parse the locale prefix out of that instead of hardcoding German on en/fr/it routes
  // (WCAG 3.1.1 Level A, verified live: /en/basel was serving lang="de").
  const pathname = (await headers()).get("x-pathname") ?? "";
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ?? defaultLocale;
  return (
    <html lang={locale} className={`${interTight.variable} ${inter.variable}`} suppressHydrationWarning>
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
