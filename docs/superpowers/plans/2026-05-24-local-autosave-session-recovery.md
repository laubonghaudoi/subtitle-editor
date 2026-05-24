# Local Autosave Session Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add local autosave and recovery for browser-only subtitle editing sessions from GitHub issue #40.

**Architecture:** Keep autosave serialization in a pure `lib/local-session.ts` module, wire debounced persistence and restore actions into `SubtitleProvider`, and render recovery/settings controls through small client components. The snapshot intentionally stores subtitle/project data and editor preferences only, never media file contents.

**Tech Stack:** Next.js 16 App Router, React 19 client components, Node `node:test`, jsdom, localStorage.

---

## File Structure

- Create: `lib/local-session.ts` for versioned snapshot types, parsing, serialization, storage wrappers, and backup file helpers.
- Create: `tests/local-session.test.ts` for pure schema/storage coverage.
- Modify: `context/subtitle-context.tsx` to read pending autosaves on mount, debounce writes, expose restore/discard/clear/download state, and rebuild per-track undo histories after restore.
- Modify: `tests/subtitle-context.test.ts` for provider-level autosave write and recovery behavior.
- Create: `components/local-session-recovery.tsx` for the restore/discard/download recovery dialog.
- Modify: `components/app-header/settings-dialog.tsx` for a clear-autosave setting.
- Modify: `app/[locale]/page.tsx` to mount the recovery dialog under `SubtitleProvider`.
- Modify: `messages/en.json`, `messages/de.json`, and `messages/yue.json` for visible recovery/settings copy.

### Task 1: Local Session Schema

**Files:**
- Create: `lib/local-session.ts`
- Create: `tests/local-session.test.ts`

- [x] **Step 1: Write failing schema/storage tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_SESSION_STORAGE_KEY,
  createLocalSessionSnapshot,
  parseLocalSessionSnapshot,
  readLocalSessionSnapshot,
  writeLocalSessionSnapshot,
  clearLocalSessionSnapshot,
} from "../lib/local-session";

