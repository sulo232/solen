import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/de/dashboard/", "/en/dashboard/", "/de/account/", "/en/account/"],
    },
    sitemap: "https://solen.ch/sitemap.xml",
  };
}
