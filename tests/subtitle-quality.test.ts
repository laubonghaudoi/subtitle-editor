import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSubtitleQuality,
  applySubtitleQualityFixes,
  type SubtitleQualityRuleId,
} from "../lib/subtitle-quality";
import type { Subtitle } from "../types/subtitle";

let uuidCounter = 0;
const nextUuid = () => {
  uuidCounter += 1;
  return `quality-${uuidCounter}`;
};

const makeSubtitle = (overrides: Partial<Subtitle>): Subtitle => ({
  uuid: overrides.uuid ?? nextUuid(),
  id: overrides.id ?? 1,
  startTime: overrides.startTime ?? "00:00:00,000",
  endTime: overrides.endTime ?? "00:00:02,000",
  text: overrides.text ?? "Sample subtitle",
  trackId: overrides.trackId,
});

const ruleIds = (issues: ReturnType<typeof analyzeSubtitleQuality>) =>
  new Set<SubtitleQualityRuleId>(issues.map((issue) => issue.ruleId));

test("analyzeSubtitleQuality reports the focused text and tag rule set", () => {
  const issues = analyzeSubtitleQuality(
    [
      makeSubtitle({ uuid: "empty", id: 1, text: "   " }),
      makeSubtitle({ uuid: "space", id: 2, text: "  Hello   world  " }),
      makeSubtitle({ uuid: "word", id: 3, text: "This is is repeated" }),
      makeSubtitle({
        uuid: "long-line",
        id: 4,
        text: "This line is too long for this test threshold",
      }),
      makeSubtitle({ uuid: "many-lines", id: 5, text: "one\ntwo\nthree" }),
      makeSubtitle({ uuid: "tags", id: 6, text: "<i>italic" }),
    ],
    {
      maxCharactersPerLine: 12,
      maxLinesPerCue: 2,
    },
  );

  const detectedRuleIds = ruleIds(issues);
  assert.equal(detectedRuleIds.has("empty-cue"), true);
  assert.equal(detectedRuleIds.has("trim-whitespace"), true);
  assert.equal(detectedRuleIds.has("repeated-whitespace"), true);
  assert.equal(detectedRuleIds.has("repeated-word"), true);
  assert.equal(detectedRuleIds.has("line-length"), true);
  assert.equal(detectedRuleIds.has("line-count"), true);
  assert.equal(detectedRuleIds.has("unbalanced-tags"), true);

  const tagIssue = issues.find((issue) => issue.ruleId === "unbalanced-tags");
  assert.equal(tagIssue?.fix, undefined);
});

test("applySubtitleQualityFixes applies selected text fixes sequentially", () => {
  const subtitles = [
    makeSubtitle({
      uuid: "cleanup",
      id: 1,
      text: "  the   the  quick  ",
    }),
  ];
  const issues = analyzeSubtitleQuality(subtitles);

  const result = applySubtitleQualityFixes(
    subtitles,
    issues.filter((issue) => issue.fix),
  );

  assert.deepEqual(result.appliedIssueIds, [
    "trim-whitespace:cleanup",
    "repeated-whitespace:cleanup",
    "repeated-word:cleanup",
  ]);
  assert.equal(result.subtitles[0].text, "the quick");
  assert.equal(result.subtitles[0].uuid, "cleanup");
  assert.equal(result.subtitles[0].id, 1);
});

test("applySubtitleQualityFixes deletes empty cues and renumbers remaining cues", () => {
  const subtitles = [
    makeSubtitle({ uuid: "keep-1", id: 1, text: "Keep" }),
    makeSubtitle({ uuid: "remove", id: 2, text: "  " }),
    makeSubtitle({ uuid: "keep-2", id: 3, text: "Also keep" }),
  ];
  const issues = analyzeSubtitleQuality(subtitles);

  const result = applySubtitleQualityFixes(
    subtitles,
    issues.filter((issue) => issue.ruleId === "empty-cue"),
  );

  assert.deepEqual(
    result.subtitles.map((subtitle) => subtitle.uuid),
    ["keep-1", "keep-2"],
  );
  assert.deepEqual(
    result.subtitles.map((subtitle) => subtitle.id),
    [1, 2],
  );
});

test("applySubtitleQualityFixes applies timing fixes for invalid durations, overlaps, and thresholds", () => {
  const subtitles = [
    makeSubtitle({
      uuid: "first",
      id: 1,
      startTime: "00:00:00,000",
      endTime: "00:00:02,000",
      text: "First",
    }),
    makeSubtitle({
      uuid: "overlap",
      id: 2,
      startTime: "00:00:01,500",
      endTime: "00:00:03,000",
      text: "Overlap",
    }),
    makeSubtitle({
      uuid: "invalid",
      id: 3,
      startTime: "00:00:04,000",
      endTime: "00:00:04,000",
      text: "Invalid",
    }),
    makeSubtitle({
      uuid: "short",
      id: 4,
      startTime: "00:00:05,000",
      endTime: "00:00:05,500",
      text: "Short",
    }),
    makeSubtitle({
      uuid: "long",
      id: 5,
      startTime: "00:00:07,000",
      endTime: "00:00:20,000",
      text: "Long",
    }),
  ];
  const options = {
    minDurationSeconds: 1,
    maxDurationSeconds: 7,
  };
  const issues = analyzeSubtitleQuality(subtitles, options);

  const result = applySubtitleQualityFixes(
    subtitles,
    issues.filter((issue) => issue.fix),
    options,
  );

  assert.equal(result.subtitles[1].startTime, "00:00:02,000");
  assert.equal(result.subtitles[1].endTime, "00:00:03,000");
  assert.equal(result.subtitles[2].startTime, "00:00:04,000");
  assert.equal(result.subtitles[2].endTime, "00:00:05,000");
  assert.equal(result.subtitles[3].startTime, "00:00:05,000");
  assert.equal(result.subtitles[3].endTime, "00:00:06,000");
  assert.equal(result.subtitles[4].startTime, "00:00:07,000");
  assert.equal(result.subtitles[4].endTime, "00:00:14,000");
});

test("line length and line count fixes produce bounded preview text", () => {
  const subtitles = [
    makeSubtitle({
      uuid: "line-length",
      id: 1,
      text: "alpha beta gamma delta",
    }),
    makeSubtitle({
      uuid: "line-count",
      id: 2,
      text: "one\ntwo\nthree\nfour",
    }),
  ];
  const options = {
    maxCharactersPerLine: 11,
    maxLinesPerCue: 2,
  };
  const issues = analyzeSubtitleQuality(subtitles, options);

  const result = applySubtitleQualityFixes(
    subtitles,
    issues.filter((issue) => issue.fix),
    options,
  );

  assert.deepEqual(result.subtitles[0].text.split("\n"), [
    "alpha beta",
    "gamma delta",
  ]);
  assert.equal(result.subtitles[1].text.split("\n").length <= 2, true);
});
