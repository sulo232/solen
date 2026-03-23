import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/de/dashboard/", "/en/dashboard/", "/fr/dashboard/", "/it/dashboard/",
        "/de/account/", "/en/account/", "/fr/account/", "/it/account/",
      ],
    },
    sitemap: "https://solen.ch/sitemap.xml",
  };
}
