// Next.js + next-intl configuration
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./i18n.ts");
// performance-08: `ANALYZE=true npm run build` opens an interactive treemap of
// every route's bundle. next.config.mjs recorded exactly one deliberate
// bundle-size decision ever made (the Phosphor-icons tree-shake below) with no
// way to SEE the bundle since. No-op (identity wrapper) unless ANALYZE is set,
// so a normal build is byte-identical to before.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The floating dev-tools badge sits bottom-left, exactly on top of the merchant terminal's own
  // bottom bar, so every screenshot of that screen carried a black disc nobody could explain.
  // Dev-only chrome either way: this changes nothing about a build.
  devIndicators: false,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react"], // B4 load win: tree-shake icon barrel. @phosphor-icons/react removed (was a single-icon dep, migrated to lucide-react's Footprints).
  },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.MAPBOX_API,
  },
  async redirects() {
    return [
      // OWNER 2026-06-12: /partner IS the canonical B2B route (owner consolidated it
      // personally; do not rename — see _design-system/REMOVED.md). Aliases 301 here.
      { source: '/:locale(de|en|fr|it)/fuer-salons', destination: '/:locale/partner', permanent: true },
      { source: '/fuer-salons', destination: '/de/partner', permanent: true },
      { source: '/:locale(de|en|fr|it)/business', destination: '/:locale/partner', permanent: true },
      { source: '/business', destination: '/de/partner', permanent: true },
      // OWNER 2026-06-18: the discovery feed is renamed "Inspo" everywhere (display + URL).
      // The route moved app/[locale]/discover -> app/[locale]/inspo and the old German alias
      // /entdecken was removed. These 301s keep every old shared link / bookmark / indexed URL
      // alive (the :path* variant covers /discover/<id>, /board/<id>, /saved, ?category=… etc;
      // query strings are preserved automatically). Keep until old links have aged out of search.
      { source: '/:locale(de|en|fr|it)/discover/:path*', destination: '/:locale/inspo/:path*', permanent: true },
      { source: '/:locale(de|en|fr|it)/discover', destination: '/:locale/inspo', permanent: true },
      { source: '/:locale(de|en|fr|it)/entdecken/:path*', destination: '/:locale/inspo/:path*', permanent: true },
      { source: '/:locale(de|en|fr|it)/entdecken', destination: '/:locale/inspo', permanent: true },
      // OWNER 2026-08-23: /behandlungen (treatments-by-type listing) is deleted, verbatim
      // "delete it. We don't need that shit." It listed salons by treatment type, which the
      // category pages already do. Its slugs came from service_categories, which do not map
      // one to one onto the salon categories (/coiffeur, /nails, /barbershop, /spa), so there
      // is no honest per-slug destination, every old link goes to the home page where search lives.
      { source: '/:locale(de|en|fr|it)/behandlungen/:path*', destination: '/:locale', permanent: true },
      { source: '/:locale(de|en|fr|it)/behandlungen', destination: '/:locale', permanent: true },
      {
        source: "/:locale/coiffeur",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/coiffeur",
        permanent: true,
      },
      {
        source: "/:locale/barbershop",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/barbershop",
        permanent: true,
      },
      {
        source: "/:locale/nails",
        has: [{ type: "query", key: "quartier" }],
        destination: "/:locale/basel/nails",
        permanent: true,
      },
    ];
  },
  images: {
    // performance-10: pin explicitly to Next 15.3's own current default
    // (confirmed live in node_modules/next/dist/shared/lib/image-config.js,
    // `formats: ['image/webp']`, no avif). No behavior change today, this
    // exists so a future Next major bump cannot silently change the output
    // format Solen's photo-heavy surfaces depend on without a deliberate,
    // reviewed decision. Quality stays Next's own unset default (75).
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-us.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokcdn-eu.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.pexels.com",
      },
      // B4 load win: Header's account avatar (session.user.user_metadata.avatar_url/picture) is
      // populated by Supabase from Google OAuth (the only signInWithOAuth provider in the app,
      // app/api/auth/login/route.ts) - allowlisting this one known host lets that avatar use
      // next/image instead of a raw <img>.
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      // V3-D389 PROOF-ONLY: placeholder host for the salon-portfolio-in-Entdecken frontend proof. Remove with the
      // seeded PROOF_SALON_ITEMS once real opted-in salon photos (Supabase Storage, already allowlisted) flow in.
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "**.picsum.photos",
      },
    ],
  },
  // Pin the referrer policy (2026-07-15, owner asked whether the guest receipt link is safe).
  // Guest booking receipts carry a 256-bit access token IN THE URL (/confirmation?access_token=...).
  // Modern browsers already default to strict-origin-when-cross-origin (origin only, no query is
  // sent cross-origin), so the token does not leak to e.g. the Maps link the receipt points at ,
  // but that default was never pinned here, so a browser/default change would silently start
  // leaking it. Pinning it makes the guarantee ours instead of the browser's.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
// cache buster: 1774127642
