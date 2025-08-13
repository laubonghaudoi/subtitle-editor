import type { Metadata } from "next"; // Import Metadata type
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "edge";

// Add specific metadata for the FAQ page
export const metadata: Metadata = {
  title: "FAQ", // Will use template: "FAQ | Subtitle Editor Online"
  description:
    "Frequently asked questions about the subtitle editor, including features, comparisons, maintenance, and feedback.",
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
                  text: "Feel free to open an issue on GitHub. I want to keep this app as minimalistic as possible, so these features are non-goals and I don't plan to add them: Account registration, Cloud storage, Collaborative editing, AI transcription, Translation, Complex subtitle editing such as VTT files.",
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
          <a
            href="https://www.happyscribe.com/subtitle-tools/online-subtitle-editor/free"
            className="hover:underline text-blue-600 hover:text-blue-800"
          >
            Happy Scribe
          </a>{" "}
          offers a free online subtitle editor. No account registration is
          required. Editing subtitles and previewing with the video is very
          easy. It is the closest to what I need. Unfortunately, it's missing
          waveform visualization, which is deal breaker for me. It is not open
          sourced either and we can't customize it.
        </li>
        <li>
          <a
            href="https://www.nikse.dk/subtitleedit"
            className="hover:underline text-blue-600 hover:text-blue-800"
          >
            Subtitle Edit
          </a>{" "}
          is a great option and has all features I need. It supports waveform
          visualization, easy preview and editing, and even AI transcriptions.
          But it is a desktop software which requires installation, and it
          doesn't support Mac. I have to use a Windows or Linux device to edit
          subtitles.
        </li>
        <li>
          <a
            href="https://aegisub.org/"
            className="hover:underline text-blue-600 hover:text-blue-800"
          >
            Aegisub
          </a>{" "}
          is similar to Subtitle Edit. It is a desktop software suitable for
          more complex subtitle editing. Also I found waveform visualizer not
          very intuitive. (Btw these desktop softwares have 1990s-style UI which
          really demoralizes me)
        </li>
        <li>
          Other options such as{" "}
          <a
            href="https://opensubtitleed.sourceforge.net/"
            className="hover:underline text-blue-600 hover:text-blue-800"
          >
            Open Subtitle Editor
          </a>{" "}
          or{" "}
          <a
            href="https://www.movavi.com/"
            className="hover:underline text-blue-600 hover:text-blue-800"
          >
            Movavi
          </a>{" "}
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
        <a
          href="https://github.com/laubonghaudoi/subtitle-editor"
          className="hover:underline text-blue-600 hover:text-blue-800"
        >
          laubonghaudoi/subtitle-editor
        </a>
        . I will check issues and accept PRs regularly, but I am quite busy
        these days so I may not have time to develop new features. This is a
        community project and your contributions are always welcomed!
      </p>
      <h2 className="text-xl font-bold my-4">Have feedback?</h2>
      <p>
        Feel free to{" "}
        <a
          href="https://github.com/laubonghaudoi/subtitle-editor/issues"
          className="hover:underline text-blue-600 hover:text-blue-800"
        >
          open an issue on GitHub
        </a>
        . I want to keep this app as minimalistic as possible, so these features
        are non-goals and I don't plan to add them:
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
        If you need any of these advanced features, please use the other options
        I listed above.
      </p>
      <Button asChild variant="secondary" className="my-8">
        <Link href="/">Back to Editor</Link>
      </Button>
    </div>
  );
}
