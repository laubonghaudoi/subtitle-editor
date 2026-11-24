import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale, locales } from "@/lib/locales";
import { getPageMetadata, siteMetadata } from "@/lib/seo";
import SiteDocument from "../site-document";

export const dynamicParams = false;
export const viewport: Viewport = { themeColor: "#0f172a" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    ...siteMetadata,
    ...getPageMetadata(locale, "editor", {
      title: t("title"),
      description: t("description"),
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LocaleParams;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <SiteDocument locale={locale}>{children}</SiteDocument>;
}
