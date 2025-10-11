import type { Subtitle } from "@/types/subtitle";
import { v4 as uuidv4 } from "uuid";
import { secondsToTime, timeToSeconds } from "./utils";

const DEFAULT_SUBTITLE_DURATION = 3; // seconds

export const parseSRT = (srtContent: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      const id = Number.parseInt(lines[0]);
      const timeMatch = lines[1].match(
        /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
      );

      if (timeMatch) {
        const [, startTime, endTime] = timeMatch;
        const text = lines.slice(2).join("\n");

        subtitles.push({
          uuid: uuidv4(), // Assign a unique ID on parse
          id,
          startTime,
          endTime,
          text,
        });
      }
    }
  });

  return subtitles;
};

/**
 * Parse a WebVTT file into internal Subtitle[] format.
 * - Preserves inline cue text (including tags) verbatim.
 * - Ignores NOTE/STYLE/REGION blocks.
 * - Ignores cue settings after the arrow.
 * - Supports MM:SS.mmm and HH:MM:SS.mmm (normalizes to HH:MM:SS,mmm internally).
 */
export const parseVTT = (vttContent: string): Subtitle[] => {
  const content = vttContent.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = content.split("\n");

  // Validate/skip header. First non-empty line should start with WEBVTT
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  if (idx < lines.length && !/^WEBVTT( |$)/.test(lines[idx].trim())) {
    // If a .vtt extension is expected, callers may treat this as an error.
    // Here we continue best-effort to parse cues.
  } else if (idx < lines.length) {
    idx++;
  }

  const subtitles: Subtitle[] = [];
  let _cueId: string | null = null;
  let idCounter = 1;

  /**
   * Matches a WebVTT timeline line, e.g. "00:01:02.345 --> 00:01:05.678" or "01:02.345 --> 01:05.678",
   * with optional hours and optional cue settings after the arrow.
   */
  const VTT_TIMELINE_REGEX = /^(\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}\.\d{3}(?:\s+.*)?$/;

  const isBlockStart = (line: string) => /^(NOTE|STYLE|REGION)\b/.test(line);
  const isTimeLine = (line: string) =>
    VTT_TIMELINE_REGEX.test(line);

  const normalizeVttTimeToSrt = (t: string): string => {
    // Ensure HH:MM:SS.mmm; prefix hours when using MM:SS.mmm
    const parts = t.split(" --> ");
    const [rawStart, rawEndWithSettings] = [parts[0], parts[1] || ""];
    const rawEnd = rawEndWithSettings.split(/\s+/)[0];
    const fix = (s: string) => (s.match(/^\d{2}:\d{2}\.\d{3}$/) ? `00:${s}` : s);
    const start = fix(rawStart).replace(".", ",");
    const end = fix(rawEnd).replace(".", ",");
    return `${start} --> ${end}`;
  };

  while (idx < lines.length) {
    let line = lines[idx];
    if (line.trim() === "") {
      idx++;
      continue;
    }
    // Skip NOTE/STYLE/REGION blocks
    if (isBlockStart(line.trim())) {
      // Consume until blank line
      idx++;
      while (idx < lines.length && lines[idx].trim() !== "") idx++;
      continue;
    }
    _cueId = null;
    // Optional identifier line: next non-empty line that is NOT a time line
    if (idx < lines.length && !isTimeLine(lines[idx].trim())) {
      const maybeId = lines[idx].trim();
      // If the following line is a time line, treat this line as cue id
      if (idx + 1 < lines.length && isTimeLine(lines[idx + 1].trim())) {
        _cueId = maybeId;
        idx++;
      }
    }
    if (idx >= lines.length || !isTimeLine(lines[idx].trim())) {
      // Not a valid cue; skip until blank
      while (idx < lines.length && lines[idx].trim() !== "") idx++;
      continue;
    }
    const timeLine = lines[idx].trim();
    const srtTimeline = normalizeVttTimeToSrt(timeLine);
    const m = srtTimeline.match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/
    );
    if (!m) {
      // Skip malformed time line
      while (idx < lines.length && lines[idx].trim() !== "") idx++;
      continue;
    }
    const [, startTime, endTime] = m;
    idx++;

    // Collect cue text lines until blank line or EOF
    const textLines: string[] = [];
    while (idx < lines.length && lines[idx].trim() !== "") {
      textLines.push(lines[idx]);
      idx++;
    }

    const text = textLines.join("\n");
    // Validate time logic: skip if end <= start
    const startSec = timeToSeconds(startTime);
    const endSec = timeToSeconds(endTime);
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || endSec <= startSec) {
      continue;
    }

    subtitles.push({
      uuid: uuidv4(),
      id: idCounter++,
      startTime,
      endTime,
      text,
    });
  }

  return subtitles;
};

