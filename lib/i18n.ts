import en from '@/locales/en.json';
import zhHant from '@/locales/zh-hant.json';

export type Dictionary = typeof en;

const dictionaries: Record<string, Dictionary> = {
  en,
  'zh-hant': zhHant,
};

export function getDictionary(locale: string): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}
