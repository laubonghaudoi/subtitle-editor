import type { Subtitle } from "@/types/subtitle";
import { secondsToTime } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export type TranscriptSegmentationMode =
  | "lines"
  | "sentences"
  | "maxCharacters";

export interface TranscriptSegmentationOptions {
  mode: TranscriptSegmentationMode;
  startTimeSeconds: number;
  cueDurationSeconds: number;
  gapSeconds: number;
  maxCharactersPerCue?: number;
}

export const TRANSCRIPT_SEGMENTATION_DEFAULTS = {
  mode: "lines" as const,
  startTimeSeconds: 0,
  cueDurationSeconds: 3,
  gapSeconds: 0.2,
  maxCharactersPerCue: 80,
};

const normalizeInlineWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

const getPositiveNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const getNonNegativeNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) && value >= 0 ? value : fallback;

const splitByLines = (text: string): string[] =>
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const splitBySentences = (text: string): string[] => {
  const normalized = normalizeInlineWhitespace(text);
  if (!normalized) return [];
  return (
    normalized
      .match(/[^.!?]+(?:[.!?]+|$)/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
};

const splitByMaxCharacters = (
  text: string,
  maxCharactersPerCue: number,
): string[] => {
  const normalized = normalizeInlineWhitespace(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let current = "";

  for (const word of normalized.split(" ")) {
    if (!current) {
      current = word;
      continue;
    }

    const candidate = `${current} ${word}`;
    if (candidate.length <= maxCharactersPerCue) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = word;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const splitTranscript = (
  text: string,
  options: TranscriptSegmentationOptions,
): string[] => {
  if (options.mode === "sentences") {
    return splitBySentences(text);
  }

  if (options.mode === "maxCharacters") {
    const maxCharactersPerCue = Math.floor(
      getPositiveNumber(
        options.maxCharactersPerCue ??
          TRANSCRIPT_SEGMENTATION_DEFAULTS.maxCharactersPerCue,
        TRANSCRIPT_SEGMENTATION_DEFAULTS.maxCharactersPerCue,
      ),
    );
    return splitByMaxCharacters(text, maxCharactersPerCue);
  }

  return splitByLines(text);
};

export const segmentTranscriptToSubtitles = (
  text: string,
  options: TranscriptSegmentationOptions,
): Subtitle[] => {
  const cueDurationSeconds = getPositiveNumber(
    options.cueDurationSeconds,
    TRANSCRIPT_SEGMENTATION_DEFAULTS.cueDurationSeconds,
  );
  const gapSeconds = getNonNegativeNumber(
    options.gapSeconds,
    TRANSCRIPT_SEGMENTATION_DEFAULTS.gapSeconds,
  );
  const startTimeSeconds = getNonNegativeNumber(
    options.startTimeSeconds,
    TRANSCRIPT_SEGMENTATION_DEFAULTS.startTimeSeconds,
  );

  return splitTranscript(text, options).map((cueText, index) => {
    const startSeconds =
      startTimeSeconds + index * (cueDurationSeconds + gapSeconds);
    return {
      uuid: uuidv4(),
      id: index + 1,
      startTime: secondsToTime(startSeconds),
      endTime: secondsToTime(startSeconds + cueDurationSeconds),
      text: cueText,
    };
  });
};
