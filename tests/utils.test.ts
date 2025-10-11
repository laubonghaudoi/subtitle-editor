import test from "node:test";
import assert from "node:assert/strict";
import { timeToSeconds, secondsToTime } from "../lib/utils";

// Ensure that converting a time string to seconds and back yields the original string
const timeCases = [
  "00:00:00,000",
  "00:01:30,500",
  "01:02:03,456",
  "10:59:59,999",
];

test("time string round trip", () => {
  for (const time of timeCases) {
    const secs = timeToSeconds(time);
    const result = secondsToTime(secs);
    assert.equal(result, time);
  }
});

// Ensure that converting seconds to a time string and back preserves the value
const secondCases = [0, 1, 65.25, 3723.456, 36000.999];

test("seconds round trip", () => {
  for (const value of secondCases) {
    const time = secondsToTime(value);
    const result = timeToSeconds(time);
    const expected = Number.parseFloat(value.toFixed(3));
    assert.equal(result, expected);
  }
});
