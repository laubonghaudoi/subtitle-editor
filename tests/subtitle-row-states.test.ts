import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const subtitleItemSource = readFileSync(
  "components/subtitle/subtitle-item.tsx",
  "utf8",
);
const subtitleTextEditorSource = readFileSync(
  "components/subtitle/subtitle-item-text-editor.tsx",
  "utf8",
);
const globalsSource = readFileSync("app/globals.css", "utf8");

test("subtitle row current state follows the active track color", () => {
  assert.match(
    subtitleItemSource,
    /getTrackColor\(activeTrackIndex,\s*0\.22\)/,
  );
  assert.match(subtitleItemSource, /getTrackHandleColor\(activeTrackIndex\)/);
  assert.match(subtitleItemSource, /data-current=/);
  assert.match(subtitleItemSource, /--subtitle-row-current-bg/);
  assert.match(subtitleItemSource, /--subtitle-row-current-bar/);
  assert.doesNotMatch(subtitleItemSource, /bg-iris-300/);
});

test("subtitle row hover state uses the iris accent token", () => {
  assert.match(globalsSource, /--subtitle-row-hover-bg:\s*var\(--iris-4\)/);
  assert.doesNotMatch(globalsSource, /--subtitle-row-hover-bg:\s*#fef0c0/);
  assert.doesNotMatch(globalsSource, /--subtitle-row-hover-bg:\s*#3a2e08/);
  assert.doesNotMatch(subtitleItemSource, /hover:bg-accent/);
});

test("subtitle text editing field keeps the iris active-input treatment", () => {
  assert.match(subtitleTextEditorSource, /bg-iris-200/);
  assert.match(subtitleTextEditorSource, /border border-iris-700/);
  assert.doesNotMatch(subtitleTextEditorSource, /border-none/);
});
