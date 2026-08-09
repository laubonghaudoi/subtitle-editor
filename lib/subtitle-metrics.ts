import type { Subtitle } from "@/types/subtitle";

/**
 * Types of metric warnings that can be detected on subtitle cues or tracks.
 */
export type MetricWarningType =
  | "invalid-time"
  | "invalid-duration"
  | "short-duration"
  | "high-cps"
  | "high-wpm"
  | "empty-text"
  | "overlap"
  | "short-gap";

/**
 * Represents a metric warning or quality issue found during evaluation.
 */
export interface MetricWarning {
  type: MetricWarningType;
  message: string;
  cueIndex: number;
  cueUuid?: string;
  cueId?: number;
  value?: number;
  threshold?: number;
}

/**
 * Detailed calculated metrics for a single subtitle cue.
 */
export interface CueMetrics {
  index: number;
  uuid: string;
  id: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  charCount: number;
  wordCount: number;
  cps: number;
  wpm: number;
  gapFromPreviousSeconds?: number;
  overlapWithPreviousSeconds?: number;
  warnings: MetricWarning[];
}

/**
 * Aggregated metrics for a complete subtitle track or list of cues.
 */
export interface TrackMetrics {
  totalCues: number;
  totalDurationSeconds: number;
  timelineSpanSeconds: number;
  totalCharCount: number;
  totalWordCount: number;
  averageCps: number;
  averageWpm: number;
  maxCps: number;
  maxWpm: number;
  cues: CueMetrics[];
  warnings: MetricWarning[];
}

/**
 * Configurable threshold options for subtitle metrics.
 */
export interface SubtitleMetricsOptions {
  /**
   * Minimum recommended cue duration in seconds.
   * @default 1.0
   */
  minDuration?: number;

  /**
   * Maximum recommended characters per second (CPS).
   * @default 20.0
   */
  maxCps?: number;

  /**
   * Maximum recommended words per minute (WPM).
   * @default 200.0
   */
  maxWpm?: number;

  /**
   * Minimum recommended gap between consecutive cues in seconds.
   * Gaps below this (and >= 0) generate a short-gap warning.
   * @default 0.080 (80ms)
   */
  minGap?: number;

  /**
   * Maximum allowable overlap in seconds before triggering an overlap warning.
   * @default 0.0
   */
  overlapTolerance?: number;
}

/**
 * Default threshold values used when options are omitted.
 */
export const DEFAULT_METRICS_OPTIONS: Required<SubtitleMetricsOptions> = {
  minDuration: 1.0,
  maxCps: 20.0,
  maxWpm: 200.0,
  minGap: 0.08,
  overlapTolerance: 0.0,
};

/**
 * Helper to round floating-point numbers to millisecond precision (3 decimal places).
 */
export function roundToMs(num: number): number {
  return Math.round(num * 1000) / 1000;
}

/**
 * Helper to round CPS / WPM metrics to 2 decimal places.
 */
export function roundMetric(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Safely parses a subtitle timestamp string into seconds.
 * Supports SRT format (HH:MM:SS,mmm), VTT format (HH:MM:SS.mmm or MM:SS.mmm),
 * and plain numeric strings. Returns NaN if unparseable.
 */
export function parseTimestampToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") {
    return Number.NaN;
  }

  const trimmed = timeStr.trim();
  if (trimmed === "") {
    return Number.NaN;
  }

  try {
    const parts = trimmed.replace(",", ".").split(":");
    if (parts.length === 3) {
      const h = Number.parseFloat(parts[0]);
      const m = Number.parseFloat(parts[1]);
      const s = Number.parseFloat(parts[2]);
      if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) {
        return Number.NaN;
      }
      return roundToMs(h * 3600 + m * 60 + s);
    }
    if (parts.length === 2) {
      const m = Number.parseFloat(parts[0]);
      const s = Number.parseFloat(parts[1]);
      if (Number.isNaN(m) || Number.isNaN(s)) {
        return Number.NaN;
      }
      return roundToMs(m * 60 + s);
    }
    if (parts.length === 1) {
      const s = Number.parseFloat(parts[0]);
      return Number.isNaN(s) ? Number.NaN : roundToMs(s);
    }
  } catch {
    return Number.NaN;
  }

  return Number.NaN;
}

/**
 * Strips WebVTT and HTML tags, normalizes whitespace, and calculates
 * character and word counts for subtitle text.
 */
