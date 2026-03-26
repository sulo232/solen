// Next.js + next-intl configuration
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.MAPBOX_API,
  },
  async redirects() {
    return [
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
    ],
  },
};

export default withNextIntl(nextConfig);
// cache buster: 1774127642
