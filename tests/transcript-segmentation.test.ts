import test from "node:test";
import assert from "node:assert/strict";
import {
  segmentTranscriptToSubtitles,
  type TranscriptSegmentationOptions,
} from "../lib/transcript-segmentation";

const baseOptions: TranscriptSegmentationOptions = {
  mode: "lines",
  startTimeSeconds: 0,
  cueDurationSeconds: 3,
  gapSeconds: 0.2,
};

test("line mode ignores blank lines and creates default sequential timings", () => {
  const subtitles = segmentTranscriptToSubtitles(
    " First line \n\nSecond line\r\n  \nThird line  ",
    baseOptions,
  );

  assert.deepEqual(
    subtitles.map((subtitle) => subtitle.text),
    ["First line", "Second line", "Third line"],
  );
  assert.deepEqual(
    subtitles.map((subtitle) => [
      subtitle.id,
      subtitle.startTime,
      subtitle.endTime,
    ]),
    [
      [1, "00:00:00,000", "00:00:03,000"],
      [2, "00:00:03,200", "00:00:06,200"],
      [3, "00:00:06,400", "00:00:09,400"],
    ],
  );
  assert.ok(subtitles.every((subtitle) => subtitle.uuid.length > 0));
});

test("sentence mode splits pasted paragraphs and normalizes whitespace", () => {
  const subtitles = segmentTranscriptToSubtitles(
    "Hello world.  How are you?\n\nFine!",
    { ...baseOptions, mode: "sentences" },
  );

  assert.deepEqual(
    subtitles.map((subtitle) => subtitle.text),
    ["Hello world.", "How are you?", "Fine!"],
  );
});

test("max character mode chunks at word boundaries", () => {
  const subtitles = segmentTranscriptToSubtitles(
    "One two three four five six seven",
    { ...baseOptions, mode: "maxCharacters", maxCharactersPerCue: 13 },
  );

  assert.deepEqual(
    subtitles.map((subtitle) => subtitle.text),
    ["One two three", "four five six", "seven"],
  );
});

test("max character mode keeps a single long word intact", () => {
  const subtitles = segmentTranscriptToSubtitles(
    "supercalifragilistic short words",
    { ...baseOptions, mode: "maxCharacters", maxCharactersPerCue: 8 },
  );

  assert.deepEqual(
    subtitles.map((subtitle) => subtitle.text),
    ["supercalifragilistic", "short", "words"],
  );
});

test("timing options control start offset, duration, and gap", () => {
  const subtitles = segmentTranscriptToSubtitles("A\nB", {
    ...baseOptions,
    startTimeSeconds: 10,
    cueDurationSeconds: 2.5,
    gapSeconds: 0.5,
  });

  assert.deepEqual(
    subtitles.map((subtitle) => [subtitle.startTime, subtitle.endTime]),
    [
      ["00:00:10,000", "00:00:12,500"],
      ["00:00:13,000", "00:00:15,500"],
    ],
  );
});

test("empty input returns no cues", () => {
  assert.deepEqual(segmentTranscriptToSubtitles(" \n\t ", baseOptions), []);
});
