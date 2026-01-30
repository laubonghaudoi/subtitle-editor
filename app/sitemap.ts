import type { MetadataRoute } from "next";
import { locales, localeConfig } from "@/lib/locales";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://subtitle-editor.org";

  // Generate entries for all locales
  const localeEntries = locales.map((locale) => ({
    url: localeConfig[locale].url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  }));

  return [
    ...localeEntries,
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
