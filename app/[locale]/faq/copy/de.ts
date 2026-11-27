import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "FAQ | Subtitle Editor",
    description: "Häufig gestellte Fragen zum Untertiteleditor.",
  },
  heading: "Häufig gestellte Fragen",
  backToEditor: "Zurück zum Editor",
  languageLabel: "Sprache der häufig gestellten Fragen",
  questions: {
    "why-this-editor": {
      question: "Warum noch ein Untertiteleditor?",
      answer: [
        "Ja, ich weiß, es gibt schon viele Untertiteleditoren. Aber keiner davon war für mich ideal, also habe ich diesen hier entwickelt. Hier sind die Editoren, die ich ausprobiert habe, und was mir daran fehlt:",
        {
          list: "ul",
          items: [
            [
              { link: "happyScribe", label: "Happy Scribe" },
              " bietet einen kostenlosen Online-Untertiteleditor. Man braucht kein Konto. Es ist sehr einfach, Untertitel zu bearbeiten und sie in der Vorschau zusammen mit dem Video anzusehen. Das kommt dem, was ich brauche, am nächsten. Leider fehlt die Wellenformanzeige, und ohne die kommt der Editor für mich nicht infrage. Außerdem ist der Quellcode nicht offen, also können wir den Editor nicht anpassen.",
            ],
            [
              { link: "subtitleEdit", label: "Subtitle Edit" },
              " ist eine tolle Option und hat alle Funktionen, die ich brauche. Es zeigt die Wellenform an, macht die Vorschau und Bearbeitung einfach und unterstützt sogar KI-Transkriptionen. Es ist aber ein Desktopprogramm, das man installieren muss und das den Mac nicht unterstützt. Um Untertitel zu bearbeiten, muss ich also einen Windows- oder Linux-Rechner benutzen.",
            ],
            [
              { link: "aegisub", label: "Aegisub" },
              " ähnelt Subtitle Edit. Es ist ein Desktopprogramm, das sich für aufwendigere Untertitelbearbeitung eignet. Die Wellenformanzeige fand ich auch nicht besonders intuitiv. (Übrigens sehen die Benutzeroberflächen dieser Desktopprogramme aus wie in den 1990er-Jahren, da vergeht mir echt die Lust)",
            ],
            [
              "Andere Optionen wie ",
              { link: "openSubtitleEditor", label: "Open Subtitle Editor" },
              " oder ",
              { link: "movavi", label: "Movavi" },
              " sind entweder zu komplex und mit Funktionen überladen oder kostenpflichtig.",
            ],
          ],
        },
        "Keiner davon ist quelloffen, und die Benutzeroberflächen sind entweder zu hässlich oder zu kompliziert. Das stört mich beim Bearbeiten von Untertiteln wirklich. Was ich mir von einem Editor wünsche:",
        {
          list: "ol",
          items: [
            "Dauerhaft kostenlos",
            "Quelloffen",
            "Läuft vollständig im Browser, ohne Download oder Installation",
            "Keine Registrierung oder Anmeldung erforderlich",
            "Minimalistische Bedienung",
            "Zeigt die Wellenform an",
          ],
        },
        "Also habe ich diesen hier entwickelt.",
      ],
    },
    maintenance: {
      question: "Wirst du diese App aktiv pflegen?",
      answer: [
        [
          "Der Quellcode dieser App ist auf GitHub unter ",
          { link: "repo", label: "laubonghaudoi/subtitle-editor" },
          " verfügbar. Ich werde mir regelmäßig die Issues ansehen und Pull Requests annehmen. Zurzeit bin ich aber ziemlich beschäftigt, sodass ich vielleicht keine Zeit habe, neue Funktionen zu entwickeln. Das ist ein Gemeinschaftsprojekt, und deine Beiträge sind immer willkommen!",
        ],
      ],
    },
    "media-formats": {
      question: "Kannst du mehr Video- und Audiodateiformate unterstützen?",
      answer: [
        [
          "Diese App verwendet den eingebauten Mediaplayer deines Browsers, um die Video- oder Audiodatei zu dekodieren, die du lädst. Welche Formate unterstützt werden, hängt also von deinem Browser ab, und daran kann ich nichts ändern. Zum Beispiel unterstützen Safari und Microsoft Edge das AC3-Format, Chrome und Firefox dagegen nicht. Du kannst deine Mediendateien aber mit ",
          { link: "ffmpeg", label: "ffmpeg" },
          " in ein unterstütztes Format umwandeln, bevor du sie in den Editor lädst.",
        ],
      ],
    },
    contribute: {
      question: "Hast du Feedback?",
      answer: [
        [
          "Du kannst gerne ",
          { link: "issues", label: "ein Issue auf GitHub eröffnen" },
          ". Ich möchte diese App so minimalistisch wie möglich halten. Diese Funktionen gehören deshalb nicht zu meinen Zielen, und ich habe nicht vor, sie hinzuzufügen:",
        ],
        {
          list: "ul",
          items: [
            "Registrierung eines Kontos",
            "Cloudspeicher",
            "Gemeinsames Bearbeiten",
            "KI-Transkription",
            "Übersetzung",
            "Komplexe Untertitelbearbeitung, etwa bei VTT-Dateien.",
          ],
        },
        [
          "Warum ich sie nicht aufnehmen möchte, habe ich in ",
          { link: "scope", label: "diesem GitHub-Issue" },
          " erläutert. Wenn du eine dieser erweiterten Funktionen brauchst, nutze bitte die anderen Optionen, die ich oben aufgelistet habe.",
        ],
      ],
    },
    transcription: {
      question:
        "Ich brauche ein KI-Transkriptionstool oder einen SRT-Generator. Hast du Empfehlungen?",
      answer: [
        "Ja, ich empfehle, die SRT-Datei zuerst mit einem KI-Transkriptionstool zu erzeugen und sie dann mit diesem Editor zu bearbeiten. Deshalb habe ich „KI-Transkriptionen“ oben als etwas aufgeführt, das ich nicht einbauen möchte. Es ist viel einfacher, dafür ein spezialisiertes Werkzeug zu verwenden, als die Funktion in diesen Editor einzubauen. Auf Hugging Face gibt es viele kostenlose SRT-Generatoren, zum Beispiel:",
        {
          list: "ul",
          items: [
            [{ link: "hfK2", label: "k2-fsa/generate-subtitles-for-videos" }],
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
          "Du kannst auch das oben erwähnte ",
          { link: "subtitleEdit", label: "Subtitle Edit" },
          " herunterladen. Es hat eine eingebaute Funktion für KI-Transkriptionen.",
        ],
      ],
    },
    "youtube-subtitles": {
      question:
        "Ich möchte ein YouTube-Video herunterladen und die Untertitel daraus extrahieren. Wie geht das?",
      answer: [
        [
          "Verwende ",
          { link: "ytdlp", label: "yt-dlp" },
          ". Es ist kostenlos und das zuverlässigste Werkzeug zum Herunterladen von YouTube-Videos. Wenn Untertitel verfügbar sind, kannst du sie damit auch direkt herunterladen.",
        ],
      ],
    },
  },
} satisfies FaqContent;
