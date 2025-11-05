import { getRequestConfig } from "next-intl/server";
import { isValidLocale } from "@/lib/locales";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;

  // Ensure that a valid locale is used
  const resolvedLocale =
    typeof locale === "string" && isValidLocale(locale) ? locale : "en";

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