test("local session snapshots persist tracks and editor preferences", () => {
  const snapshot = createLocalSessionSnapshot({
    tracks: [{ id: "track-1", name: "English", subtitles: [{ uuid: "cue-1", id: 1, startTime: "00:00:00,000", endTime: "00:00:01,000", text: "Hello", trackId: "track-1" }] }],
    activeTrackId: "track-1",
    preferences: { showTrackLabels: true, showSubtitleDuration: true, addSpaceOnMerge: true, clampOverlaps: false, playInBackground: true },
    now: () => 1234,
    appVersion: "0.1.0",
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.tracks[0].name, "English");
  assert.equal(snapshot.preferences.showTrackLabels, true);
});

test("parseLocalSessionSnapshot rejects corrupt or unsupported payloads", () => {
  assert.equal(parseLocalSessionSnapshot("{nope"), null);
  assert.equal(parseLocalSessionSnapshot(JSON.stringify({ schemaVersion: 999 })), null);
});

test("storage helpers use the autosave namespace and tolerate clearing", () => {
  const storage = new Map<string, string>();
  const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };
  const snapshot = createLocalSessionSnapshot({
    tracks: [{ id: "track-1", name: "English", subtitles: [{ uuid: "cue-1", id: 1, startTime: "00:00:00,000", endTime: "00:00:01,000", text: "Hello" }] }],
    activeTrackId: "track-1",
    preferences: { showTrackLabels: false, showSubtitleDuration: false, addSpaceOnMerge: false, clampOverlaps: true, playInBackground: false },
    now: () => 1234,
  });

  writeLocalSessionSnapshot(snapshot, adapter);
  assert.ok(storage.has(LOCAL_SESSION_STORAGE_KEY));
  assert.equal(readLocalSessionSnapshot(adapter)?.tracks[0].id, "track-1");
  clearLocalSessionSnapshot(adapter);
  assert.equal(readLocalSessionSnapshot(adapter), null);
});
```

- [x] **Step 2: Verify the tests fail**

Run: `npm test -- tests/local-session.test.ts`

Expected: FAIL because `lib/local-session.ts` does not exist.

- [x] **Step 3: Implement the pure schema module**

Add `LOCAL_SESSION_STORAGE_KEY = "subtitle-editor:autosave:v1"`, `LocalSessionSnapshot`, `LocalSessionPreferences`, `createLocalSessionSnapshot`, `parseLocalSessionSnapshot`, `readLocalSessionSnapshot`, `writeLocalSessionSnapshot`, and `clearLocalSessionSnapshot`. Validate schema version 1, timestamps, tracks, subtitles, and preference booleans. Reject unsupported/corrupt snapshots by returning `null`.

- [x] **Step 4: Verify schema/storage tests pass**

Run: `npm test -- tests/local-session.test.ts`

Expected: PASS.

### Task 2: Provider Autosave and Recovery Actions

**Files:**
- Modify: `context/subtitle-context.tsx`
- Modify: `tests/subtitle-context.test.ts`

- [x] **Step 1: Write failing provider tests**

Add tests that render `SubtitleProvider`, load subtitles, wait for a debounced autosave write into jsdom `localStorage`, remount with that saved payload, verify a pending recovery is exposed before restore, call restore, and assert tracks/preferences/active subtitles are restored. Add discard/clear assertions that remove `subtitle-editor:autosave:v1`.

- [x] **Step 2: Verify provider tests fail**

Run: `npm test -- tests/subtitle-context.test.ts`

Expected: FAIL because local session state/actions do not exist yet.

- [x] **Step 3: Implement provider wiring**

Extend the context with a local-session value containing `pendingLocalSession`, `hasLocalSession`, `restoreLocalSession`, `discardLocalSession`, `clearLocalSession`, and `downloadLocalSessionBackup`. On mount, read localStorage once and hold a recoverable pending snapshot. Debounce writes by 750 ms when tracks/preferences change, skip playback state, skip empty projects, and avoid overwriting while a pending snapshot awaits user choice. Restore should rebuild track histories with `createTrackHistory` and set the active track history.

- [x] **Step 4: Verify provider tests pass**

Run: `npm test -- tests/subtitle-context.test.ts`

Expected: PASS.

### Task 3: Recovery and Settings UI

**Files:**
- Create: `components/local-session-recovery.tsx`
- Modify: `components/app-header/settings-dialog.tsx`
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/en.json`
- Modify: `messages/de.json`
- Modify: `messages/yue.json`

- [x] **Step 1: Add recovery dialog and settings control**

Create a small recovery dialog that appears when `pendingLocalSession` exists. It shows the saved time, track count, subtitle count, local-only privacy copy, and three actions: restore, download backup, discard. Add a settings row with a clear-autosave button.

- [x] **Step 2: Wire translations**

Add `localSession` keys to all locale files for the recovery title, description, restore, discard, download backup, clear autosave, no autosave, and cleared copy.

- [x] **Step 3: Mount the dialog**

Render `<LocalSessionRecovery />` inside the `SubtitleProvider` in `app/[locale]/page.tsx` so it can read the subtitle context.

- [x] **Step 4: Run static checks**

Run: `npm run lint`

Expected: PASS.

### Task 4: Final Verification and PR

**Files:**
- All touched files

- [x] **Step 1: Run full automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: PASS. If `next/font` or external network causes build failure, capture the exact failure and rerun the non-network checks.

- [x] **Step 2: Validate the rendered flow**

Start the dev server, open the app, create/edit subtitles, reload, restore the autosaved session, discard another autosave, and clear autosave from settings. Check console health and one screenshot of the recovery dialog.

- [x] **Step 3: Commit and publish**

Run:

```bash
git status -sb
git add docs/superpowers/plans/2026-05-24-local-autosave-session-recovery.md lib/local-session.ts tests/local-session.test.ts context/subtitle-context.tsx tests/subtitle-context.test.ts components/local-session-recovery.tsx components/app-header/settings-dialog.tsx app/[locale]/page.tsx messages/en.json messages/de.json messages/yue.json
git commit -m "Add local autosave session recovery"
git push -u origin codex/issue-40-local-autosave
```

- [x] **Step 4: Open draft PR**

Open a draft PR against `main` with title `[codex] Add local autosave session recovery`. Include issue #40, summary, validation commands, and any known limitations.
