import type { SubtitleTrack } from "@/types/subtitle";
import {
  buildCsvContent,
  buildPlainTextContent,
  buildSrtContent,
  buildVttContent,
} from "./format";

const mimeTypes = {
  srt: "text/plain",
  vtt: "text/vtt",
  txt: "text/plain",
  csv: "text/csv",
} as const;

export type SubtitleFormat = keyof typeof mimeTypes;

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
};

function serializeTrack(track: SubtitleTrack, format: SubtitleFormat) {
  switch (format) {
    case "vtt":
      return buildVttContent(track.subtitles, {
        header: track.vttHeader,
        prologue: track.vttPrologue,
      });
    case "csv":
      return buildCsvContent(track.subtitles);
    case "txt":
      return buildPlainTextContent(track.subtitles);
    case "srt":
      return buildSrtContent(track.subtitles);
  }
}

export async function saveSubtitleFile(
  track: SubtitleTrack,
  format: SubtitleFormat,
): Promise<"saved" | "cancelled" | File> {
  const baseName =
    track.name.trim().replace(/[\s<>:"/\\|?*\p{Cc}]+/gu, "_") || "subtitles";
  const suggestedName = `${baseName}.${format}`;
  const mime = mimeTypes[format];
  const browser = window as SavePickerWindow;
  let handle: FileSystemFileHandle | undefined;

  // Open the picker during the button's user gesture, before serializing the track.
  if (typeof browser.showSaveFilePicker === "function") {
    try {
      handle = await browser.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: format.toUpperCase(),
            accept: { [mime]: [`.${format}`] },
          },
        ],
      });
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      if (error.name === "AbortError") return "cancelled";
      if (error.name !== "SecurityError") throw error;
    }
  }

  const file = new File([serializeTrack(track, format)], suggestedName, {
    type: mime,
  });
  if (!handle) return file;

  const writable = await handle.createWritable();
  try {
    await writable.write(file);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
  return "saved";
}

export function downloadSubtitleFile(file: File, filename: string) {
  const extension = file.name.slice(file.name.lastIndexOf("."));
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = filename.toLowerCase().endsWith(extension)
      ? filename
      : `${filename}${extension}`;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
