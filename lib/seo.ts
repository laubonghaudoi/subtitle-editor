import type { Metadata } from "next";
import {
  getPublicUrl,
  type Locale,
  localeConfig,
  locales,
  type PublicPage,
  SITE_ORIGIN,
} from "./locales";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: "Subtitle Editor",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-apple-180.png", sizes: "180x180" }],
    shortcut: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Subtitle Editor",
  },
  formatDetection: { telephone: false },
};

export function getAlternateLanguages(
  page: PublicPage,
): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [
        localeConfig[locale].hrefLang,
        getPublicUrl(locale, page),
      ]),
    ),
    "x-default": getPublicUrl("en", page),
  };
}

export function getPageMetadata(
  locale: Locale,
  page: PublicPage,
  { title, description }: { title: string; description: string },
): Metadata {
  const canonical = getPublicUrl(locale, page);
  const image = {
    url: new URL("/og-image.png", SITE_ORIGIN).href,
    width: 1200,
    height: 630,
    alt: "Subtitle Editor",
  };
  return {
    title,
    description,
    alternates: { canonical, languages: getAlternateLanguages(page) },
    openGraph: {
      type: "website",
      siteName: "Subtitle Editor",
      locale: localeConfig[locale].openGraphLocale,
      url: canonical,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
