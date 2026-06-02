import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EDITOR_MIN_WIDTH_PX,
  EDITOR_MIN_WIDTH_REM,
  EDITOR_WIDE_VIEWPORT_QUERY,
  INITIAL_EDITOR_VIEWPORT_STATE,
  isWideEditorViewport,
  nextEditorViewportState,
  type MatchMediaLike,
} from "../components/editor/viewport";

const fakeWindow = (matches: boolean): MatchMediaLike => ({
  matchMedia: (query: string) => {
    assert.equal(query, EDITOR_WIDE_VIEWPORT_QUERY);
    return { matches } as MediaQueryList;
  },
});

test("editor breakpoint contract stays aligned across TS and Tailwind", () => {
  assert.equal(EDITOR_MIN_WIDTH_REM, 64);
  assert.equal(EDITOR_MIN_WIDTH_PX, 1024);

  const css = readFileSync("app/globals.css", "utf8");
  const match = css.match(/--breakpoint-editor:\s*(\d+(?:\.\d+)?)rem;/);
  assert.ok(match, "missing --breakpoint-editor rem value");

  const cssMinWidthPx = Number(match[1]) * 16;
  assert.equal(cssMinWidthPx, EDITOR_MIN_WIDTH_PX);
  assert.equal(
    EDITOR_WIDE_VIEWPORT_QUERY,
    `(min-width: ${cssMinWidthPx}px)`,
  );
});

test("isWideEditorViewport reads the configured media query", () => {
  assert.equal(isWideEditorViewport(fakeWindow(true)), true);
  assert.equal(isWideEditorViewport(fakeWindow(false)), false);
  assert.equal(isWideEditorViewport(undefined), false);
});

test("editor viewport state latches after the first wide viewport", () => {
  const firstNarrow = nextEditorViewportState(
    INITIAL_EDITOR_VIEWPORT_STATE,
    false,
  );
  assert.deepEqual(firstNarrow, {
    isWide: false,
    shouldMountEditor: false,
  });

  const firstWide = nextEditorViewportState(firstNarrow, true);
  assert.deepEqual(firstWide, {
    isWide: true,
    shouldMountEditor: true,
  });

  const narrowedAfterMount = nextEditorViewportState(firstWide, false);
  assert.deepEqual(narrowedAfterMount, {
    isWide: false,
    shouldMountEditor: true,
  });
});
