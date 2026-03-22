import test from "node:test";
import assert from "node:assert/strict";
import {
  detectSupportedFormats,
  normalizeCanPlayType,
} from "../lib/media-support";

test("normalizeCanPlayType accepts maybe and probably", () => {
  assert.equal(normalizeCanPlayType("maybe"), "maybe");
  assert.equal(normalizeCanPlayType("probably"), "probably");
  assert.equal(normalizeCanPlayType(""), null);
});

test("detectSupportedFormats keeps probe order and prefers stronger support", () => {
  const formats = detectSupportedFormats(
    [
      { key: "mp3", label: "mp3", mimeType: "audio/mpeg" },
      { key: "flac", label: "flac", mimeType: "audio/flac" },
      { key: "flac", label: "flac", mimeType: "audio/x-flac" },
      { key: "opus", label: "opus", mimeType: "audio/opus" },
    ],
    (mimeType) => {
      switch (mimeType) {
        case "audio/mpeg":
          return "probably";
        case "audio/flac":
          return "maybe";
        case "audio/x-flac":
          return "probably";
        default:
          return "";
      }
    },
  );

  assert.deepEqual(formats, [
    { label: "mp3", support: "probably" },
    { label: "flac", support: "probably" },
  ]);
});
