import test from "node:test";
import assert from "node:assert/strict";

import { findActiveSubtitleIndex } from "../lib/subtitle-lookup";

const timings = [
  { start: 0, end: 2 },
  { start: 2, end: 4 },
  { start: 4, end: 6 },
];

test("findActiveSubtitleIndex resolves first match from scratch", () => {
  const index = findActiveSubtitleIndex(timings, 1.5, -1);
  assert.equal(index, 0);
});

test("findActiveSubtitleIndex reuses previous index when still valid", () => {
  const index = findActiveSubtitleIndex(timings, 2.5, 1);
  assert.equal(index, 1);
});

test("findActiveSubtitleIndex scans forward efficiently", () => {
  const index = findActiveSubtitleIndex(timings, 4.5, 0);
  assert.equal(index, 2);
});

test("findActiveSubtitleIndex scans backward efficiently", () => {
  const index = findActiveSubtitleIndex(timings, 1.5, 2);
  assert.equal(index, 0);
});

test("findActiveSubtitleIndex falls back to binary search when needed", () => {
  const scattered = [
    { start: 0, end: 1 },
    { start: 10, end: 11 },
    { start: 20, end: 21 },
  ];
  const index = findActiveSubtitleIndex(scattered, 10.5, -1);
  assert.equal(index, 1);
});

test("findActiveSubtitleIndex returns -1 when no match", () => {
  assert.equal(findActiveSubtitleIndex(timings, 8, 2), -1);
  assert.equal(findActiveSubtitleIndex(timings, Number.NaN, 0), -1);
});

test("findActiveSubtitleIndex treats end boundary as exclusive", () => {
  assert.equal(findActiveSubtitleIndex(timings, 2, 0), 1);
  assert.equal(findActiveSubtitleIndex(timings, 4, 1), 2);
});
