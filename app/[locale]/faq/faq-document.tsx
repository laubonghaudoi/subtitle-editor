import {
  getPublicPath,
  getPublicUrl,
  type Locale,
  localeConfig,
  locales,
} from "@/lib/locales";

const resources = {
  repo: "https://github.com/laubonghaudoi/subtitle-editor",
  issues: "https://github.com/laubonghaudoi/subtitle-editor/issues",
  scope:
    "https://github.com/laubonghaudoi/subtitle-editor/issues/11#issuecomment-3201949429",
  ffmpeg: "https://ffmpeg.org/",
  whisper: "https://github.com/openai/whisper",
  ytdlp: "https://github.com/yt-dlp/yt-dlp#subtitle-options",
  happyScribe:
    "https://www.happyscribe.com/subtitle-tools/online-subtitle-editor/free",
  subtitleEdit: "https://www.nikse.dk/subtitleedit",
  aegisub: "https://aegisub.org/",
} as const;

type AnswerPart = string | { link: keyof typeof resources; label: string };
type Topic =
  | "edit-subtitles"
  | "sync-subtitles"
  | "convert-srt-vtt"
  | "multiple-tracks"
  | "save-subtitles"
  | "privacy"
  | "offline"
  | "media-formats"
  | "transcription"
  | "youtube-subtitles"
  | "why-this-editor"
  | "contribute";

export interface FaqContent {
  metadata: { title: string; description: string };
  heading: string;
  backToEditor: string;
  languageLabel: string;
  questions: Record<Topic, { question: string; answer: string | AnswerPart[] }>;
}

interface FaqDocumentProps {
  locale: Locale;
  content: FaqContent;
}

const linkStyle = "text-accent-ink underline underline-offset-4";

export function FaqDocument({ locale, content }: FaqDocumentProps) {
  const canonical = getPublicUrl(locale, "faq");
  const editorPath = getPublicPath(locale);
  const topics = Object.entries(content.questions).map(
    ([id, { question, answer }]) => ({
      id,
      question,
      parts: typeof answer === "string" ? [answer] : answer,
    }),
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": canonical,
    inLanguage: locale,
    name: content.heading,
    mainEntity: topics.map(({ id, question, parts }) => ({
      "@type": "Question",
      "@id": `${canonical}#${id}`,
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: parts
          .map((part) => (typeof part === "string" ? part : part.label))
          .join(""),
      },
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <a href={editorPath} className={linkStyle}>
          {content.backToEditor}
        </a>
        <nav aria-label={content.languageLabel}>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {locales.map((language) => (
              <li key={language}>
                <a
                  href={getPublicPath(language, "faq")}
                  lang={language}
                  hrefLang={localeConfig[language].hrefLang}
                  aria-current={language === locale ? "page" : undefined}
                  className={language === locale ? "font-semibold" : linkStyle}
                >
                  {localeConfig[language].nativeName}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        {content.heading}
      </h1>
      {topics.map(({ id, question, parts }) => (
        <section key={id} aria-labelledby={id} className="mt-8">
          <h2 id={id} className="scroll-mt-4 text-xl font-semibold">
            <a href={`#${id}`}>{question}</a>
          </h2>
          <p className="mt-2 leading-relaxed">
            {parts.map((part) =>
              typeof part === "string" ? (
                part
              ) : (
                <a
                  className={linkStyle}
                  key={part.link}
                  href={resources[part.link]}
                >
                  {part.label}
                </a>
              ),
            )}
          </p>
        </section>
      ))}
      <a href={editorPath} className={`mt-8 inline-block ${linkStyle}`}>
        {content.backToEditor}
      </a>
    </article>
  );
}
