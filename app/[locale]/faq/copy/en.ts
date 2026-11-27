import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "FAQ | Subtitle Editor",
    description: "Frequently asked questions about the subtitle editor.",
  },
  heading: "Frequently Asked Questions",
  backToEditor: "Back to Editor",
  languageLabel: "FAQ language",
  questions: {
    "why-this-editor": {
      question: "Why another subtitle editor?",
      answer: [
        "Yes I know, there are many subtitle editors out there. But I found that none of them is ideal for me so I built this one. Below are the editors that I have tried and what I think are missing in them:",
        {
          list: "ul",
          items: [
            [
              {
                link: "happyScribe",
                label: "Happy Scribe",
              },
              " offers a free online subtitle editor. No account registration is required. Editing subtitles and previewing with the video is very easy. It is the closest to what I need. Unfortunately, it's missing waveform visualization, which is deal breaker for me. It is not open sourced either and we can't customize it.",
            ],
            [
              {
                link: "subtitleEdit",
                label: "Subtitle Edit",
              },
              " is a great option and has all features I need. It supports waveform visualization, easy preview and editing, and even AI transcriptions. But it is a desktop software which requires installation, and it doesn't support Mac. I have to use a Windows or Linux device to edit subtitles.",
            ],
            [
              {
                link: "aegisub",
                label: "Aegisub",
              },
              " is similar to Subtitle Edit. It is a desktop software suitable for more complex subtitle editing. Also I found waveform visualizer not very intuitive. (Btw these desktop softwares have 1990s-style UI which really demoralizes me)",
            ],
            [
              "Other options such as ",
              {
                link: "openSubtitleEditor",
                label: "Open Subtitle Editor",
              },
              " or ",
              {
                link: "movavi",
                label: "Movavi",
              },
              " are either too complex and feature-bloated, or are not free.",
            ],
          ],
        },
        "None of them is open-sourced, and the UIs are either too ugly or too complex, which really bothers my subtitle editing experience. What I want is an editor that is:",
        {
          list: "ol",
          items: [
            "Permanently free",
            "Open-sourced",
            "Fully web-based, no download or installation required",
            "No account sign-up or log-in required",
            "Minimalist UX",
            "Has waveform visualization",
          ],
        },
        "So I built this one.",
      ],
    },
    maintenance: {
      question: "Will you actively maintain this app?",
      answer: [
        [
          "This app is open sourced on GitHub ",
          {
            link: "repo",
            label: "laubonghaudoi/subtitle-editor",
          },
          ". I will check issues and accept PRs regularly, but I am quite busy these days so I may not have time to develop new features. This is a community project and your contributions are always welcomed!",
        ],
      ],
    },
    "media-formats": {
      question: "Can you support more video / audio file formats?",
      answer: [
        [
          "This app relies on the browser's built-in media player to decode the video / audio file you load. So the supported formats are determined by your browser and there is nothing I can do about it. For example, Safari and Microsoft Edge support the AC3 format, while Chrome and Firefox do not. That said, you can still use ",
          {
            link: "ffmpeg",
            label: "ffmpeg",
          },
          " to convert your media files to a supported format before loading them into the editor.",
        ],
      ],
    },
    contribute: {
      question: "Have feedback?",
      answer: [
        [
          "Feel free to ",
          {
            link: "issues",
            label: "open an issue on GitHub",
          },
          ". I want to keep this app as minimalistic as possible, so these features are non-goals and I don't plan to add them:",
        ],
        {
          list: "ul",
          items: [
            "Account registration",
            "Cloud storage",
            "Collaborative editing",
            "AI transcription",
            "Translation",
            "Complex subtitle editing such as VTT files.",
          ],
        },
        [
          "I discussed my reasoning for not including them in ",
          {
            link: "scope",
            label: "this GitHub issue",
          },
          ". If you need any of these advanced features, please use the other options I listed above.",
        ],
      ],
    },
    transcription: {
      question:
        "I need an AI transcriber / srt generator, any recommendations?",
      answer: [
        "Yes I recommend generating the srt file with an AI transcriber first, then editing it with this editor. That's why I listed \"AI transcriptions\" as a non-goal above. It's much easier to just use a specialized tool for that than building it into this editor. There are many free srt generators available on huggingface, such as:",
        {
          list: "ul",
          items: [
            [
              {
                link: "hfK2",
                label: "k2-fsa/generate-subtitles-for-videos",
              },
            ],
            [
              {
                link: "hfBatuhan",
                label: "BatuhanYilmaz/Whisper-Auto-Subtitled-Video-Generator",
              },
            ],
            [
              {
                link: "hfNeuralFalcon",
                label: "NeuralFalcon/Whisper-Turbo-Subtitle",
              },
            ],
          ],
        },
        [
          "You can also download ",
          {
            link: "subtitleEdit",
            label: "Subtitle Edit",
          },
          " I mentioned above, which has built-in AI transcription capabilities.",
        ],
      ],
    },
    "youtube-subtitles": {
      question:
        "I want to download a YouTube video and extract the subtitles of it, how?",
      answer: [
        [
          "Use ",
          {
            link: "ytdlp",
            label: "yt-dlp",
          },
          ". It's free and the most reliable YouTube video downloader. It also supports downloading subtitles directly if they are available.",
        ],
      ],
    },
  },
} satisfies FaqContent;
