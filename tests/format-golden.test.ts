import test from "node:test";
import assert from "node:assert/strict";
import { buildSrtContent, buildVttContent } from "../lib/format";
import { parseVTT } from "../lib/subtitle-operations";
import { srtToVtt } from "../lib/utils";

const goldenSubtitles = [
  {
    uuid: "gold-1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:02,500",
    text: "First line\ncontinues",
  },
  {
    uuid: "gold-2",
    id: 2,
    startTime: "00:00:03,000",
    endTime: "00:00:05,000",
    text: "<i>Second</i> cue",
  },
];

const expectedSrt =
  "1\n00:00:00,000 --> 00:00:02,500\nFirst line\ncontinues\n\n2\n00:00:03,000 --> 00:00:05,000\n<i>Second</i> cue\n";

test("buildSrtContent matches golden cue output", () => {
  const actual = buildSrtContent(goldenSubtitles as any);
  assert.equal(actual, expectedSrt);
});

test("buildVttContent preserves header and prologue blocks", () => {
  const vtt = buildVttContent(goldenSubtitles as any, {
    header: "WEBVTT Kind: captions",
    prologue: ["NOTE example metadata", "STYLE\n::cue { color: yellow; }"],
  });

  const expectedVtt = [
    "WEBVTT Kind: captions",
    "",
    "NOTE example metadata",
    "",
    "STYLE",
    "::cue { color: yellow; }",
    "",
    "1",
    "00:00:00.000 --> 00:00:02.500",
    "First line",
    "continues",
    "",
    "2",
    "00:00:03.000 --> 00:00:05.000",
    "<i>Second</i> cue",
    "",
  ].join("\n");

  assert.equal(vtt, expectedVtt);

  const parsed = parseVTT(vtt);
  const rebuilt = buildSrtContent(
    parsed.map(({ id, startTime, endTime, text }) => ({
      uuid: `rt-${id}`,
      id,
      startTime,
      endTime,
      text,
    })),
  );
  assert.equal(rebuilt, expectedSrt);
});

test("srtToVtt round-trips back to the original cues", () => {
  const vtt = srtToVtt(expectedSrt, "WEBVTT");
  const reparsed = parseVTT(vtt);
  const roundTripped = buildSrtContent(
    reparsed.map(({ id, startTime, endTime, text }) => ({
      uuid: `vtt-${id}`,
      id,
      startTime,
      endTime,
      text,
    })),
  );
  assert.equal(roundTripped, expectedSrt);
});
