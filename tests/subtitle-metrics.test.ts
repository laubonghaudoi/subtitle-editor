import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCps,
  calculateCueMetrics,
  calculateTrackMetrics,
  calculateWpm,
  DEFAULT_METRICS_OPTIONS,
  parseTimestampToSeconds,
  stripVttTagsAndNormalize,
} from "../lib/subtitle-metrics";
import type { Subtitle } from "../types/subtitle";

test("parseTimestampToSeconds parses SRT and VTT formats correctly", () => {
  assert.equal(parseTimestampToSeconds("00:00:01,000"), 1.0);
  assert.equal(parseTimestampToSeconds("00:01:23.456"), 83.456);
  assert.equal(parseTimestampToSeconds("01:23.500"), 83.5);
  assert.equal(parseTimestampToSeconds("12.345"), 12.345);
  assert.ok(Number.isNaN(parseTimestampToSeconds("invalid")));
  assert.ok(Number.isNaN(parseTimestampToSeconds("")));
});

test("stripVttTagsAndNormalize strips VTT/HTML tags and normalizes whitespace", () => {
  const result = stripVttTagsAndNormalize(
    "<v Speaker>Hello <b>world</b>!\nNext line.</v>",
  );
  assert.equal(result.cleanText, "Hello world! Next line.");
  assert.equal(result.wordCount, 4);
  assert.equal(result.charCount, 23);

  const emptyResult = stripVttTagsAndNormalize("   \n\t  ");
  assert.equal(emptyResult.cleanText, "");
  assert.equal(emptyResult.wordCount, 0);
  assert.equal(emptyResult.charCount, 0);
});

test("calculateCps and calculateWpm produce exact expected values", () => {
  assert.equal(calculateCps(12, 2.0), 6.0);
  assert.equal(calculateWpm(2, 2.0), 60.0);

  // Zero duration safety
  assert.equal(calculateCps(10, 0), 0);
  assert.equal(calculateWpm(10, 0), 0);
});

test("calculateCueMetrics calculates CPS/WPM for a known cue", () => {
  const cue: Subtitle = {
    uuid: "cue-1",
    id: 1,
    startTime: "00:00:01,000",
    endTime: "00:00:03,000",
    text: "Hello world!",
  };

  const metrics = calculateCueMetrics(cue, 0);

  assert.equal(metrics.durationSeconds, 2.0);
  assert.equal(metrics.charCount, 12);
  assert.equal(metrics.wordCount, 2);
  assert.equal(metrics.cps, 6.0);
  assert.equal(metrics.wpm, 60.0);
  assert.equal(metrics.warnings.length, 0);
});

test("calculateCueMetrics detects short duration below threshold", () => {
  const cue: Subtitle = {
    uuid: "cue-short",
    id: 1,
    startTime: "00:00:01,000",
    endTime: "00:00:01,500", // 0.5s duration
    text: "Short cue",
  };

  const metrics = calculateCueMetrics(cue, 0, undefined, { minDuration: 1.0 });

  assert.equal(metrics.durationSeconds, 0.5);
  const shortWarning = metrics.warnings.find((w) => w.type === "short-duration");
  assert.ok(shortWarning);
  assert.equal(shortWarning.value, 0.5);
  assert.equal(shortWarning.threshold, 1.0);
});

test("calculateCueMetrics detects overlaps and gap thresholds between cues", () => {
  const cue1: Subtitle = {
    uuid: "c1",
    id: 1,
    startTime: "00:00:01,000",
    endTime: "00:00:04,000", // ends at 4.0s
    text: "First cue",
  };

  const cue2Overlap: Subtitle = {
    uuid: "c2",
    id: 2,
    startTime: "00:00:03,500", // overlaps by 0.5s
    endTime: "00:00:06,000",
    text: "Second cue",
  };

  const cue3ShortGap: Subtitle = {
    uuid: "c3",
    id: 3,
    startTime: "00:00:06,040", // gap is 0.040s (40ms)
    endTime: "00:00:08,000",
    text: "Third cue",
  };

  const cue4NormalGap: Subtitle = {
    uuid: "c4",
    id: 4,
    startTime: "00:00:08,200", // gap is 0.200s (200ms)
    endTime: "00:00:10,000",
    text: "Fourth cue",
  };

  const metrics2 = calculateCueMetrics(cue2Overlap, 1, cue1);
  assert.equal(metrics2.gapFromPreviousSeconds, -0.5);
  assert.equal(metrics2.overlapWithPreviousSeconds, 0.5);
  assert.ok(metrics2.warnings.some((w) => w.type === "overlap"));

  const metrics3 = calculateCueMetrics(cue3ShortGap, 2, cue2Overlap, {
    minGap: 0.08,
  });
  assert.equal(metrics3.gapFromPreviousSeconds, 0.04);
  assert.ok(metrics3.warnings.some((w) => w.type === "short-gap"));

  const metrics4 = calculateCueMetrics(cue4NormalGap, 3, cue3ShortGap, {
    minGap: 0.08,
  });
  assert.equal(metrics4.gapFromPreviousSeconds, 0.2);
  assert.ok(!metrics4.warnings.some((w) => w.type === "short-gap"));
});

