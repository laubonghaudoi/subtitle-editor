import type { UndoHistory } from "@/hooks/use-undoable-state";
import type { Subtitle } from "@/types/subtitle";

export const EMPTY_HISTORY: UndoHistory<Subtitle[]> = {
  past: [],
  present: [],
  future: [],
};

export const ensureTrackMetadata = (
  subtitles: Subtitle[],
  trackId: string,
): Subtitle[] => {
  let mutated = false;
  const normalized = subtitles.map((subtitle) => {
    if (subtitle.trackId === trackId) {
      return subtitle;
    }
    mutated = true;
    return { ...subtitle, trackId };
  });
  return mutated ? normalized : subtitles;
};

export const subtitlesAreEqual = (
  a: Subtitle[],
  b: Subtitle[],
): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const prev = a[i];
    const next = b[i];
    if (
      prev.id !== next.id ||
      prev.uuid !== next.uuid ||
      prev.startTime !== next.startTime ||
      prev.endTime !== next.endTime ||
      prev.text !== next.text ||
      prev.trackId !== next.trackId
    ) {
      return false;
    }
  }
  return true;
};

export const historiesAreEqual = (
  a: UndoHistory<Subtitle[]> | undefined,
  b: UndoHistory<Subtitle[]> | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.past.length !== b.past.length || a.future.length !== b.future.length) {
    return false;
  }
  for (let i = 0; i < a.past.length; i++) {
    if (!subtitlesAreEqual(a.past[i], b.past[i])) {
      return false;
    }
  }
  if (!subtitlesAreEqual(a.present, b.present)) {
    return false;
  }
  for (let i = 0; i < a.future.length; i++) {
    if (!subtitlesAreEqual(a.future[i], b.future[i])) {
      return false;
    }
  }
  return true;
};

export const isHistoryEmpty = (history: UndoHistory<Subtitle[]>) =>
  history.past.length === 0 &&
  history.present.length === 0 &&
  history.future.length === 0;

export const createTrackHistory = (
  trackId: string,
  subtitles: Subtitle[],
): UndoHistory<Subtitle[]> => {
  const normalized = ensureTrackMetadata(subtitles, trackId);
  return {
    past: [],
    present: normalized,
    future: [],
  };
};
