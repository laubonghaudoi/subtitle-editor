import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { getPageMetadata } from "@/lib/seo";
import { getFaqContent } from "./content";
import { FaqDocument } from "./faq-document";

type FaqPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: FaqPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return getPageMetadata(locale, "faq", getFaqContent(locale).metadata);
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "navigation" });
  return (
    <FaqDocument
      locale={locale}
      content={getFaqContent(locale)}
      productTitle={t("title")}
    />
  );
}
