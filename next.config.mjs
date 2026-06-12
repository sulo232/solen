// Next.js + next-intl configuration
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    scrollRestoration: true,
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
};

export default withNextIntl(nextConfig);
// cache buster: 1774127642
