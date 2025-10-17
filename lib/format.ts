import { srtToVtt } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";

const sortSubtitlesById = (subtitles: Subtitle[]) => {
  return subtitles.slice().sort((a, b) => a.id - b.id);
};

const flattenSubtitleText = (subtitle: Subtitle): string => {
  const text = stripVttStyling(subtitle.text, false);
  return text
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toCsvCell = (value: string | number): string => {
  const cell = String(value);
  if (cell === "") return '""';
  if (/[",\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
};

export const buildSrtContent = (subtitles: Subtitle[]): string => {
  return sortSubtitlesById(subtitles)
    .map((subtitle) => {
      return `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`;
    })
    .join("\n");
};

export const buildPlainTextContent = (subtitles: Subtitle[]): string => {
  return sortSubtitlesById(subtitles)
    .map((subtitle) => flattenSubtitleText(subtitle))
    .join("\n");
};

export const buildCsvContent = (subtitles: Subtitle[]): string => {
  const header = ["id", "start_time", "end_time", "text"];
  const rows = sortSubtitlesById(subtitles).map((subtitle) => [
    subtitle.id,
    subtitle.startTime,
    subtitle.endTime,
    flattenSubtitleText(subtitle),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => toCsvCell(cell)).join(","))
    .join("\n");
};

export const buildVttContent = (
  subtitles: Subtitle[],
  opts?: { header?: string; prologue?: string[] },
): string => {
  const srt = buildSrtContent(subtitles);
  const header = (opts?.header || "WEBVTT").trim();
  const base = srtToVtt(srt, header);
  if (!opts?.prologue || opts.prologue.length === 0) return base;
  const blocks = opts.prologue.join("\n\n");
  // Insert prologue blocks (NOTE/STYLE/REGION) after header and before cues
  const [first, ...rest] = base.split(/\n\n/);
  return [first, blocks, rest.join("\n\n")].filter(Boolean).join("\n\n");
};

// Optional helper for SRT export if we decide to strip VTT-only tags.
export const stripVttStyling = (text: string, allowBasic = true): string => {
  if (!allowBasic) return text.replace(/<\/?[^>]+>/g, "");
  // Remove all tags except <i>, <b>, <u>
  return text.replace(/<(?!\/?(?:i|b|u)\b)[^>]+>/g, "");
};
