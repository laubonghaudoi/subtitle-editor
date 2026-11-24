import type { MetadataRoute } from "next";
import { getPublicUrl, locales } from "@/lib/locales";
import { getAlternateLanguages } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return (["editor", "faq"] as const).flatMap((page) =>
    locales.map((locale) => ({
      url: getPublicUrl(locale, page),
      alternates: { languages: getAlternateLanguages(page) },
    })),
  );
}
