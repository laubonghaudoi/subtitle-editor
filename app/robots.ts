import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/locales";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
