import { useTranslations } from "next-intl";

export default function SkipLinks() {
  const t = useTranslations();

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 m-2 bg-white text-black border-2 border-black rounded focus:not-sr-only"
      >
        {t("skipLinks.toMain")}
      </a>
      <a
        href="#subtitle-list"
        className="absolute top-0 left-20 p-2 m-2 bg-white text-black border-2 border-black rounded focus:not-sr-only"
      >
        {t("skipLinks.toSubtitles")}
      </a>
      <a
        href="#video-player"
        className="absolute top-0 left-40 p-2 m-2 bg-white text-black border-2 border-black rounded focus:not-sr-only"
      >
        {t("skipLinks.toVideo")}
      </a>
    </div>
  );
}
