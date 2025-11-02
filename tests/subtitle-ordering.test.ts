import test from "node:test";
import assert from "node:assert/strict";

import { sortSubtitlesChronologically } from "../lib/subtitle-ordering";
import { timeToSeconds } from "../lib/utils";

let uuidCounter = 0;
const nextUuid = () => {
  uuidCounter += 1;
  return `uuid-${uuidCounter}`;
};

const makeSubtitle = (overrides: Partial<import("../types/subtitle").Subtitle>) => ({
  uuid: overrides.uuid ?? nextUuid(),
  id: overrides.id ?? 1,
  startTime: overrides.startTime ?? "00:00:00,000",
  endTime: overrides.endTime ?? "00:00:01,000",
  text: overrides.text ?? "sample",
  trackId: overrides.trackId,
});

test("sortSubtitlesChronologically keeps already-sorted input stable", () => {
  const subtitles = [
    makeSubtitle({ id: 10, startTime: "00:00:01,000", endTime: "00:00:02,000" }),
    makeSubtitle({ id: 20, startTime: "00:00:02,000", endTime: "00:00:03,000" }),
    makeSubtitle({ id: 30, startTime: "00:00:04,000", endTime: "00:00:05,000" }),
  ];

  const sorted = sortSubtitlesChronologically(subtitles);
  assert.equal(sorted, subtitles);
});

test("sortSubtitlesChronologically orders by start time while keeping ids", () => {
  const early = makeSubtitle({
    uuid: "early",
    id: 3,
    startTime: "00:00:01,000",
    endTime: "00:00:02,000",
  });
  const middle = makeSubtitle({
    uuid: "middle",
    id: 2,
    startTime: "00:00:03,000",
    endTime: "00:00:04,000",
  });
  const late = makeSubtitle({
    uuid: "late",
    id: 1,
    startTime: "00:00:05,000",
    endTime: "00:00:06,000",
  });

  const sorted = sortSubtitlesChronologically([late, early, middle]);
  assert.deepEqual(sorted.map((s) => s.uuid), ["early", "middle", "late"]);
  assert.deepEqual(sorted.map((s) => s.id), [3, 2, 1]);
});

test("sortSubtitlesChronologically breaks ties by end time then id", () => {
  const sameStartDifferentEnd = [
    makeSubtitle({ uuid: "short", startTime: "00:00:01,000", endTime: "00:00:01,500", id: 5 }),
    makeSubtitle({ uuid: "long", startTime: "00:00:01,000", endTime: "00:00:02,000", id: 4 }),
  ];
  const sortedSameStart = sortSubtitlesChronologically(sameStartDifferentEnd);
  assert.deepEqual(sortedSameStart.map((s) => s.uuid), ["short", "long"]);

  const sameStartEndDifferentId = [
    makeSubtitle({ uuid: "id-low", startTime: "00:00:01,000", endTime: "00:00:02,000", id: 3 }),
    makeSubtitle({ uuid: "id-high", startTime: "00:00:01,000", endTime: "00:00:02,000", id: 4 }),
  ];
  const sortedSameId = sortSubtitlesChronologically(sameStartEndDifferentId);
  assert.deepEqual(sortedSameId.map((s) => s.uuid), ["id-low", "id-high"]);
});

test("sortSubtitlesChronologically leaves original array unchanged", () => {
  const first = makeSubtitle({ uuid: "first", startTime: "00:00:02,000", endTime: "00:00:03,000", id: 1 });
  const second = makeSubtitle({ uuid: "second", startTime: "00:00:01,000", endTime: "00:00:02,000", id: 2 });
  const original = [first, second];
  const sorted = sortSubtitlesChronologically(original);
  assert.notEqual(sorted, original);
  assert.deepEqual(original.map((s) => s.uuid), ["first", "second"]);
});

test("sortSubtitlesChronologically handles zero or one element", () => {
  const empty: import("../types/subtitle").Subtitle[] = [];
  assert.equal(sortSubtitlesChronologically(empty), empty);

  const single = [makeSubtitle({ uuid: "only" })];
  assert.equal(sortSubtitlesChronologically(single), single);
});

test("sortSubtitlesChronologically normalizes overlapping times", () => {
  const a = makeSubtitle({ uuid: "a", startTime: "00:00:03,000", endTime: "00:00:05,000", id: 1 });
  const b = makeSubtitle({ uuid: "b", startTime: "00:00:04,000", endTime: "00:00:06,000", id: 2 });
  const c = makeSubtitle({ uuid: "c", startTime: "00:00:01,000", endTime: "00:00:02,000", id: 3 });

  const sorted = sortSubtitlesChronologically([a, b, c]);
  const starts = sorted.map((s) => timeToSeconds(s.startTime));
  assert.deepEqual(sorted.map((s) => s.uuid), ["c", "a", "b"]);
  assert.ok(starts[0] <= starts[1] && starts[1] <= starts[2]);
});