test("calculateCueMetrics handles degenerate input without throwing", () => {
  // Cue with end <= start
  const invalidDurationCue: Subtitle = {
    uuid: "c-inv-dur",
    id: 1,
    startTime: "00:00:05,000",
    endTime: "00:00:02,000",
    text: "Test",
  };
  const m1 = calculateCueMetrics(invalidDurationCue, 0);
  assert.equal(m1.durationSeconds, 0);
  assert.equal(m1.cps, 0);
  assert.equal(m1.wpm, 0);
  assert.ok(m1.warnings.some((w) => w.type === "invalid-duration"));

  // Empty text
  const emptyTextCue: Subtitle = {
    uuid: "c-empty",
    id: 2,
    startTime: "00:00:01,000",
    endTime: "00:00:03,000",
    text: "   \n\t ",
  };
  const m2 = calculateCueMetrics(emptyTextCue, 1);
  assert.equal(m2.charCount, 0);
  assert.equal(m2.wordCount, 0);
  assert.ok(m2.warnings.some((w) => w.type === "empty-text"));

  // Malformed timestamp
  const malformedTimeCue: Subtitle = {
    uuid: "c-malformed",
    id: 3,
    startTime: "not-a-time",
    endTime: "00:00:03,000",
    text: "Valid text",
  };
  const m3 = calculateCueMetrics(malformedTimeCue, 2);
  assert.ok(Number.isNaN(m3.startTimeSeconds));
  assert.ok(m3.warnings.some((w) => w.type === "invalid-time"));
});

test("calculateTrackMetrics aggregates metrics across track", () => {
  const subtitles: Subtitle[] = [
    {
      uuid: "s1",
      id: 1,
      startTime: "00:00:00,000",
      endTime: "00:00:02,000",
      text: "First subtitle", // 14 chars, 2 words, 2s -> 7.0 CPS, 60 WPM
    },
    {
      uuid: "s2",
      id: 2,
      startTime: "00:00:03,000",
      endTime: "00:00:05,000",
      text: "Second subtitle text", // 20 chars, 3 words, 2s -> 10.0 CPS, 90 WPM
    },
  ];

  const track = calculateTrackMetrics(subtitles);

  assert.equal(track.totalCues, 2);
  assert.equal(track.totalDurationSeconds, 4.0);
  assert.equal(track.timelineSpanSeconds, 5.0);
  assert.equal(track.totalCharCount, 34);
  assert.equal(track.totalWordCount, 5);
  assert.equal(track.averageCps, 8.5); // 34 / 4 = 8.5
  assert.equal(track.averageWpm, 75.0); // (5 / 4) * 60 = 75.0
  assert.equal(track.maxCps, 10.0);
  assert.equal(track.maxWpm, 90.0);
  assert.equal(track.warnings.length, 0);
});

test("calculateTrackMetrics handles empty subtitle array", () => {
  const track = calculateTrackMetrics([]);

  assert.equal(track.totalCues, 0);
  assert.equal(track.totalDurationSeconds, 0);
  assert.equal(track.timelineSpanSeconds, 0);
  assert.equal(track.totalCharCount, 0);
  assert.equal(track.totalWordCount, 0);
  assert.equal(track.averageCps, 0);
  assert.equal(track.averageWpm, 0);
  assert.equal(track.maxCps, 0);
  assert.equal(track.maxWpm, 0);
  assert.deepEqual(track.cues, []);
  assert.deepEqual(track.warnings, []);
});
