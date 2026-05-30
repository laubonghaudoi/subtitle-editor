export const locales = ["de", "en", "pl", "yue"] as const;

export type Locale = (typeof locales)[number];

export const localeConfig: Record<
  Locale,
  {
    name: string;
    nativeName: string;
    openGraphLocale: string;
    url: string;
  }
> = {
  de: {
    name: "German",
    nativeName: "Deutsch",
    openGraphLocale: "de",
    url: "https://subtitle-editor.org/de",
  },
  en: {
    name: "English",
    nativeName: "English",
    openGraphLocale: "en",
    url: "https://subtitle-editor.org",
  },
  pl: {
    name: "Polish",
    nativeName: "Polski",
    openGraphLocale: "pl",
    url: "https://subtitle-editor.org/pl",
  },
  yue: {
    name: "Cantonese",
    nativeName: "粵文",
    openGraphLocale: "yue",
    url: "https://subtitle-editor.org/yue",
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
