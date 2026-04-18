import test from "node:test";
import assert from "node:assert/strict";
import { mergeSubtitles } from "../lib/subtitle-operations";
import type { Subtitle } from "../types/subtitle";

const baseSubtitles: Subtitle[] = [
  {
    uuid: "merge-1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:02,000",
    text: "Hello",
  },
  {
    uuid: "merge-2",
    id: 2,
    startTime: "00:00:02,000",
    endTime: "00:00:04,000",
    text: "world",
  },
];

test("mergeSubtitles keeps existing no-space behavior by default", () => {
  const merged = mergeSubtitles(baseSubtitles, 1, 2);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "Helloworld");
});

test("mergeSubtitles adds one separator space when enabled", () => {
  const merged = mergeSubtitles(baseSubtitles, 1, 2, {
    addSpaceBetweenTexts: true,
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "Hello world");
});

test("mergeSubtitles does not duplicate trailing whitespace", () => {
  const merged = mergeSubtitles(
    [
      { ...baseSubtitles[0], text: "Hello " },
      { ...baseSubtitles[1], text: "world" },
    ],
    1,
    2,
    { addSpaceBetweenTexts: true },
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "Hello world");
});

test("mergeSubtitles does not duplicate leading whitespace", () => {
  const merged = mergeSubtitles(
    [
      { ...baseSubtitles[0], text: "Hello" },
      { ...baseSubtitles[1], text: " world" },
    ],
    1,
    2,
    { addSpaceBetweenTexts: true },
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "Hello world");
});
