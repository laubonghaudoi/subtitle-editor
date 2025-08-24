import { isValidLocale, localeConfig, locales } from "@/lib/locales";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get messages for this locale
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const config = localeConfig[locale];
  const otherLocales = locales.filter((l) => l !== locale);

  return {
    metadataBase: new URL("https://subtitle-editor.org"),
    title: {
      default: messages.metadata.title,
      template: `%s | ${messages.metadata.title}`,
    },
    description: messages.metadata.description,
    keywords: messages.metadata.keywords,
    alternates: {
      canonical: config.url,
      languages: otherLocales.reduce(
        (acc, l) => ({
          ...acc,
          [l]: localeConfig[l].url,
        }),
        {}
      ),
    },
    openGraph: {
      title: messages.metadata.title,
      description: messages.metadata.description,
      url: config.url,
      locale: config.openGraphLocale,
      siteName: messages.metadata.title,
      images: [
        {
          url: "/badge-cc.png",
          width: 1200,
          height: 1200,
          alt: messages.metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: messages.metadata.title,
      description: messages.metadata.description,
      images: ["/badge-cc.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <div data-locale={locale}>
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
