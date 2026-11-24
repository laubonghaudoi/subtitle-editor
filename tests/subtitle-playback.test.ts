import assert from "node:assert/strict";
import test from "node:test";

import {
  CUE_PREVIEW_SEEK_OFFSET_SECONDS,
  getAdjacentCue,
  getCuePreviewSeekTime,
} from "../lib/subtitle-playback";

test("horizontal navigation chooses the neighboring cue from playback or a gap", () => {
  const first = { start: 1, end: 1.15 };
  const second = { start: 1.2, end: 1.5 };
  const last = { start: 3, end: 4 };
  const cues = [first, second, last];

  assert.equal(getAdjacentCue(cues, 0, "next"), first);
  assert.equal(getAdjacentCue(cues, 1.05, "next"), second);
  assert.equal(getAdjacentCue(cues, 1.2, "previous"), first);
  assert.equal(getAdjacentCue(cues, 2, "previous"), second);
  assert.equal(getAdjacentCue(cues, 2, "next"), last);
  assert.equal(getAdjacentCue(cues, 4, "previous"), last);
  assert.equal(getAdjacentCue(cues, 1.05, "previous"), undefined);
  assert.equal(getAdjacentCue(cues, 3, "next"), undefined);
  assert.equal(getAdjacentCue([], 0, "next"), undefined);
});

test("overlapping cues navigate by distinct start times", () => {
  const long = { start: 0, end: 10 };
  const overlapping = { start: 1, end: 3 };
  const simultaneous = { start: 1, end: 4 };
  const next = { start: 2.5, end: 6 };
  const cues = [long, overlapping, simultaneous, next];

  assert.equal(getAdjacentCue(cues, 1.1, "next"), next);
  assert.equal(getAdjacentCue(cues, 1.1, "previous"), long);
  assert.equal(getAdjacentCue(cues, 2.6, "previous"), simultaneous);
});

test("getCuePreviewSeekTime nudges preview seeks inside the selected cue", () => {
  const start = 1.76;
  const end = 6.319;

  assert.equal(
    getCuePreviewSeekTime(start, end),
    start + CUE_PREVIEW_SEEK_OFFSET_SECONDS,
  );
});

test("getCuePreviewSeekTime keeps very short cues within their time range", () => {
  const start = 1.76;
  const end = start + CUE_PREVIEW_SEEK_OFFSET_SECONDS / 2;

  assert.equal(getCuePreviewSeekTime(start, end), start);
});
