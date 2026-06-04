import { getRequestConfig } from "next-intl/server";
import { isValidLocale } from "@/lib/locales";
import enMessages from "../messages/en.json";

type MessageValue =
  | string
  | number
  | boolean
  | null
  | MessageValue[]
  | { [key: string]: MessageValue };

type MessageCatalog = { [key: string]: MessageValue };

const isMessageObject = (value: MessageValue): value is MessageCatalog =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const deepMergeMessages = (
  fallback: MessageCatalog,
  override: MessageCatalog,
): MessageCatalog => {
  const merged: MessageCatalog = { ...fallback };
  for (const [key, value] of Object.entries(override)) {
    const fallbackValue = merged[key];
    merged[key] =
      isMessageObject(fallbackValue) && isMessageObject(value)
        ? deepMergeMessages(fallbackValue, value)
        : value;
  }
  return merged;
};

const getRawMessageFallback = ({
  namespace,
  key,
}: {
  namespace?: string;
  key: string;
}) => (namespace ? `${namespace}.${key}` : key);

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;

  // Ensure that a valid locale is used
  const resolvedLocale =
    typeof locale === "string" && isValidLocale(locale) ? locale : "en";

  const localeMessages = (await import(`../messages/${resolvedLocale}.json`))
    .default as MessageCatalog;

  return {
    locale: resolvedLocale,
    messages: deepMergeMessages(enMessages as MessageCatalog, localeMessages),
    getMessageFallback: getRawMessageFallback,
  };
});
