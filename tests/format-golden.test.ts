import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCsvContent,
  buildPlainTextContent,
  buildSrtContent,
  buildVttContent,
} from "../lib/format";
import { parseVTT } from "../lib/subtitle-operations";
import { subtitlesToVttString } from "../lib/utils";
import type { Subtitle } from "../types/subtitle";

const goldenSubtitles: Subtitle[] = [
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

const expectedPlainText = ["First line continues", "Second cue"].join("\n");
const expectedCsv = [
  "id,start_time,end_time,text",
  '1,"00:00:00,000","00:00:02,500",First line continues',
  '2,"00:00:03,000","00:00:05,000",Second cue',
].join("\n");

test("buildSrtContent matches golden cue output", () => {
  const actual = buildSrtContent(goldenSubtitles);
  assert.equal(actual, expectedSrt);
});

test("buildPlainTextContent flattens cues to single-line plain text", () => {
  const actual = buildPlainTextContent(goldenSubtitles);
  assert.equal(actual, expectedPlainText);
});

test("buildCsvContent outputs four-column CSV", () => {
  const actual = buildCsvContent(goldenSubtitles);
  assert.equal(actual, expectedCsv);
});

test("buildVttContent preserves header and prologue blocks", () => {
  const vtt = buildVttContent(goldenSubtitles, {
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
  const rebuilt = buildSrtContent(parsed);
  assert.equal(rebuilt, expectedSrt);
});

test("subtitlesToVttString round-trips back to the original cues", () => {
  const vtt = subtitlesToVttString(goldenSubtitles);
  const reparsed = parseVTT(vtt);
  const roundTripped = buildSrtContent(reparsed);
  assert.equal(roundTripped, expectedSrt);
});
