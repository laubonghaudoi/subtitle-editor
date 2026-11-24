import type { SubtitleTiming } from "./subtitle-lookup";

export type CueDirection = "previous" | "next";

/** Cues on the active track are sorted by start time. */
export function getAdjacentCue(
  timings: SubtitleTiming[],
  time: number,
  direction: CueDirection,
): SubtitleTiming | undefined {
  if (direction === "next") {
    return timings.find((cue) => cue.start > time);
  }

  const lastStarted = timings.findLast((cue) => cue.start <= time);
  if (!lastStarted || time >= lastStarted.end) {
    return lastStarted;
  }
  return timings.findLast((cue) => cue.start < lastStarted.start);
}

export const CUE_PREVIEW_SEEK_OFFSET_SECONDS = 0.000001;

export function getCuePreviewSeekTime(
  startSeconds: number,
  endSeconds: number,
) {
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return startSeconds;
  }

  const previewTime = startSeconds + CUE_PREVIEW_SEEK_OFFSET_SECONDS;
  return previewTime < endSeconds ? previewTime : startSeconds;
}
