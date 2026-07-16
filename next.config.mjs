// Next.js + next-intl configuration
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default withNextIntl(nextConfig);
// cache buster: 1774127642