/**
 * Extract the VTT header line and any prologue blocks (NOTE/STYLE/REGION)
 * that appear before the first cue. This enables round‑tripping top comments
 * and styling when exporting back to VTT.
 */
export function extractVttPrologue(vttContent: string): {
  header: string;
  prologue: string[];
} {
  const content = vttContent.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = content.split("\n");
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  let header = "WEBVTT";
  if (idx < lines.length && /^WEBVTT( |$)/.test(lines[idx])) {
    header = lines[idx].trim();
    idx++;
  }

  const prologue: string[] = [];
  const isBlockStart = (line: string) => /^(NOTE|STYLE|REGION)\b/.test(line);
  const isTimeLine = (line: string) =>
    /^(\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}\.\d{3}(?:\s+.*)?$/.test(
      line
    );

  while (idx < lines.length) {
    const cur = lines[idx];
    const t = cur.trim();
    if (t === "") {
      idx++;
      continue;
    }
    if (isBlockStart(t)) {
      const blockLines: string[] = [cur];
      idx++;
      while (idx < lines.length && lines[idx].trim() !== "") {
        blockLines.push(lines[idx]);
        idx++;
      }
      prologue.push(blockLines.join("\n"));
      continue;
    }
    // If we see a time line or any other non-prologue content, stop.
    if (isTimeLine(t)) break;
    // If it's a cue identifier line, next line might be time – break to avoid consuming cues
    if (idx + 1 < lines.length && isTimeLine(lines[idx + 1].trim())) break;
    // Otherwise, this is unknown text before cues; stop to avoid data loss
    break;
  }

  return { header, prologue };
}

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
  // Keep the UUID of the first subtitle for the merged one
  // Or generate a new one if preferred: uuid: uuidv4()
  const mergedSubtitle: Subtitle = {
    uuid: sub1.uuid, // Keep the first subtitle's UUID
    id: sub1.id, // Will be reordered later
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
  afterId: number | null,
  newSubtitleText: string = "New subtitle"
): Subtitle[] => {
  const beforeSub = subtitles.find((s) => s.id === beforeId);
  if (!beforeSub) return subtitles;

  let newSubtitle: Subtitle;
  if (afterId === null) {
    // Adding at the end
    const endTimeSeconds =
      timeToSeconds(beforeSub.endTime) + DEFAULT_SUBTITLE_DURATION;
    newSubtitle = {
      uuid: uuidv4(), // Assign new UUID
      id: beforeSub.id + 1, // Will be reordered later
      startTime: beforeSub.endTime,
      endTime: secondsToTime(endTimeSeconds),
      text: newSubtitleText,
    };
  } else {
    // Adding in between
    const afterSub = subtitles.find((s) => s.id === afterId);
    if (!afterSub) return subtitles;
    newSubtitle = {
      uuid: uuidv4(), // Assign new UUID
      id: beforeSub.id + 1, // Will be reordered later
      startTime: beforeSub.endTime,
      endTime: afterSub.startTime,
      text: newSubtitleText,
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

  // Create first half - retains original UUID
  const first: Subtitle = {
    ...sub, // Includes original uuid
    endTime: secondsToTime(splitSec),
    text: sub.text.slice(0, caretPos),
  };

  // Create second half - gets a new UUID
  const second: Subtitle = {
    ...sub, // Includes original uuid initially, but we overwrite it
    uuid: uuidv4(), // Assign new UUID
    id: sub.id + 1, // Will be reordered later
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
  splitTimeSec: number,
  newSubtitleText: string = "New subtitle"
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
  // 1) Original from startTime → splitTime - retains original UUID
  const first: Subtitle = {
    ...sub, // Includes original uuid
    endTime: secondsToTime(splitTimeSec),
    text: firstText || newSubtitleText,
  };

  // 2) New from splitTime → endTime - gets a new UUID
  const second: Subtitle = {
    uuid: uuidv4(), // Assign new UUID
    id: sub.id + 1, // Will be reordered later
    startTime: secondsToTime(splitTimeSec),
    endTime: sub.endTime,
    text: secondText || newSubtitleText,
  };

  // Remove original and insert the two halves at the same position
  const index = subtitles.findIndex((s) => s.id === id);
  const updated = [...subtitles];
  updated.splice(index, 1, first, second);

  // Reorder IDs to keep them consecutive
  return reorderSubtitleIds(updated);
}
