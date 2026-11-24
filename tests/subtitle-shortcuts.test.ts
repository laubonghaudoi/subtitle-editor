import assert from "node:assert/strict";
import test from "node:test";
import { renderHook } from "@testing-library/react";
import { useSubtitleShortcuts } from "../hooks/use-subtitle-shortcuts";
import { cleanup, fireEvent } from "./helpers/render";

test.afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function mountShortcuts(hasAdjacentCue = true) {
  const requests: string[] = [];
  renderHook(() =>
    useSubtitleShortcuts({
      subtitles: [],
      tracks: [],
      activeTrackId: null,
      playbackTime: 0,
      setIsPlaying: () => {},
      setEditingSubtitleUuid: () => {},
      setActiveTrackId: () => {},
      canUndoSubtitles: false,
      canRedoSubtitles: false,
      undoSubtitles: () => {},
      redoSubtitles: () => {},
      playAdjacentCue: (direction) => {
        requests.push(direction);
        return hasAdjacentCue;
      },
    }),
  );
  return requests;
}

test("bare horizontal arrows play adjacent cues and consume the key", () => {
  const requests = mountShortcuts();
  assert.equal(fireEvent.keyDown(document.body, { key: "ArrowRight" }), false);
  assert.equal(fireEvent.keyDown(document.body, { key: "ArrowLeft" }), false);
  assert.deepEqual(requests, ["next", "previous"]);
});

test("a horizontal arrow retains its default when there is no adjacent cue", () => {
  const requests = mountShortcuts(false);
  assert.equal(fireEvent.keyDown(document.body, { key: "ArrowRight" }), true);
  assert.deepEqual(requests, ["next"]);
});

test("modified, composing, and already handled arrows do not start playback", () => {
  const requests = mountShortcuts();
  for (const options of [
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { isComposing: true },
  ]) {
    assert.equal(
      fireEvent.keyDown(document.body, { key: "ArrowRight", ...options }),
      true,
    );
  }
  document.body.addEventListener("keydown", (event) => event.preventDefault(), {
    once: true,
  });
  fireEvent.keyDown(document.body, { key: "ArrowLeft" });
  assert.deepEqual(requests, []);
});

test("text fields and arrow-operated controls retain their horizontal arrows", () => {
  const requests = mountShortcuts();
  const slider = document.createElement("span");
  slider.setAttribute("role", "slider");
  const tabList = document.createElement("div");
  tabList.setAttribute("role", "tablist");
  const tab = document.createElement("button");
  tab.setAttribute("role", "tab");
  tabList.append(tab);
  const editable = document.createElement("div");
  editable.setAttribute("contenteditable", "true");
  // JSDOM does not implement the browser's computed editing state.
  Object.defineProperty(editable, "isContentEditable", { value: true });
  const input = document.createElement("input");
  const textarea = document.createElement("textarea");
  const select = document.createElement("select");
  document.body.append(input, textarea, select, slider, tabList, editable);

  for (const control of [input, textarea, select, slider, tab, editable]) {
    control.tabIndex = 0;
    control.focus();
    assert.equal(
      fireEvent.keyDown(control, { key: "ArrowLeft" }),
      true,
      control.outerHTML,
    );
  }
  assert.deepEqual(requests, []);
});