export function stripVttTagsAndNormalize(text: string): {
  cleanText: string;
  charCount: number;
  wordCount: number;
} {
  if (!text || typeof text !== "string") {
    return { cleanText: "", charCount: 0, wordCount: 0 };
  }

  // Remove HTML and WebVTT markup tags (e.g., <v Speaker>, <b>, <i>, <00:00.000>)
  const withoutTags = text.replace(/<[^>]+>/g, "");

  // Convert line breaks and multiple whitespace characters to a single space
  const cleanText = withoutTags.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

  const charCount = cleanText.length;
  const wordCount = cleanText === "" ? 0 : cleanText.split(" ").length;

  return { cleanText, charCount, wordCount };
}

/**
 * Calculates Characters Per Second (CPS) for a given character count and duration.
 */
export function calculateCps(charCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0 || Number.isNaN(durationSeconds) || charCount <= 0) {
    return 0;
  }
  return roundMetric(charCount / durationSeconds);
}

/**
 * Calculates Words Per Minute (WPM) for a given word count and duration.
 */
export function calculateWpm(wordCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0 || Number.isNaN(durationSeconds) || wordCount <= 0) {
    return 0;
  }
  return roundMetric((wordCount / durationSeconds) * 60);
}

/**
 * Computes metrics and detects warnings for an individual subtitle cue.
 */
export function calculateCueMetrics(
  subtitle: Subtitle,
  index = 0,
  previousSubtitle?: Subtitle,
  options?: SubtitleMetricsOptions,
): CueMetrics {
  const opts = { ...DEFAULT_METRICS_OPTIONS, ...options };
  const warnings: MetricWarning[] = [];

  const startTimeSeconds = parseTimestampToSeconds(subtitle?.startTime);
  const endTimeSeconds = parseTimestampToSeconds(subtitle?.endTime);

  const startValid = !Number.isNaN(startTimeSeconds);
  const endValid = !Number.isNaN(endTimeSeconds);

  if (!startValid || !endValid) {
    warnings.push({
      type: "invalid-time",
      message: `Invalid timestamp format in cue: startTime="${subtitle?.startTime}", endTime="${subtitle?.endTime}"`,
      cueIndex: index,
      cueUuid: subtitle?.uuid,
      cueId: subtitle?.id,
    });
  }

  let durationSeconds = 0;
  if (startValid && endValid) {
    const rawDuration = roundToMs(endTimeSeconds - startTimeSeconds);
    if (rawDuration <= 0) {
      warnings.push({
        type: "invalid-duration",
        message: `Cue end time (${endTimeSeconds.toFixed(3)}s) is before or equal to start time (${startTimeSeconds.toFixed(3)}s)`,
        cueIndex: index,
        cueUuid: subtitle?.uuid,
        cueId: subtitle?.id,
        value: rawDuration,
      });
    } else {
      durationSeconds = rawDuration;
    }
  }

  const { charCount, wordCount } = stripVttTagsAndNormalize(subtitle?.text ?? "");

  if (charCount === 0) {
    warnings.push({
      type: "empty-text",
      message: "Subtitle text is empty",
      cueIndex: index,
      cueUuid: subtitle?.uuid,
      cueId: subtitle?.id,
    });
  }

  const cps = calculateCps(charCount, durationSeconds);
  const wpm = calculateWpm(wordCount, durationSeconds);

  if (durationSeconds > 0) {
    if (durationSeconds < opts.minDuration) {
      warnings.push({
        type: "short-duration",
        message: `Cue duration (${durationSeconds.toFixed(3)}s) is below minimum threshold (${opts.minDuration.toFixed(3)}s)`,
        cueIndex: index,
        cueUuid: subtitle?.uuid,
        cueId: subtitle?.id,
        value: durationSeconds,
        threshold: opts.minDuration,
      });
    }

    if (cps > opts.maxCps) {
      warnings.push({
        type: "high-cps",
        message: `CPS (${cps.toFixed(1)}) exceeds maximum threshold (${opts.maxCps.toFixed(1)})`,
        cueIndex: index,
        cueUuid: subtitle?.uuid,
        cueId: subtitle?.id,
        value: cps,
        threshold: opts.maxCps,
      });
    }

    if (wpm > opts.maxWpm) {
      warnings.push({
        type: "high-wpm",
        message: `WPM (${wpm.toFixed(1)}) exceeds maximum threshold (${opts.maxWpm.toFixed(1)})`,
        cueIndex: index,
        cueUuid: subtitle?.uuid,
        cueId: subtitle?.id,
        value: wpm,
        threshold: opts.maxWpm,
      });
    }
  }

  let gapFromPreviousSeconds: number | undefined;
  let overlapWithPreviousSeconds: number | undefined;

  if (previousSubtitle && startValid) {
    const prevEndSeconds = parseTimestampToSeconds(previousSubtitle.endTime);
    if (!Number.isNaN(prevEndSeconds)) {
      const rawGap = roundToMs(startTimeSeconds - prevEndSeconds);
      gapFromPreviousSeconds = rawGap;

      if (rawGap < -opts.overlapTolerance) {
        overlapWithPreviousSeconds = roundToMs(Math.abs(rawGap));
        warnings.push({
          type: "overlap",
          message: `Cue overlaps with previous cue by ${overlapWithPreviousSeconds.toFixed(3)}s`,
          cueIndex: index,
          cueUuid: subtitle?.uuid,
          cueId: subtitle?.id,
          value: overlapWithPreviousSeconds,
          threshold: opts.overlapTolerance,
        });
      } else if (rawGap >= 0 && rawGap < opts.minGap) {
        warnings.push({
          type: "short-gap",
          message: `Gap from previous cue (${rawGap.toFixed(3)}s) is below minimum threshold (${opts.minGap.toFixed(3)}s)`,
          cueIndex: index,
          cueUuid: subtitle?.uuid,
          cueId: subtitle?.id,
          value: rawGap,
          threshold: opts.minGap,
        });
      }
    }
  }

  return {
    index,
    uuid: subtitle?.uuid ?? "",
    id: subtitle?.id ?? index + 1,
    startTimeSeconds,
    endTimeSeconds,
    durationSeconds,
    charCount,
    wordCount,
    cps,
    wpm,
    gapFromPreviousSeconds,
    overlapWithPreviousSeconds,
    warnings,
  };
}

