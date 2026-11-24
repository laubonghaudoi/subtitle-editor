import "server-only";
import type { Locale } from "@/lib/locales";
import de from "./copy/de";
import en from "./copy/en";
import pl from "./copy/pl";
import yue from "./copy/yue";

const content = { de, en, pl, yue };

export function getFaqContent(locale: Locale) {
  return content[locale];
}
