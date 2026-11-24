import type { FaqContent } from "../faq-document";

export default {
  metadata: {
    title: "Subtitle Editor FAQ | Editing, timing and saving subtitles",
    description:
      "Learn how to edit and sync SRT and WebVTT subtitles, work with multiple tracks, and save the finished files from your browser.",
  },
  heading: "Subtitle Editor FAQ",
  backToEditor: "Back to the subtitle editor",
  languageLabel: "FAQ language",
  questions: {
    "edit-subtitles": {
      question: "How do I edit an SRT or WebVTT file?",
      answer:
        "Choose Load Subtitles and open your .srt or .vtt file. Click a subtitle’s text, make your change and press Enter to confirm. To check the line against the recording, choose Load Media and open the matching video or audio file.",
    },
    "sync-subtitles": {
      question: "How do I sync subtitles that appear too early or too late?",
      answer:
        "For one line, drag the left or right edge of its block on the waveform to match the start or end of the speech. If every line in a track is early by the same amount, open Bulk offset, choose Whole subtitle and set a positive offset in seconds. For lines that appear late, use a negative offset. Check the preview, then choose Apply offset.",
    },
    "convert-srt-vtt": {
      question: "How do I convert SRT to WebVTT or WebVTT to SRT?",
      answer:
        "Open the source file with Load Subtitles. Choose Save, find the track and select .vtt to make a WebVTT file or .srt to make an SRT file. Both formats contain the subtitle text and timing. Keep your original WebVTT file if you also need its positioning or styling.",
    },
    "multiple-tracks": {
      question: "Can I edit subtitles in two languages for the same video?",
      answer:
        "Yes. Open the first subtitle file, then choose Load Subtitles and Add New Track for the other language. You can keep up to four tracks open for the same recording. Switch between their tabs to edit each language and save each track separately.",
    },
    "save-subtitles": {
      question:
        "Which export format should I choose, and where does the file go?",
      answer:
        "Under Save, choose the format for your track. SRT and WebVTT include timestamps for playback. TXT gives you just the lines of text. CSV includes each line’s identifier, start time, end time and text. If your browser opens a save dialog, choose the filename and folder there. Otherwise, enter a filename in the editor and choose Download. Your browser’s download settings determine the destination.",
    },
    privacy: {
      question: "Who can see the video and subtitles I open?",
      answer:
        "Your browser reads the media and subtitle files on your device. The editor processes their contents locally without uploading them or asking for an account. It keeps a local recovery copy of your subtitle tracks and settings. The website also uses hosting and analytics services that can receive information about the visit.",
    },
    offline: {
      question: "Can I work offline and resume later?",
      answer:
        "Open the editor once while online and allow it to finish loading. Once your browser has cached the app, you can reopen it offline in the same browser. It can restore your subtitle tracks, but you’ll need to open the media file again. Save an exported copy to keep your work if you clear the site’s data.",
    },
    "media-formats": {
      question: "Why won’t my video or audio file play?",
      answer: [
        "Playback depends on which containers and codecs your browser and operating system can decode. The empty media panel lists the formats your browser reports that it supports. If a file won’t play, you can convert it locally with ",
        { link: "ffmpeg", label: "FFmpeg" },
        " and open the converted copy.",
      ],
    },
    transcription: {
      question: "How do I make subtitles from a recording automatically?",
      answer: [
        "Start with a transcription tool such as ",
        { link: "whisper", label: "Whisper" },
        " and export the transcript as SRT or WebVTT. Then open that file here to correct the words and adjust their timing. Transcription and automatic translation happen outside this editor.",
      ],
    },
    "youtube-subtitles": {
      question: "How do I edit captions from a YouTube video?",
      answer: [
        "Save a copy of the video’s captions as SRT or WebVTT, then open it with Load Subtitles. If you use yt-dlp, its ",
        { link: "ytdlp", label: "subtitle options" },
        " let you list and download available caption tracks. To check the timing here, open a local copy of the video with Load Media.",
      ],
    },
    "why-this-editor": {
      question: "Why did you build another subtitle editor?",
      answer: [
        "I tried ",
        { link: "happyScribe", label: "Happy Scribe" },
        ", ",
        { link: "subtitleEdit", label: "Subtitle Edit" },
        " and ",
        { link: "aegisub", label: "Aegisub" },
        " while working on my own subtitles. What I wanted was to open a file on my Mac, see the waveform and hear whether a line was in sync, without installing software or signing up. I built this editor so anyone could do that for free in a browser and change the source code if they wanted.",
      ],
    },
    contribute: {
      question: "How can I report a problem or contribute?",
      answer: [
        "You can ",
        { link: "issues", label: "open an issue on GitHub" },
        ". If something went wrong, tell me which browser you used and what steps led to the problem. I review issues and pull requests when I can. Contributions to the ",
        { link: "repo", label: "open-source project" },
        " are welcome. If you’re proposing a new feature, I’ve explained what I want to keep the editor focused on in the ",
        { link: "scope", label: "project scope discussion" },
        ".",
      ],
    },
  },
} satisfies FaqContent;
