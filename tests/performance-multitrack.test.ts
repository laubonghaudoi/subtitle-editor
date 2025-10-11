import test from "node:test";
import assert from "node:assert/strict";
import { secondsToTime, subtitlesToSrtString } from "../lib/utils";
import type { Subtitle } from "../types/subtitle";

function generateSubtitles(count: number, startOffsetSec = 0): Subtitle[] {
  const subs: Subtitle[] = [];
  let t = startOffsetSec;
  for (let i = 1; i <= count; i++) {
    const start = secondsToTime(t);
    const end = secondsToTime(t + 3);
    subs.push({
      uuid: `uuid-${i}`,
      id: i,
      startTime: start,
      endTime: end,
      text: `Subtitle ${i}`,
    });
    t += 3.1; // small gap to simulate non-overlap
  }
  return subs;
}

test("subtitlesToSrtString handles 4 tracks worth of data", () => {
  const tracks = [
    generateSubtitles(250, 0),
    generateSubtitles(250, 0.5),
    generateSubtitles(250, 1),
    generateSubtitles(250, 1.5),
  ];

  const outputs = tracks.map(subtitlesToSrtString);
  for (const out of outputs) {
    assert.ok(out.length > 0);
    // Should contain time arrows and sample text
    assert.ok(out.includes("-->"));
    assert.ok(out.includes("Subtitle"));
  }
});
