export interface SubtitleTiming {
  start: number;
  end: number;
}

const isValidIndex = (timings: SubtitleTiming[], index: number) =>
  index >= 0 && index < timings.length;

const isTimeWithin = (timing: SubtitleTiming, time: number) =>
  time >= timing.start && time < timing.end;

/**
 * Resolve which subtitle index is active for the given playback time.
 * The function prefers to reuse the previous index when possible and otherwise
 * falls back to a binary search, so the average work per tick stays close to O(1).
 */
export function findActiveSubtitleIndex(
  timings: SubtitleTiming[],
  time: number,
  previousIndex: number,
): number {
  if (!Number.isFinite(time) || timings.length === 0) {
    return -1;
  }

  if (isValidIndex(timings, previousIndex)) {
    if (isTimeWithin(timings[previousIndex], time)) {
      return previousIndex;
    }

    if (time >= timings[previousIndex].end) {
      for (let forward = previousIndex + 1; forward < timings.length; forward += 1) {
        const timing = timings[forward];
        if (time < timing.start) {
          break;
        }
        if (isTimeWithin(timing, time)) {
          return forward;
        }
      }
    } else if (time < timings[previousIndex].start) {
      for (let backward = previousIndex - 1; backward >= 0; backward -= 1) {
        const timing = timings[backward];
        if (time >= timing.end) {
          break;
        }
        if (isTimeWithin(timing, time)) {
          return backward;
        }
      }
    }
  }

  let low = 0;
  let high = timings.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const timing = timings[mid];
    if (time < timing.start) {
      high = mid - 1;
    } else if (time >= timing.end) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return -1;
}
