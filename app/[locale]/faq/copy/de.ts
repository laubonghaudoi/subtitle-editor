import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "Fragen zum Subtitle Editor | Untertitel bearbeiten und speichern",
    description:
      "So bearbeiten und synchronisieren Sie SRT- und WebVTT-Untertitel, wechseln zwischen Sprachspuren und speichern Ihre Dateien direkt im Browser.",
  },
  heading: "Häufige Fragen zum Subtitle Editor",
  backToEditor: "Zurück zum Untertiteleditor",
  languageLabel: "Sprache der häufigen Fragen",
  questions: {
    "edit-subtitles": {
      question: "Wie bearbeite ich eine SRT- oder WebVTT-Datei?",
      answer:
        "Wählen Sie „Untertitel laden“ und öffnen Sie Ihre .srt- oder .vtt-Datei. Klicken Sie auf den Text einer Untertitelzeile, ändern Sie ihn und bestätigen Sie mit der Eingabetaste. Zum Abgleichen mit der Aufnahme öffnen Sie über „Medien laden“ die passende Video- oder Audiodatei.",
    },
    "sync-subtitles": {
      question:
        "Was mache ich, wenn die Untertitel zu früh oder zu spät erscheinen?",
      answer:
        "Ziehen Sie für eine einzelne Zeile den linken oder rechten Rand ihres Blocks in der Wellenform an den Anfang oder das Ende der gesprochenen Passage. Erscheinen alle Zeilen einer Spur zu früh, wählen Sie unter „Stapel-Offset“ die Option „Kompletter Untertitel“ und stellen Sie einen positiven Versatz in Sekunden ein. Bei verspäteten Untertiteln nehmen Sie einen negativen Wert. Prüfen Sie die Vorschau und wählen Sie „Versatz anwenden“.",
    },
    "convert-srt-vtt": {
      question: "Wie wandle ich SRT in WebVTT oder WebVTT in SRT um?",
      answer:
        "Öffnen Sie die Ausgangsdatei über „Untertitel laden“. Wählen Sie unter „Speichern“ bei der gewünschten Spur .vtt für eine WebVTT-Datei oder .srt für eine SRT-Datei. Beide Formate enthalten den Untertiteltext und die Zeitmarken. Bewahren Sie die ursprüngliche WebVTT-Datei auf, wenn Sie auch deren Positionierung oder Formatierung benötigen.",
    },
    "multiple-tracks": {
      question:
        "Kann ich Untertitel in zwei Sprachen für dasselbe Video bearbeiten?",
      answer:
        "Ja. Öffnen Sie die erste Untertiteldatei und wählen Sie dann unter „Untertitel laden“ die Option „Neue Spur erstellen“ für die zweite Sprache. Für dieselbe Aufnahme können Sie bis zu vier Spuren öffnen. Wechseln Sie über die Reiter zur gewünschten Sprache und speichern Sie jede Spur einzeln.",
    },
    "save-subtitles": {
      question:
        "Welches Exportformat soll ich wählen und wo finde ich die Datei?",
      answer:
        "Wählen Sie unter „Speichern“ das Format für Ihre Spur. SRT und WebVTT enthalten Zeitmarken für die Wiedergabe. TXT enthält nur den Text. In einer CSV-Datei finden Sie für jede Zeile Kennung, Anfangszeit, Endzeit und Text. Öffnet Ihr Browser einen Speicherdialog, wählen Sie dort Dateinamen und Ordner. Andernfalls geben Sie den Namen im Editor ein und wählen „Herunterladen“. Der Speicherort richtet sich dann nach den Download-Einstellungen Ihres Browsers.",
    },
    privacy: {
      question: "Wer kann meine Video- und Untertiteldateien sehen?",
      answer:
        "Ihr Browser liest die Medien- und Untertiteldateien auf Ihrem Gerät. Der Editor verarbeitet den Inhalt lokal, ohne die Dateien hochzuladen oder ein Konto zu verlangen. Er speichert Ihre Untertitelspuren und Einstellungen zur Wiederherstellung im Browser. Die Website nutzt außerdem Hosting- und Analysedienste, die Informationen über den Seitenbesuch erhalten können.",
    },
    offline: {
      question: "Kann ich offline arbeiten und später weitermachen?",
      answer:
        "Öffnen Sie den Editor einmal mit Internetverbindung und lassen Sie ihn vollständig laden. Sobald der Browser die App zwischengespeichert hat, können Sie sie im selben Browser offline öffnen. Die Untertitelspuren lassen sich wiederherstellen. Die Mediendatei müssen Sie erneut öffnen. Sichern Sie Ihre Arbeit durch einen Export, bevor Sie die Websitedaten löschen.",
    },
    "media-formats": {
      question:
        "Warum lässt sich meine Video- oder Audiodatei nicht abspielen?",
      answer: [
        "Die Wiedergabe hängt davon ab, welche Containerformate und Codecs Ihr Browser und Ihr Betriebssystem unterstützen. Das leere Medienfenster zeigt die vom Browser gemeldeten Formate an. Lässt sich eine Datei nicht abspielen, können Sie sie mit ",
        { link: "ffmpeg", label: "FFmpeg" },
        " lokal konvertieren und die neue Datei öffnen.",
      ],
    },
    transcription: {
      question: "Wie erstelle ich automatisch Untertitel aus einer Aufnahme?",
      answer: [
        "Erstellen Sie mit einem Transkriptionswerkzeug wie ",
        { link: "whisper", label: "Whisper" },
        " eine SRT- oder WebVTT-Datei. Öffnen Sie diese anschließend hier, um den Text zu korrigieren und die Zeitmarken anzupassen. Für Transkription und automatische Übersetzung brauchen Sie ein separates Werkzeug.",
      ],
    },
    "youtube-subtitles": {
      question: "Wie bearbeite ich die Untertitel eines YouTube-Videos?",
      answer: [
        "Speichern Sie die Untertitel des Videos als SRT- oder WebVTT-Datei und öffnen Sie sie über „Untertitel laden“. Mit den ",
        { link: "ytdlp", label: "Untertiteloptionen von yt-dlp" },
        " können Sie verfügbare Spuren auflisten und herunterladen. Zum Prüfen der Zeitmarken öffnen Sie über „Medien laden“ eine lokale Kopie des Videos.",
      ],
    },
    "why-this-editor": {
      question: "Warum hast du einen weiteren Untertiteleditor entwickelt?",
      answer: [
        "Für meine eigenen Untertitel habe ich ",
        { link: "happyScribe", label: "Happy Scribe" },
        ", ",
        { link: "subtitleEdit", label: "Subtitle Edit" },
        " und ",
        { link: "aegisub", label: "Aegisub" },
        " ausprobiert. Ich wollte auf meinem Mac eine Datei öffnen, die Wellenform sehen und sofort hören, ob eine Zeile zur Aufnahme passt. Das sollte ohne Installation und ohne Anmeldung gehen. Deshalb habe ich diesen Editor gebaut. Er ist kostenlos, läuft im Browser und jeder kann den Quellcode anpassen.",
      ],
    },
    contribute: {
      question: "Wie melde ich einen Fehler oder helfe bei der Entwicklung?",
      answer: [
        "Sie können ",
        { link: "issues", label: "auf GitHub einen Fehler melden" },
        ". Nennen Sie bitte den Browser und die Schritte, mit denen sich das Problem nachstellen lässt. Ich sehe mir Meldungen und Pull Requests an, wenn ich Zeit habe. Beiträge zum ",
        { link: "repo", label: "Open-Source-Projekt" },
        " sind willkommen. Welche Funktionen ich für den Editor vorsehe, erläutere ich in der ",
        { link: "scope", label: "Diskussion zum Projektumfang" },
        ".",
      ],
    },
  },
} satisfies FaqContent;
