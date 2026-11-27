import { HeaderBrand, HeaderFrame } from "@/components/app-header/header-frame";
import { Button } from "@/components/ui/button";
import {
  getPublicPath,
  getPublicUrl,
  type Locale,
  localeConfig,
  locales,
} from "@/lib/locales";
import { IconArrowLeft, IconLanguage } from "@tabler/icons-react";

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
  productTitle: string;
}

const linkStyle =
  "text-accent-ink underline underline-offset-4 hover:decoration-2 focus-visible:outline-ring";

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

export function FaqDocument({
  locale,
  content,
  productTitle,
}: FaqDocumentProps) {
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

  const backLink = (
    <Button asChild variant="outline">
      <a href={editorPath}>
        <IconArrowLeft aria-hidden="true" />
        {content.backToEditor}
      </a>
    </Button>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <HeaderFrame>
        <HeaderBrand title={productTitle} />
        {backLink}
      </HeaderFrame>
      <article className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]">
        <div className="border-b-2 lg:border-e-2 lg:border-b-0">
          <div className="px-4 py-5 sm:px-10 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:py-8 lg:ps-16 lg:pe-6">
            <h1 id="faq-title" className="text-2xl font-semibold leading-tight">
              {content.heading}
            </h1>
            <nav
              aria-label={content.languageLabel}
              className="mt-3 flex items-center gap-1"
            >
              <IconLanguage aria-hidden="true" className="size-4 shrink-0" />
              <ul className="flex flex-wrap">
                {locales.map((language) => (
                  <li key={language}>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="px-2 aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:underline aria-[current=page]:underline-offset-4"
                    >
                      <a
                        href={getPublicPath(language, "faq")}
                        lang={language}
                        hrefLang={localeConfig[language].hrefLang}
                        aria-current={language === locale ? "page" : undefined}
                      >
                        {localeConfig[language].nativeName}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
            <nav
              aria-labelledby="faq-title"
              className="mt-5 hidden border-t pt-3 lg:block"
            >
              <ul>
                {topics.map(([id, { question }]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="block rounded-xs py-2 text-sm font-medium leading-5 underline-offset-4 hover:text-accent-ink hover:underline focus-visible:outline-ring"
                    >
                      {question}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        <div className="min-w-0 px-4 py-6 sm:px-10 lg:py-8 xl:px-16">
          <div className="max-w-[72ch] divide-y divide-border/30">
            {topics.map(([id, { question, answer }]) => (
              <section
                key={id}
                aria-labelledby={id}
                className="py-7 first:pt-0"
              >
                <h2
                  id={id}
                  className="scroll-mt-6 text-xl font-semibold leading-tight"
                >
                  <a
                    href={`#${id}`}
                    className="underline-offset-4 hover:text-accent-ink hover:underline focus-visible:outline-ring"
                  >
                    {question}
                  </a>
                </h2>
                {answer.map((block, index) => {
                  if (!isList(block)) {
                    return (
                      <p key={index} className="mt-3 leading-relaxed">
                        {renderParagraph(block)}
                      </p>
                    );
                  }
                  const List = block.list;
                  return (
                    <List
                      key={index}
                      className={`mt-3 space-y-2 ps-6 leading-relaxed ${List === "ol" ? "list-decimal" : "list-disc"}`}
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{renderParagraph(item)}</li>
                      ))}
                    </List>
                  );
                })}
              </section>
            ))}
          </div>
          {backLink}
        </div>
      </article>
    </>
  );
}
