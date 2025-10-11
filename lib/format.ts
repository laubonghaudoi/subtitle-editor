import type { Subtitle } from "@/types/subtitle";
import { srtToVtt } from "@/lib/utils";

export const buildSrtContent = (subtitles: Subtitle[]): string => {
  return subtitles
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((subtitle) => {
      return `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`;
    })
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
