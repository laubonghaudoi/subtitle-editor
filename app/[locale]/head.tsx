import { isValidLocale } from "@/lib/locales";

const CHIRON_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Chiron+Hei+HK:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap";

export default function LocaleHead({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  if (!isValidLocale(locale)) {
    return null;
  }

  if (locale !== "yue") {
    return null;
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" href={CHIRON_STYLESHEET} as="style" />
      <link rel="stylesheet" href={CHIRON_STYLESHEET} />
    </>
  );
}
