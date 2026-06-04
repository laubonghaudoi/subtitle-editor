import assert from "node:assert/strict";
import test from "node:test";

import {
  CUE_PREVIEW_SEEK_OFFSET_SECONDS,
  getCuePreviewSeekTime,
} from "../lib/subtitle-playback";

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
