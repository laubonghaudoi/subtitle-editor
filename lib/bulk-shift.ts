import type { Subtitle } from "@/types/subtitle";
import { secondsToTime, timeToSeconds } from "@/lib/utils";

export type BulkShiftTarget = "start" | "end" | "both";

export const computeBulkShift = (
  subtitles: Subtitle[],
  targetUuids: string[],
  offsetSeconds: number,
  target: BulkShiftTarget,
): Subtitle[] => {
  if (!subtitles.length || offsetSeconds === 0) {
    return subtitles;
  }

  const targetSet = new Set(targetUuids);
  if (targetSet.size === 0) {
    return subtitles;
  }

  return subtitles.map((subtitle, index) => {
    if (!targetSet.has(subtitle.uuid)) {
      return subtitle;
    }

    const startSeconds = timeToSeconds(subtitle.startTime);
    const endSeconds = timeToSeconds(subtitle.endTime);
    const duration = Math.max(0, endSeconds - startSeconds);
    const previousSubtitle = index > 0 ? subtitles[index - 1] : null;
    const nextSubtitle =
      index < subtitles.length - 1 ? subtitles[index + 1] : null;
    const previousEndSeconds = previousSubtitle
      ? timeToSeconds(previousSubtitle.endTime)
      : 0;
    const nextStartSeconds = nextSubtitle
      ? timeToSeconds(nextSubtitle.startTime)
      : Number.POSITIVE_INFINITY;
    const previousIsTarget = previousSubtitle
      ? targetSet.has(previousSubtitle.uuid)
      : false;
    const nextIsTarget = nextSubtitle
      ? targetSet.has(nextSubtitle.uuid)
      : false;

    let nextStart = startSeconds;
    let nextEnd = endSeconds;

    if (target === "start") {
      const proposedStart = startSeconds + offsetSeconds;
      if (offsetSeconds < 0) {
        const lowerBound = previousIsTarget
          ? 0
          : Math.max(0, previousEndSeconds);
        nextStart = Math.max(proposedStart, lowerBound);
      } else {
        nextStart = Math.min(proposedStart, endSeconds);
      }
      nextStart = Math.max(0, nextStart);
      if (nextStart > nextEnd) {
        nextEnd = nextStart + duration;
      }
    } else if (target === "end") {
      const proposedEnd = endSeconds + offsetSeconds;
      if (offsetSeconds < 0) {
        nextEnd = Math.max(proposedEnd, nextStart);
      } else {
        const upperBound =
          nextIsTarget || !Number.isFinite(nextStartSeconds)
            ? proposedEnd
            : Math.max(nextStartSeconds, nextStart);
        nextEnd = Math.min(proposedEnd, upperBound);
      }
      nextEnd = Math.max(nextStart, nextEnd);
      if (nextSubtitle === null && offsetSeconds > 0) {
        nextEnd = Math.max(nextEnd, proposedEnd);
      }
      if (nextEnd < nextStart) {
        nextEnd = nextStart;
      }
    } else if (target === "both") {
      const minOffset = Math.max(
        previousIsTarget ? -startSeconds : previousEndSeconds - startSeconds,
        -startSeconds,
      );
      const maxOffset =
        nextSubtitle && !nextIsTarget
          ? nextStartSeconds - endSeconds
          : Number.POSITIVE_INFINITY;
      const clampedOffset = Math.min(
        Math.max(offsetSeconds, minOffset),
        maxOffset,
      );

      nextStart = Math.max(0, startSeconds + clampedOffset);
      nextEnd = Math.max(nextStart, endSeconds + clampedOffset);
    }

    return {
      ...subtitle,
      startTime: secondsToTime(nextStart),
      endTime: secondsToTime(nextEnd),
    };
  });
};
