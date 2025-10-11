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

// Minimal DOM environment for React Testing Library
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
  window.requestAnimationFrame ??
  ((cb: FrameRequestCallback) => setTimeout(cb, 0));
globalThis.cancelAnimationFrame =
  window.cancelAnimationFrame ?? ((id: number) => clearTimeout(id));
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(SubtitleProvider, null, children);

const baseSubtitles = [
  {
    uuid: "base-1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:04,000",
    text: "Hello there",
  },
  {
    uuid: "base-2",
    id: 2,
    startTime: "00:00:04,000",
    endTime: "00:00:07,000",
    text: "General Kenobi",
  },
];

test("subtitle actions push history and support undo/redo cycles", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track A");
  });

  await waitFor(() => {
    assert.equal(result.current.subtitles.length, 2);
  });

  const originalFirst = baseSubtitles[0].text;
  const splitCaret = 5;
  const splitLength = baseSubtitles[0].text.length;

  await act(async () => {
    result.current.splitSubtitleAction(1, splitCaret, splitLength);
  });
  assert.equal(result.current.subtitles.length, 3);
  assert.equal(
    result.current.subtitles[0].text,
    originalFirst.slice(0, splitCaret),
  );
  assert.equal(
    result.current.subtitles[1].text,
    originalFirst.slice(splitCaret),
  );

  await act(async () => {
    result.current.mergeSubtitlesAction(1, 2);
  });
  assert.equal(result.current.subtitles.length, 2);
  assert.equal(result.current.subtitles[0].text, originalFirst);

  await act(async () => {
    result.current.addSubtitleAction(2, null, "Inserted line");
  });
  assert.equal(result.current.subtitles.length, 3);
  assert.equal(result.current.subtitles[2].text, "Inserted line");

  // Undo stack should walk backwards through merge -> split -> initial
  await act(async () => {
    result.current.undoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 2);
  assert.equal(result.current.subtitles[0].text, originalFirst);

  await act(async () => {
    result.current.undoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 3);

  await act(async () => {
    result.current.undoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 2);

  // Redo forward to ensure stack integrity
  await act(async () => {
    result.current.redoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 3);

  await act(async () => {
    result.current.redoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 2);

  await act(async () => {
    result.current.redoSubtitles();
  });
  assert.equal(result.current.subtitles.length, 3);
});

test("undo stacks remain isolated per track when switching focus", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track Alpha");
  });
  await waitFor(() => {
    assert.equal(result.current.tracks.length, 1);
    assert.ok(result.current.activeTrackId);
  });
  const trackA = result.current.activeTrackId!;

  await act(async () => {
    result.current.addTrack("Track Beta", [
      {
        uuid: "b-1",
        id: 1,
        startTime: "00:00:08,000",
        endTime: "00:00:10,000",
        text: "Second track line",
      },
    ]);
  });

  await waitFor(() => {
    assert.equal(result.current.tracks.length, 2);
  });
  const trackB = result.current.tracks.find((t) => t.id !== trackA)?.id;
  assert.ok(trackB);

  await act(async () => {
    result.current.updateSubtitleTextAction(1, "Alpha edited");
  });
  assert.equal(result.current.subtitles[0].text, "Alpha edited");

  await act(async () => {
    result.current.setActiveTrackId(trackB!);
  });
  await waitFor(() => {
    assert.equal(result.current.activeTrackId, trackB);
  });

  await act(async () => {
    result.current.updateSubtitleTextAction(1, "Beta tweaked");
  });
  assert.equal(result.current.subtitles[0].text, "Beta tweaked");

  await act(async () => {
    result.current.undoSubtitles();
  });
  assert.equal(result.current.subtitles[0].text, "Second track line");

  await act(async () => {
    result.current.setActiveTrackId(trackA);
  });
  await waitFor(() => {
    assert.equal(result.current.activeTrackId, trackA);
  });

  assert.equal(result.current.subtitles[0].text, "Alpha edited");

  await act(async () => {
    result.current.undoSubtitles();
  });
  assert.equal(result.current.subtitles[0].text, baseSubtitles[0].text);

  await act(async () => {
    result.current.redoSubtitles();
  });
  assert.equal(result.current.subtitles[0].text, "Alpha edited");

  await act(async () => {
    result.current.setActiveTrackId(trackB);
  });
  await waitFor(() => {
    assert.equal(result.current.activeTrackId, trackB);
  });
  assert.equal(result.current.subtitles[0].text, "Second track line");
});

test.after(() => {
  dom.window.close();
});
