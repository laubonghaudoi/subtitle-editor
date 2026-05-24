import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { createElement } from "react";
import type { ReactNode } from "react";
import {
  SubtitleProvider,
  useLocalSession,
  useSubtitleContext,
} from "../context/subtitle-context";
import {
  LOCAL_SESSION_STORAGE_KEY,
  createLocalSessionSnapshot,
} from "../lib/local-session";

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

const renderSubtitleSession = () =>
  renderHook(
    () => ({
      subtitles: useSubtitleContext(),
      localSession: useLocalSession(),
    }),
    { wrapper },
  );

const waitForAutosave = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
  });
};

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

const savedTracks = [
  {
    id: "track-1",
    name: "Saved Track",
    subtitles: baseSubtitles.map((subtitle) => ({
      ...subtitle,
      trackId: "track-1",
    })),
  },
];

test.beforeEach(() => {
  window.localStorage.clear();
});

test.afterEach(() => {
  cleanup();
});

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

test("splitSubtitleAction respects pending text before splitting", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  await act(async () => {
    result.current.setInitialSubtitles([...baseSubtitles], "Track Zeta");
  });

  const pendingText = "Hello brand new world";
  const caretIndex = pendingText.indexOf(" brand");
  assert.ok(caretIndex > 0);

  await act(async () => {
    result.current.splitSubtitleAction(
      1,
      caretIndex,
      pendingText.length,
      pendingText,
    );
  });

  assert.equal(result.current.subtitles.length, 3);
  assert.equal(
    result.current.subtitles[0].text,
    pendingText.slice(0, caretIndex),
  );
  assert.equal(result.current.subtitles[1].text, pendingText.slice(caretIndex));
});

test("addSpaceOnMerge defaults to off and can be toggled", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  assert.equal(result.current.addSpaceOnMerge, false);

  await act(async () => {
    result.current.setAddSpaceOnMerge(true);
  });

  assert.equal(result.current.addSpaceOnMerge, true);
});

test("provider debounces recoverable subtitle projects into localStorage", async () => {
  const { result } = renderSubtitleSession();

  await act(async () => {
    result.current.subtitles.setInitialSubtitles(
      [...baseSubtitles],
      "Autosaved Track",
      {
        vttHeader: "WEBVTT",
        vttPrologue: ["NOTE recovered"],
      },
    );
    result.current.subtitles.setShowTrackLabels(true);
    result.current.subtitles.setShowSubtitleDuration(true);
    result.current.subtitles.setAddSpaceOnMerge(true);
    result.current.subtitles.setClampOverlaps(false);
    result.current.subtitles.setPlayInBackground(true);
  });

  await waitForAutosave();

  const raw = window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.tracks[0].name, "Autosaved Track");
  assert.equal(parsed.tracks[0].vttHeader, "WEBVTT");
  assert.equal(parsed.tracks[0].vttPrologue[0], "NOTE recovered");
  assert.equal(parsed.preferences.showTrackLabels, true);
  assert.equal(parsed.preferences.showSubtitleDuration, true);
  assert.equal(parsed.preferences.addSpaceOnMerge, true);
  assert.equal(parsed.preferences.clampOverlaps, false);
  assert.equal(parsed.preferences.playInBackground, true);
});

