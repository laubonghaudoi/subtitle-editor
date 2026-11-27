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
  ytdlp: "https://github.com/yt-dlp/yt-dlp",
  happyScribe:
    "https://www.happyscribe.com/subtitle-tools/online-subtitle-editor/free",
  subtitleEdit: "https://www.nikse.dk/subtitleedit",
  aegisub: "https://aegisub.org/",
  openSubtitleEditor: "https://opensubtitleed.sourceforge.net/",
  movavi: "https://www.movavi.com/",
  hfK2: "https://huggingface.co/spaces/k2-fsa/generate-subtitles-for-videos",
  hfBatuhan:
    "https://huggingface.co/spaces/BatuhanYilmaz/Whisper-Auto-Subtitled-Video-Generator",
  hfNeuralFalcon:
    "https://huggingface.co/spaces/NeuralFalcon/Whisper-Turbo-Subtitle",
} as const;

type AnswerPart = string | { link: keyof typeof resources; label: string };
type Paragraph = string | AnswerPart[];
type AnswerList = { list: "ol" | "ul"; items: Paragraph[] };
type AnswerBlock = Paragraph | AnswerList;
type Topic =
  | "why-this-editor"
  | "maintenance"
  | "media-formats"
  | "contribute"
  | "transcription"
  | "youtube-subtitles";

export interface FaqContent {
  metadata: { title: string; description: string };
  heading: string;
  backToEditor: string;
  languageLabel: string;
  questions: Record<Topic, { question: string; answer: AnswerBlock[] }>;
}

interface FaqDocumentProps {
  locale: Locale;
  content: FaqContent;
}

const linkStyle = "text-accent-ink underline underline-offset-4";

function isList(block: AnswerBlock): block is AnswerList {
  return typeof block === "object" && "list" in block;
}

function renderParagraph(paragraph: Paragraph) {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.map((part) =>
    typeof part === "string" ? (
      part
    ) : (
      <a key={part.link} href={resources[part.link]} className={linkStyle}>
        {part.label}
      </a>
    ),
  );
}

function answerText(answer: AnswerBlock[]) {
  return answer
    .flatMap((block) => (isList(block) ? block.items : [block]))
    .map((paragraph) =>
      typeof paragraph === "string"
        ? paragraph
        : paragraph
            .map((part) => (typeof part === "string" ? part : part.label))
            .join(""),
    )
    .join("\n");
}

export function FaqDocument({ locale, content }: FaqDocumentProps) {
  const canonical = getPublicUrl(locale, "faq");
  const editorPath = getPublicPath(locale);
  const topics = Object.entries(content.questions);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": canonical,
    inLanguage: locale,
    name: content.heading,
    mainEntity: topics.map(([id, { question, answer }]) => ({
      "@type": "Question",
      "@id": `${canonical}#${id}`,
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answerText(answer),
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
      {topics.map(([id, { question, answer }]) => (
        <section key={id} aria-labelledby={id} className="mt-8">
          <h2 id={id} className="scroll-mt-4 text-xl font-semibold">
            <a href={`#${id}`}>{question}</a>
          </h2>
          {answer.map((block, index) => {
            if (!isList(block)) {
              return (
                <p key={index} className="mt-2 leading-relaxed">
                  {renderParagraph(block)}
                </p>
              );
            }
            const List = block.list;
            return (
              <List
                key={index}
                className={`my-2 ml-6 space-y-1 leading-relaxed ${List === "ol" ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderParagraph(item)}</li>
                ))}
              </List>
            );
          })}
        </section>
      ))}
      <a href={editorPath} className={`mt-8 inline-block ${linkStyle}`}>
        {content.backToEditor}
      </a>
    </article>
  );
}
