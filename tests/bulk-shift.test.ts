import test from "node:test";
import assert from "node:assert/strict";
import { computeBulkShift } from "../lib/bulk-shift";
import type { Subtitle } from "../types/subtitle";

const baseSubtitles: Subtitle[] = [
  {
    uuid: "s1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:02,000",
    text: "First",
  },
  {
    uuid: "s2",
    id: 2,
    startTime: "00:00:03,000",
    endTime: "00:00:05,000",
    text: "Second",
  },
  {
    uuid: "s3",
    id: 3,
    startTime: "00:00:06,000",
    endTime: "00:00:08,000",
    text: "Third",
  },
];

const times = (subtitles: Subtitle[]) =>
  subtitles.map((subtitle) => [subtitle.startTime, subtitle.endTime]);

test("computeBulkShift shifts start times and clamps at the cue end", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s1", "s2"], 1, "start");

  assert.deepEqual(times(shifted), [
    ["00:00:01,000", "00:00:02,000"],
    ["00:00:04,000", "00:00:05,000"],
    ["00:00:06,000", "00:00:08,000"],
  ]);
});

test("computeBulkShift shifts end times without crossing next neighbours", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s2"], 3, "end");

  assert.deepEqual(times(shifted), [
    ["00:00:00,000", "00:00:02,000"],
    ["00:00:03,000", "00:00:06,000"],
    ["00:00:06,000", "00:00:08,000"],
  ]);
});

test("computeBulkShift collapses end times no earlier than their starts", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s2"], -3, "end");

  assert.deepEqual(times(shifted), [
    ["00:00:00,000", "00:00:02,000"],
    ["00:00:03,000", "00:00:03,000"],
    ["00:00:06,000", "00:00:08,000"],
  ]);
});

test("computeBulkShift shifts both bounds together for adjacent targets", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s2", "s3"], 2, "both");

  assert.deepEqual(times(shifted), [
    ["00:00:00,000", "00:00:02,000"],
    ["00:00:05,000", "00:00:07,000"],
    ["00:00:08,000", "00:00:10,000"],
  ]);
});

test("computeBulkShift clamps both bounds against untargeted neighbours", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s2"], -5, "both");

  assert.deepEqual(times(shifted), [
    ["00:00:00,000", "00:00:02,000"],
    ["00:00:02,000", "00:00:04,000"],
    ["00:00:06,000", "00:00:08,000"],
  ]);
});

test("computeBulkShift lets the last subtitle extend past its previous end", () => {
  const shifted = computeBulkShift(baseSubtitles, ["s3"], 5, "end");

  assert.equal(shifted[2].startTime, "00:00:06,000");
  assert.equal(shifted[2].endTime, "00:00:13,000");
});

test("computeBulkShift returns the original array for no-op requests", () => {
  assert.equal(
    computeBulkShift(baseSubtitles, ["s2"], 0, "both"),
    baseSubtitles,
  );
  assert.equal(computeBulkShift(baseSubtitles, [], 1, "both"), baseSubtitles);
  assert.equal(computeBulkShift([], ["s2"], 1, "both").length, 0);
});
