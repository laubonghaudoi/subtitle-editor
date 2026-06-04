import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NARROW_SCREEN_PROCEED_SESSION_KEY,
  EDITOR_MIN_WIDTH_PX,
  EDITOR_MIN_WIDTH_REM,
  EDITOR_WIDE_VIEWPORT_QUERY,
  INITIAL_EDITOR_VIEWPORT_STATE,
  createEditorViewportState,
  isWideEditorViewport,
  nextEditorViewportState,
  persistNarrowScreenProceed,
  readNarrowScreenProceed,
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

  const cssMinWidthRem = Number(match[1]);
  assert.equal(cssMinWidthRem, EDITOR_MIN_WIDTH_REM);
  assert.equal(EDITOR_MIN_WIDTH_PX, EDITOR_MIN_WIDTH_REM * 16);
  assert.equal(EDITOR_WIDE_VIEWPORT_QUERY, `(min-width: ${cssMinWidthRem}rem)`);
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
    hasNarrowScreenProceed: false,
    shouldMountEditor: false,
  });

  const firstWide = nextEditorViewportState(firstNarrow, true);
  assert.deepEqual(firstWide, {
    isWide: true,
    hasNarrowScreenProceed: false,
    shouldMountEditor: true,
  });

  const narrowedAfterMount = nextEditorViewportState(firstWide, false);
  assert.deepEqual(narrowedAfterMount, {
    isWide: false,
    hasNarrowScreenProceed: false,
    shouldMountEditor: true,
  });
});

test("narrow screen proceed latches editor mounting", () => {
  const proceeded = createEditorViewportState(false, true);
  assert.deepEqual(proceeded, {
    isWide: false,
    hasNarrowScreenProceed: true,
    shouldMountEditor: true,
  });

  const stillNarrow = nextEditorViewportState(proceeded, false);
  assert.deepEqual(stillNarrow, {
    isWide: false,
    hasNarrowScreenProceed: true,
    shouldMountEditor: true,
  });
});

test("narrow screen proceed storage tolerates unavailable sessionStorage", () => {
  assert.equal(readNarrowScreenProceed(undefined), false);
  assert.doesNotThrow(() => persistNarrowScreenProceed(undefined));

  const stored = new Map<string, string>();
  const storage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => {
      stored.set(key, value);
    },
  };

  assert.equal(readNarrowScreenProceed(storage), false);
  persistNarrowScreenProceed(storage);
  assert.equal(stored.get(NARROW_SCREEN_PROCEED_SESSION_KEY), "true");
  assert.equal(readNarrowScreenProceed(storage), true);
});
