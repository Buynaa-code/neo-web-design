import type { MetadataRoute } from "next";

const BASE_URL = "https://hdlh.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated / personal screens — no SEO value, keep out of the index.
      disallow: ["/auth", "/profile", "/saved", "/activity", "/alerts", "/schedule", "/confirmation", "/rental-mgmt"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