test("provider exposes pending local session and restores it on request", async () => {
  const snapshot = createLocalSessionSnapshot({
    tracks: [
      {
        id: "restored-track",
        name: "Recovered Track",
        subtitles: [
          {
            uuid: "restored-cue",
            id: 1,
            startTime: "00:00:02,000",
            endTime: "00:00:05,000",
            text: "Recovered line",
            trackId: "restored-track",
          },
        ],
      },
    ],
    activeTrackId: "restored-track",
    preferences: {
      showTrackLabels: true,
      showSubtitleDuration: true,
      addSpaceOnMerge: true,
      clampOverlaps: false,
      playInBackground: true,
    },
    now: () => 1234,
  });
  window.localStorage.setItem(
    LOCAL_SESSION_STORAGE_KEY,
    JSON.stringify(snapshot),
  );

  const { result } = renderSubtitleSession();

  await waitFor(() => {
    assert.equal(
      result.current.localSession.pendingLocalSession?.tracks[0].name,
      "Recovered Track",
    );
  });
  assert.equal(result.current.subtitles.tracks.length, 0);

  await act(async () => {
    result.current.localSession.restoreLocalSession();
  });

  await waitFor(() => {
    assert.equal(result.current.subtitles.tracks.length, 1);
    assert.equal(result.current.subtitles.subtitles[0].text, "Recovered line");
  });
  assert.equal(result.current.localSession.pendingLocalSession, null);
  assert.equal(result.current.subtitles.activeTrackId, "restored-track");
  assert.equal(result.current.subtitles.showTrackLabels, true);
  assert.equal(result.current.subtitles.showSubtitleDuration, true);
  assert.equal(result.current.subtitles.addSpaceOnMerge, true);
  assert.equal(result.current.subtitles.clampOverlaps, false);
  assert.equal(result.current.subtitles.playInBackground, true);
});

test("provider discards and clears local autosave snapshots", async () => {
  const snapshot = createLocalSessionSnapshot({
    tracks: savedTracks,
    activeTrackId: "track-1",
    preferences: {
      showTrackLabels: false,
      showSubtitleDuration: false,
      addSpaceOnMerge: false,
      clampOverlaps: true,
      playInBackground: false,
    },
    now: () => 1234,
  });
  window.localStorage.setItem(
    LOCAL_SESSION_STORAGE_KEY,
    JSON.stringify(snapshot),
  );

  const { result, unmount } = renderSubtitleSession();

  await waitFor(() => {
    assert.ok(result.current.localSession.pendingLocalSession);
  });

  await act(async () => {
    result.current.localSession.discardLocalSession();
  });

  assert.equal(result.current.localSession.pendingLocalSession, null);
  assert.equal(window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY), null);
  unmount();

  const second = renderSubtitleSession();

  await act(async () => {
    second.result.current.subtitles.setInitialSubtitles(
      [...baseSubtitles],
      "Clearable Track",
    );
  });

  await waitForAutosave();
  assert.ok(window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY));

  await act(async () => {
    second.result.current.localSession.clearLocalSession();
  });

  assert.equal(window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY), null);
  assert.equal(second.result.current.localSession.hasLocalSession, false);
});

test("clearLocalSession cancels a pending autosave for the unchanged project", async () => {
  const { result } = renderSubtitleSession();

  await act(async () => {
    result.current.subtitles.setInitialSubtitles(
      [...baseSubtitles],
      "Pending Clear Track",
    );
  });

  await act(async () => {
    result.current.localSession.clearLocalSession();
  });

  await waitForAutosave();

  assert.equal(window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY), null);
  assert.equal(result.current.localSession.hasLocalSession, false);
});

test("subtitles remain chronologically sorted after imports and edits", async () => {
  const { result } = renderHook(() => useSubtitleContext(), { wrapper });

  const unsorted = [
    {
      uuid: "late",
      id: 1,
      startTime: "00:00:05,000",
      endTime: "00:00:06,000",
      text: "Late",
    },
    {
      uuid: "early",
      id: 2,
      startTime: "00:00:01,000",
      endTime: "00:00:02,000",
      text: "Early",
    },
  ];

  await act(async () => {
    result.current.setInitialSubtitles([...unsorted], "Chrono");
  });

  await waitFor(() => {
    assert.equal(result.current.subtitles.length, 2);
  });

  assert.deepEqual(
    result.current.subtitles.map((s) => s.uuid),
    ["early", "late"],
  );
  assert.deepEqual(
    result.current.subtitles.map((s) => s.id),
    [2, 1],
  );

  await act(async () => {
    result.current.updateSubtitleTimeAction(2, "00:00:07,000", "00:00:08,000");
  });

  assert.deepEqual(
    result.current.subtitles.map((s) => s.uuid),
    ["late", "early"],
  );
  assert.deepEqual(
    result.current.subtitles.map((s) => s.id),
    [1, 2],
  );
});

test.after(() => {
  dom.window.close();
});
