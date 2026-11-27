import ResponsiveEditorEntry from "@/components/editor/responsive-editor-entry";
import { EDITOR_MIN_WIDTH_PX } from "@/components/editor/viewport";
import { getPublicPath, isValidLocale } from "@/lib/locales";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations({ locale });

  return (
    <NextIntlClientProvider>
      <ResponsiveEditorEntry
        productTitle={t("navigation.title")}
        loadingLabel={t("narrowScreen.loading")}
        narrowScreenNotice={{
          title: t("narrowScreen.title"),
          description: t("narrowScreen.description"),
          minimum: t("narrowScreen.minimum", { width: EDITOR_MIN_WIDTH_PX }),
          faqHref: getPublicPath(locale, "faq"),
          faqLabel: t("navigation.faq"),
          proceedLabel: t("narrowScreen.proceed"),
        }}
      />
    </NextIntlClientProvider>
  );
}
