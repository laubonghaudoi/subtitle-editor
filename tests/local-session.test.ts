import test from "node:test";
import assert from "node:assert/strict";
import type { SubtitleTrack } from "../types/subtitle";
import {
  LOCAL_SESSION_STORAGE_KEY,
  clearLocalSessionSnapshot,
  createLocalSessionSnapshot,
  getLocalSessionSignature,
  parseLocalSessionSnapshot,
  readLocalSessionSnapshot,
  shouldAutosaveLocalSession,
  writeLocalSessionSnapshot,
} from "../lib/local-session";

const preferences = {
  showTrackLabels: true,
  showSubtitleDuration: true,
  addSpaceOnMerge: true,
  clampOverlaps: false,
  playInBackground: true,
};

const tracks: SubtitleTrack[] = [
  {
    id: "track-1",
    name: "English",
    vttHeader: "WEBVTT",
    vttPrologue: ["NOTE kept"],
    subtitles: [
      {
        uuid: "cue-1",
        id: 1,
        startTime: "00:00:00,000",
        endTime: "00:00:01,000",
        text: "Hello",
        trackId: "track-1",
      },
    ],
  },
];

test("local session snapshots persist tracks and editor preferences", () => {
  const snapshot = createLocalSessionSnapshot({
    tracks,
    activeTrackId: "track-1",
    preferences,
    now: () => 1234,
    appVersion: "0.1.0",
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.savedAt, 1234);
  assert.equal(snapshot.appVersion, "0.1.0");
  assert.equal(snapshot.tracks[0].name, "English");
  assert.equal(snapshot.tracks[0].vttPrologue?.[0], "NOTE kept");
  assert.equal(snapshot.tracks[0].subtitles[0].text, "Hello");
  assert.equal(snapshot.preferences.showTrackLabels, true);
  assert.equal(snapshot.preferences.clampOverlaps, false);
});

test("parseLocalSessionSnapshot rejects corrupt or unsupported payloads", () => {
  assert.equal(parseLocalSessionSnapshot("{nope"), null);
  assert.equal(
    parseLocalSessionSnapshot(JSON.stringify({ schemaVersion: 999 })),
    null,
  );
  assert.equal(
    parseLocalSessionSnapshot(
      JSON.stringify({
        schemaVersion: 1,
        savedAt: 1234,
        tracks: [],
        preferences,
      }),
    ),
    null,
  );
});

test("parseLocalSessionSnapshot normalizes invalid active track IDs", () => {
  const parsed = parseLocalSessionSnapshot(
    JSON.stringify(
      createLocalSessionSnapshot({
        tracks,
        activeTrackId: "missing",
        preferences,
        now: () => 1234,
      }),
    ),
  );

  assert.equal(parsed?.activeTrackId, "track-1");
});

test("shouldAutosaveLocalSession skips empty projects", () => {
  const emptySnapshot = createLocalSessionSnapshot({
    tracks: [{ id: "track-1", name: "Untitled", subtitles: [] }],
    activeTrackId: "track-1",
    preferences,
    now: () => 1234,
  });

  assert.equal(shouldAutosaveLocalSession(emptySnapshot), false);
  assert.equal(
    shouldAutosaveLocalSession(
      createLocalSessionSnapshot({
        tracks,
        activeTrackId: "track-1",
        preferences,
        now: () => 1234,
      }),
    ),
    true,
  );
});

test("getLocalSessionSignature changes when recoverable content changes", () => {
  const baseline = getLocalSessionSignature({
    tracks,
    activeTrackId: "track-1",
    preferences,
  });

  const renamedTrack = getLocalSessionSignature({
    tracks: [{ ...tracks[0], name: "Cantonese" }],
    activeTrackId: "track-1",
    preferences,
  });
  const editedCue = getLocalSessionSignature({
    tracks: [
      {
        ...tracks[0],
        subtitles: [{ ...tracks[0].subtitles[0], text: "Changed" }],
      },
    ],
    activeTrackId: "track-1",
    preferences,
  });
  const changedPreferences = getLocalSessionSignature({
    tracks,
    activeTrackId: "track-1",
    preferences: { ...preferences, playInBackground: false },
  });

  assert.notEqual(renamedTrack, baseline);
  assert.notEqual(editedCue, baseline);
  assert.notEqual(changedPreferences, baseline);
});

test("storage helpers use the autosave namespace and tolerate clearing", () => {
  const storage = new Map<string, string>();
  const adapter = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
  const snapshot = createLocalSessionSnapshot({
    tracks,
    activeTrackId: "track-1",
    preferences,
    now: () => 1234,
  });

  writeLocalSessionSnapshot(snapshot, adapter);

  assert.ok(storage.has(LOCAL_SESSION_STORAGE_KEY));
  assert.equal(readLocalSessionSnapshot(adapter)?.tracks[0].id, "track-1");

  clearLocalSessionSnapshot(adapter);

  assert.equal(readLocalSessionSnapshot(adapter), null);
});
