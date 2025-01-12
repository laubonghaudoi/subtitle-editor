import type { Subtitle } from "@/types/subtitle";
import { secondsToTime, timeToSeconds } from "./utils";

const DEFAULT_SUBTITLE_DURATION = 3; // seconds

export const reorderSubtitleIds = (subtitles: Subtitle[]): Subtitle[] => {
  let nextId = 1;
  return subtitles.map((subtitle) => {
    const newId = nextId;
    nextId++;
    return { ...subtitle, id: newId };
  });
};

export const updateSubtitleStartTime = (id: number, newTime: string) => {
  return (subtitles: Subtitle[]): Subtitle[] => {
    return subtitles.map((sub) =>
      sub.id === id ? { ...sub, startTime: newTime } : sub
    );
  };
};

export const updateSubtitleEndTime = (id: number, newTime: string) => {
  return (subtitles: Subtitle[]): Subtitle[] => {
    return subtitles.map((sub) =>
      sub.id === id ? { ...sub, endTime: newTime } : sub
    );
  };
};

export const updateSubtitle = (
  subtitles: Subtitle[],
  id: number,
  newText: string
): Subtitle[] => {
  return subtitles.map((sub) =>
    sub.id === id ? { ...sub, text: newText } : sub
  );
};

export const mergeSubtitles = (
  subtitles: Subtitle[],
  id1: number,
  id2: number
): Subtitle[] => {
  const sub1 = subtitles.find((s) => s.id === id1);
  const sub2 = subtitles.find((s) => s.id === id2);
  if (!sub1 || !sub2) return subtitles;
  if (sub1.id > sub2.id) return subtitles;

  const mergedSubtitle = {
    id: sub1.id,
    startTime: sub1.startTime,
    endTime: sub2.endTime,
    text: `${sub1.text}${sub2.text}`,
  };

  const updatedSubtitles = subtitles
    .filter((s) => s.id !== id2)
    .map((sub) => (sub.id === id1 ? mergedSubtitle : sub));

  return reorderSubtitleIds(updatedSubtitles);
};

export const deleteSubtitle = (
  subtitles: Subtitle[],
  id: number
): Subtitle[] => {
  const updatedSubtitles = subtitles.filter((sub) => sub.id !== id);
  return reorderSubtitleIds(updatedSubtitles);
};

export const addSubtitle = (
  subtitles: Subtitle[],
  beforeId: number,
  afterId: number | null
): Subtitle[] => {
  const beforeSub = subtitles.find((s) => s.id === beforeId);
  if (!beforeSub) return subtitles;

  let newSubtitle: Subtitle;
  if (afterId === null) {
    // Adding at the end
    const endTimeSeconds =
      timeToSeconds(beforeSub.endTime) + DEFAULT_SUBTITLE_DURATION;
    newSubtitle = {
      id: beforeSub.id + 1,
      startTime: beforeSub.endTime,
      endTime: secondsToTime(endTimeSeconds),
      text: "New subtitle",
    };
  } else {
    // Adding in between
    const afterSub = subtitles.find((s) => s.id === afterId);
    if (!afterSub) return subtitles;
    newSubtitle = {
      id: beforeSub.id + 1,
      startTime: beforeSub.endTime,
      endTime: afterSub.startTime,
      text: "New subtitle",
    };
  }

  const index = subtitles.findIndex((s) => s.id === beforeId);
  const updatedSubtitles = [
    ...subtitles.slice(0, index + 1),
    newSubtitle,
    ...subtitles.slice(index + 1),
  ];

  return reorderSubtitleIds(updatedSubtitles);
};

/**
 * Split one subtitle into two, based on caret position in the text.
 *
 * The ratio of times is caretPos / textLength.
 * Example:
 *  text = "abcde" (length=5)
 *  caret between c and d => caretPos=3
 *  ratio=3/5=0.6
 *  -> The new endTime of the first subtitle = oldStart + 0.6*(oldEnd - oldStart).
 *  -> The second subtitle starts at that same timestamp.
 */
export function splitSubtitle(
  subtitles: Subtitle[],
  id: number,
  caretPos: number,
  textLength: number
): Subtitle[] {
  // Find the subtitle to split
  const sub = subtitles.find((s) => s.id === id);
  if (!sub) return subtitles; // if not found, do nothing

  // Avoid splitting at start/end (caret=0 or caret=textLength) if you want
  if (caretPos <= 0 || caretPos >= textLength) {
    // No real split
    return subtitles;
  }

  const oldStartSec = timeToSeconds(sub.startTime);
  const oldEndSec = timeToSeconds(sub.endTime);
  const totalSec = oldEndSec - oldStartSec;

  // The fraction of time based on the caret ratio
  const ratio = caretPos / textLength;
  const splitSec = oldStartSec + ratio * totalSec;

  // Create first half
  const first: Subtitle = {
    ...sub,
    endTime: secondsToTime(splitSec),
    text: sub.text.slice(0, caretPos),
  };

  // Create second half
  const second: Subtitle = {
    ...sub,
    id: sub.id + 1, // we'll reorder IDs anyway
    startTime: secondsToTime(splitSec),
    text: sub.text.slice(caretPos),
  };

  // Remove original and insert the two halves at the same position
  const index = subtitles.findIndex((s) => s.id === id);
  const updated = [...subtitles];
  updated.splice(index, 1, first, second);

  // Reorder IDs to keep them consecutive
  return reorderSubtitleIds(updated);
}

export function splitSubtitleByTime(
  subtitles: Subtitle[],
  id: number,
  splitTimeSec: number
): Subtitle[] {
  const sub = subtitles.find((s) => s.id === id);
  if (!sub) return subtitles; // if not found, do nothing

  const startSec = timeToSeconds(sub.startTime);
  const endSec = timeToSeconds(sub.endTime);
  // Don’t split if the clicked time is outside the region.
  if (splitTimeSec <= startSec || splitTimeSec >= endSec) return subtitles;

  const ratio = (splitTimeSec - startSec) / (endSec - startSec);

  // Figure out where in the text we want to split.
  // e.g. floor(ratio * text.length)
  const splitIndex = Math.floor(ratio * sub.text.length);

  const firstText = sub.text.slice(0, splitIndex).trim();
  const secondText = sub.text.slice(splitIndex).trim();

  // Create two new subtitles:
  // 1) Original from startTime → splitTime
  // 2) New from splitTime → endTime
  const first: Subtitle = {
    ...sub,
    endTime: secondsToTime(splitTimeSec),
    text: firstText || "New subtitle",
  };

  // This is an easy way to ensure a unique ID. You can do something else if you prefer.
  const second: Subtitle = {
    id: sub.id + 1,
    startTime: secondsToTime(splitTimeSec),
    endTime: sub.endTime,
    text: secondText || "New subtitle",
  };

  // Remove original and insert the two halves at the same position
  const index = subtitles.findIndex((s) => s.id === id);
  const updated = [...subtitles];
  updated.splice(index, 1, first, second);

  // Reorder IDs to keep them consecutive
  return reorderSubtitleIds(updated);
}
