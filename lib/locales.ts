export const locales = ['en', 'yue'] as const;

export type Locale = typeof locales[number];

export const localeConfig: Record<Locale, {
  name: string;
  nativeName: string;
  openGraphLocale: string;
  url: string;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    openGraphLocale: 'en',
    url: 'https://subtitle-editor.org',
  },
  yue: {
    name: 'Cantonese',
    nativeName: '粵文',
    openGraphLocale: 'yue',
    url: 'https://subtitle-editor.org/yue',
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}