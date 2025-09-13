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

export const buildVttContent = (subtitles: Subtitle[]): string => {
  const srt = buildSrtContent(subtitles);
  return srtToVtt(srt);
};

// Optional helper for SRT export if we decide to strip VTT-only tags.
export const stripVttStyling = (text: string, allowBasic = true): string => {
  if (!allowBasic) return text.replace(/<\/?[^>]+>/g, "");
  // Remove all tags except <i>, <b>, <u>
  return text.replace(/<(?!\/?(?:i|b|u)\b)[^>]+>/g, "");
};

