import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";

import {
  SubtitleProvider,
  useSubtitleContext,
} from "../context/subtitle-context";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
const { window } = dom;

globalThis.window = window as unknown as typeof globalThis.window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", {
  value: window.navigator,
  configurable: true,
});
globalThis.HTMLElement = window.HTMLElement;
globalThis.MutationObserver =
  window.MutationObserver ??
  class {
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
  };
globalThis.requestAnimationFrame =
  window.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(cb, 0));
globalThis.cancelAnimationFrame =
  window.cancelAnimationFrame ?? ((id: number) => clearTimeout(id));
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(SubtitleProvider, null, children);

const baseSubtitles = [
  {
    uuid: "s1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:02,000",
    text: "First",
  },
  {
    uuid: "s2",
    id: 2,
    startTime: "00:00:03,000",
    endTime: "00:00:05,000",
    text: "Second",
  },
  {
    uuid: "s3",
    id: 3,
    startTime: "00:00:06,000",
    endTime: "00:00:08,000",
    text: "Third",
  },
];

test("bulkShiftSubtitlesAction adjusts start times without crossing neighbours", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track");
  });

  await waitFor(() => {
    assert.equal(result.current.subtitles.length, 3);
  });

  await act(async () => {
    result.current.bulkShiftSubtitlesAction(["s1", "s2"], 1, "start");
  });

  const [first, second, third] = result.current.subtitles;
  assert.equal(first.startTime, "00:00:01,000");
  assert.equal(first.endTime, "00:00:02,000");
  assert.equal(second.startTime, "00:00:04,000");
  assert.equal(second.endTime, "00:00:05,000");
  assert.equal(third.startTime, "00:00:06,000");
});

test("bulkShiftSubtitlesAction clamps ends and maintains chronological order", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track");
  });

  await act(async () => {
    result.current.bulkShiftSubtitlesAction(["s2"], -3, "end");
  });

  const [, second] = result.current.subtitles;
  assert.equal(second.endTime, "00:00:03,000");
  assert.equal(second.startTime, "00:00:03,000");

  const starts = result.current.subtitles.map((s) => s.startTime);
  assert.deepEqual(starts, ["00:00:00,000", "00:00:03,000", "00:00:06,000"]);
});

test("bulkShiftSubtitlesAction shifts both bounds together for selection", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track");
  });

  await act(async () => {
    result.current.bulkShiftSubtitlesAction(["s2", "s3"], 2, "both");
  });

  const shifted = result.current.subtitles.filter((s) => s.uuid !== "s1");
  assert.deepEqual(
    shifted.map((s) => [s.startTime, s.endTime]),
    [
      ["00:00:05,000", "00:00:07,000"],
      ["00:00:08,000", "00:00:10,000"],
    ],
  );

  const order = result.current.subtitles.map((s) => s.uuid);
  assert.deepEqual(order, ["s1", "s2", "s3"]);
});
