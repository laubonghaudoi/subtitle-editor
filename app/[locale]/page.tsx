import ResponsiveEditorEntry from "@/components/editor/responsive-editor-entry";
import { EDITOR_MIN_WIDTH_PX } from "@/components/editor/viewport";
import { getPublicPath, isValidLocale } from "@/lib/locales";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations({ locale });
  const faqHref = getPublicPath(locale, "faq");
  const helpLink = (anchor: string, text: ReactNode) => (
    <a
      href={`${faqHref}#${anchor}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-ink underline underline-offset-2"
    >
      {text}
    </a>
  );

  const introduction = (
    <header className="max-w-prose space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("editorIntro.heading")}
      </h1>
      <p className="text-base leading-relaxed">
        {t.rich("editorIntro.description", {
          sync: (text) => helpLink("sync-subtitles", text),
          convert: (text) => helpLink("convert-srt-vtt", text),
        })}
      </p>
    </header>
  );

  return (
    <NextIntlClientProvider>
      <ResponsiveEditorEntry
        introduction={introduction}
        loadingLabel={t("narrowScreen.loading")}
        narrowScreenNotice={{
          title: t("narrowScreen.title"),
          description: t("narrowScreen.description"),
          minimum: t("narrowScreen.minimum", { width: EDITOR_MIN_WIDTH_PX }),
          faqHref,
          faqLabel: t("navigation.faq"),
          proceedLabel: t("narrowScreen.proceed"),
        }}
      />
    </NextIntlClientProvider>
  );
}
