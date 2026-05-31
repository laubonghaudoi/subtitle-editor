import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const waveformUtilsSource = readFileSync(
  "components/waveform-visualizer/utils.ts",
  "utf8",
);

test("waveform region handles use solid track-colored borders", () => {
  assert.match(waveformUtilsSource, /border-left:\s*2px solid \$\{handleColor\}/);
  assert.match(
    waveformUtilsSource,
    /border-right:\s*2px solid \$\{handleColor\}/,
  );
  assert.doesNotMatch(
    waveformUtilsSource,
    /border-(left|right):\s*2px dashed \$\{handleColor\}/,
  );
});
