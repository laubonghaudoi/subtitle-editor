export const SITE_ORIGIN = "https://subtitle-editor.org";
export const locales = ["de", "en", "pl", "yue"] as const;

export type Locale = (typeof locales)[number];
export type PublicPage = "editor" | "faq";

export function getPublicPath(locale: Locale, page: PublicPage = "editor") {
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (page === "faq") return `${prefix}/faq`;
  return prefix || "/";
}

export function getPublicUrl(locale: Locale, page: PublicPage = "editor") {
  return new URL(getPublicPath(locale, page), SITE_ORIGIN).href;
}

export const localeConfig = {
  de: {
    name: "German",
    nativeName: "Deutsch",
    hrefLang: "de",
    openGraphLocale: "de_DE",
  },
  en: {
    name: "English",
    nativeName: "English",
    hrefLang: "en",
    openGraphLocale: "en_US",
  },
  pl: {
    name: "Polish",
    nativeName: "Polski",
    hrefLang: "pl",
    openGraphLocale: "pl_PL",
  },
  yue: {
    name: "Cantonese",
    nativeName: "粵文",
    hrefLang: "zh-Hant-HK",
    openGraphLocale: "zh_HK",
  },
} satisfies Record<
  Locale,
  {
    name: string;
    nativeName: string;
    hrefLang: string;
    openGraphLocale: string;
  }
>;

export function isValidLocale(locale: string): locale is Locale {
  return locales.some((supported) => supported === locale);
}