/**
 * Calculates aggregated metrics and consolidated warnings across an entire list of subtitles.
 */
export function calculateTrackMetrics(
  subtitles: Subtitle[],
  options?: SubtitleMetricsOptions,
): TrackMetrics {
  const opts = { ...DEFAULT_METRICS_OPTIONS, ...options };

  if (!Array.isArray(subtitles) || subtitles.length === 0) {
    return {
      totalCues: 0,
      totalDurationSeconds: 0,
      timelineSpanSeconds: 0,
      totalCharCount: 0,
      totalWordCount: 0,
      averageCps: 0,
      averageWpm: 0,
      maxCps: 0,
      maxWpm: 0,
      cues: [],
      warnings: [],
    };
  }

  const cuesMetrics: CueMetrics[] = [];
  const trackWarnings: MetricWarning[] = [];

  let totalDurationSeconds = 0;
  let totalCharCount = 0;
  let totalWordCount = 0;
  let maxCps = 0;
  let maxWpm = 0;

  for (let i = 0; i < subtitles.length; i++) {
    const prevSub = i > 0 ? subtitles[i - 1] : undefined;
    const cueMetric = calculateCueMetrics(subtitles[i], i, prevSub, opts);
    cuesMetrics.push(cueMetric);
    trackWarnings.push(...cueMetric.warnings);

    totalDurationSeconds = roundToMs(totalDurationSeconds + cueMetric.durationSeconds);
    totalCharCount += cueMetric.charCount;
    totalWordCount += cueMetric.wordCount;

    if (cueMetric.cps > maxCps) maxCps = cueMetric.cps;
    if (cueMetric.wpm > maxWpm) maxWpm = cueMetric.wpm;
  }

  const firstValidStart = cuesMetrics.find((c) => !Number.isNaN(c.startTimeSeconds))?.startTimeSeconds;
  const lastValidEnd = [...cuesMetrics].reverse().find((c) => !Number.isNaN(c.endTimeSeconds))?.endTimeSeconds;

  let timelineSpanSeconds = 0;
  if (firstValidStart !== undefined && lastValidEnd !== undefined && lastValidEnd >= firstValidStart) {
    timelineSpanSeconds = roundToMs(lastValidEnd - firstValidStart);
  }

  const averageCps = calculateCps(totalCharCount, totalDurationSeconds);
  const averageWpm = calculateWpm(totalWordCount, totalDurationSeconds);

  return {
    totalCues: subtitles.length,
    totalDurationSeconds,
    timelineSpanSeconds,
    totalCharCount,
    totalWordCount,
    averageCps,
    averageWpm,
    maxCps,
    maxWpm,
    cues: cuesMetrics,
    warnings: trackWarnings,
  };
}
