import type { Metadata } from "next"; // Import Metadata type
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Add specific metadata for the FAQ page
export const metadata: Metadata = {
  title: "FAQ", // Will use template: "FAQ | Subtitle Editor Online"
  description: "Frequently asked questions about the subtitle editor.",
  keywords: [
    "subtitle editor FAQ",
    "subtitle editor Frequently Asked Questions",
    "Why another subtitle editor?",
  ],
  alternates: {
    canonical: "https://subtitle-editor.org/faq",
  },
  openGraph: {
    title: "FAQ | Subtitle Editor",
    description: "Frequently asked questions about the subtitle editor.",
    url: "https://subtitle-editor.org/faq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | Subtitle Editor",
    description: "Frequently asked questions about the subtitle editor.",
  },
};

export default function FaqPage() {
  return (
    <div className="container mx-auto py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: This is required for JSON-LD structured data and is safe in this context.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Why another subtitle editor?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes I know, there are many subtitle editors out there. But I found that none of them is ideal for me so I built this one. What I want is an editor that is: Permanently free, Open-sourced, Fully web-based, no download or installation required, No account sign-up or log-in required, Minimalist UX, Has waveform visualization.",
                },
              },
              {
                "@type": "Question",
                name: "Will you actively maintain this app?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "This app is open sourced on GitHub. I will check issues and accept PRs regularly, but I am quite busy these days so I may not have time to develop new features. This is a community project and your contributions are always welcomed!",
                },
              },
              {
                "@type": "Question",
                name: "Have feedback?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Feel free to open an issue on GitHub. I want to keep this app as minimalistic as possible, so these features are non-goals and I don\u2019t plan to add them: Account registration, Cloud storage, Collaborative editing, AI transcription, Translation, Complex subtitle editing such as VTT files.",
                },
              },
            ],
          }),
        }}
      />
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <h2 className="text-xl font-bold">Why another subtitle editor?</h2>
      <p className="my-4">
        Yes I know, there are many subtitle editors out there. But I found that
        none of them is ideal for me so I built this one. Below are the editors
        that I have tried and what I think are missing in them:
      </p>
      <ul className="list-disc mx-6 my-2">
        <li>
          <Link
            href="https://www.happyscribe.com/subtitle-tools/online-subtitle-editor/free"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            Happy Scribe
          </Link>{" "}
          offers a free online subtitle editor. No account registration is
          required. Editing subtitles and previewing with the video is very
          easy. It is the closest to what I need. Unfortunately, it&apos;s missing
          waveform visualization, which is deal breaker for me. It is not open
          sourced either and we can&apos;t customize it.
        </li>
        <li>
          <Link
            href="https://www.nikse.dk/subtitleedit"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            Subtitle Edit
          </Link>{" "}
          is a great option and has all features I need. It supports waveform
          visualization, easy preview and editing, and even AI transcriptions.
          But it is a desktop software which requires installation, and it
          doesn&apos;t support Mac. I have to use a Windows or Linux device to edit
          subtitles.
        </li>
        <li>
          <Link
            href="https://aegisub.org/"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            Aegisub
          </Link>{" "}
          is similar to Subtitle Edit. It is a desktop software suitable for
          more complex subtitle editing. Also I found waveform visualizer not
          very intuitive. (Btw these desktop softwares have 1990s-style UI which
          really demoralizes me)
        </li>
        <li>
          Other options such as{" "}
          <Link
            href="https://opensubtitleed.sourceforge.net/"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            Open Subtitle Editor
          </Link>{" "}
          or{" "}
          <Link
            href="https://www.movavi.com/"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            Movavi
          </Link>{" "}
          are either too complex and feature-bloated, or are not free.
        </li>
      </ul>
      <p>
        None of them is open-sourced, and the UIs are either too ugly or too
        complex, which really bothers my subtitle editing experience. What I
        want is an editor that is:
      </p>
      <ol className="list-decimal mx-6 my-2">
        <li>Permanently free</li>
        <li>Open-sourced</li>
        <li>Fully web-based, no download or installation required</li>
        <li>No account sign-up or log-in required</li>
        <li>Minimalist UX</li>
        <li>Has waveform visualization</li>
      </ol>
      <p>So I built this one.</p>
      <h2 className="text-xl font-bold my-4">
        Will you actively maintain this app?
      </h2>
      <p>
        This app is open sourced on GitHub{" "}
        <Link
          href="https://github.com/laubonghaudoi/subtitle-editor"
          target="_blank"
          className="hover:underline text-blue-800 hover:text-blue-900"
        >
          laubonghaudoi/subtitle-editor
        </Link>
        . I will check issues and accept PRs regularly, but I am quite busy
        these days so I may not have time to develop new features. This is a
        community project and your contributions are always welcomed!
      </p>
      <h2 className="text-xl font-bold my-4">Have feedback?</h2>
      <p>
        Feel free to{" "}
        <Link
          href="https://github.com/laubonghaudoi/subtitle-editor/issues"
          target="_blank"
          className="hover:underline text-blue-800 hover:text-blue-900"
        >
          open an issue on GitHub
        </Link>
        . I want to keep this app as minimalistic as possible, so these features
        are non-goals and I don&apos;t plan to add them:
      </p>
      <ul className="list-disc mx-6 my-2">
        <li>Account registration</li>
        <li>Cloud storage</li>
        <li>Collaborative editing</li>
        <li>AI transcription</li>
        <li>Translation</li>
        <li>Complex subtitle editing such as VTT files.</li>
      </ul>
      <p>
        I discussed my reasoning for not including them in{" "}
        <Link
          href="https://github.com/laubonghaudoi/subtitle-editor/issues/11#issuecomment-3201949429"
          target="_blank"
          className="hover:underline text-blue-800 hover:text-blue-900"
        >
          this GitHub issue
        </Link>
        . If you need any of these advanced features, please use the other
        options I listed above.
      </p>

      <h2 className="text-xl font-bold my-4">
        I need an AI transcriber / srt generator, any recommendations?
      </h2>
      <p>
        Yes I recommend generating the srt file with an AI transcriber first,
        then editing it with this editor. That&apos;s why I listed &quot;AI
        transcriptions&quot; as a non-goal above. It&apos;s much easier to just use a
        specialized tool for that than building it into this editor. There are
        many free srt generators available on huggingface, such as:
      </p>
      <ul className="list-disc mx-6 my-2">
        <li>
          <Link
            href="https://huggingface.co/spaces/k2-fsa/generate-subtitles-for-videos"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            k2-fsa/generate-subtitles-for-videos
          </Link>
        </li>
        <li>
          <Link
            href="https://huggingface.co/spaces/BatuhanYilmaz/Whisper-Auto-Subtitled-Video-Generator"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            BatuhanYilmaz/Whisper-Auto-Subtitled-Video-Generator
          </Link>
        </li>
        <li>
          <Link
            href="https://huggingface.co/spaces/NeuralFalcon/Whisper-Turbo-Subtitle"
            target="_blank"
            className="hover:underline text-blue-800 hover:text-blue-900"
          >
            NeuralFalcon/Whisper-Turbo-Subtitle
          </Link>
        </li>
      </ul>
      <p>
        You can also download{" "}
        <Link
          href="https://www.nikse.dk/subtitleedit"
          className="hover:underline text-blue-800 hover:text-blue-900"
        >
          Subtitle Edit
        </Link>{" "}
        I mentioned above, which has built-in AI transcription capabilities.
      </p>
      <h2 className="text-xl font-bold my-4">
        I want to download a YouTube video and extract the subtitles of it, how?
      </h2>
      <p>
        Use{" "}
        <Link
          href="https://github.com/yt-dlp/yt-dlp"
          className="hover:underline text-blue-800 hover:text-blue-900"
        >
          yt-dlp
        </Link>
        . It&apos;s free and the most reliable YouTube video downloader. It also
        supports downloading subtitles directly if they are available.
      </p>
      <Button asChild variant="secondary" className="my-8">
        <Link href="/">Back to Editor</Link>
      </Button>
    </div>
  );
}
