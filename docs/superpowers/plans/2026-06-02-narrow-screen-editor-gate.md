# Narrow Screen Editor Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make localized editor routes intentionally wide-screen-only by showing a useful narrow-screen prompt on phones while loading the full subtitle editor only after the viewport is wide enough.

**Architecture:** Convert `app/[locale]/page.tsx` from a full client component into a server component that renders localized narrow-screen copy and a small client entry. Move the existing editor into a separate client component, gate the dynamic import behind a tested viewport contract, and latch the mounted editor after it has loaded once so resize/rotation does not drop in-memory work.

**Tech Stack:** Next.js App Router, React 19, next-intl, Tailwind CSS v4, Node `tsx --test`, Testing Library, Lighthouse.

---

## Review-Driven Changes

This revision incorporates Claude's review:

- The service-worker issue is removed from this PR. It needs a separate PWA decision: repair generation for Next 16/OpenNext/Cloudflare or remove PWA support wholesale.
- The bulk-offset accessible-name fix is removed from this PR. It is valid, but it is an unrelated small accessibility fix.
- The editor gate must latch after the first wide viewport so rotating or resizing narrow does not unmount the editor and lose state.
- The breakpoint is moved into a named Tailwind `editor:` breakpoint plus a TypeScript constant, with a test that catches drift.
- The narrow-screen notice includes a `/faq` link and uses localized text for all visible strings.
- The editor threshold is fixed at `1024px`.
- The manual verification includes screenshots, a desktop timing check, and a waveform redraw check after resize.

## Scope

In scope:

- Localized editor routes (`/[locale]`) show a clear prompt on narrow screens.
- Wide screens still load the existing editor.
- First-time narrow-screen visits do not import the full editor bundle.
- Once the editor has loaded in a wide viewport, narrowing the viewport hides but does not unmount the editor.
- The prompt is translated in every existing locale and links to `/faq`.
- The breakpoint contract is explicit and tested.

Out of scope:

- A complete mobile subtitle editor.
- Service-worker/PWA repair or removal.
- Bulk-offset button accessible-name fix.
- Analytics/GTM changes.
- Radix CSS palette trimming.
- Locale middleware/proxy migration, except if it blocks verification.

## Product Decision

Chosen threshold: `1024px`.

Rationale: this editor needs room for video, subtitles, controls, and waveform/timeline work. `1024px` maps cleanly to tablet landscape and avoids presenting the editor on cramped phone-landscape or small tablet layouts.

## Files

- Modify: `app/[locale]/page.tsx`
- Modify: `app/globals.css`
- Create: `components/editor/editor-app.tsx`
- Create: `components/editor/narrow-screen-notice.tsx`
- Create: `components/editor/responsive-editor-entry.tsx`
- Create: `components/editor/viewport.ts`
- Modify: `messages/en.json`
- Modify: `messages/de.json`
- Modify: `messages/pl.json`
- Modify: `messages/yue.json`
- Create: `tests/narrow-screen-notice.test.ts`
- Create: `tests/editor-viewport.test.ts`

## Task 0: Capture Baseline Screenshots And Desktop Timing

**Files:**

- No source edits.

- [ ] **Step 1: Build and run the current app**

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Expected:

- Build succeeds.
- `http://127.0.0.1:3000/de`, `/pl`, and `/yue` can be opened directly.
- If `/` still redirects incorrectly under `next start`, ignore `/` for this threshold check and use explicit locale routes.

- [ ] **Step 2: Capture current editor screenshots as baseline evidence**

Use a browser automation tool or the in-app browser to capture `http://127.0.0.1:3000/de` at:

```text
390x844
768x1024
900x900
1024x768
1440x900
```

Expected:

- `390x844`: documents the phone experience that will become the notice.
- `768x1024`: documents the sub-1024 tablet portrait experience that will become the notice.
- `900x900`: documents the sub-1024 small tablet/small desktop experience that will become the notice.
- `1024x768`: expected first supported tablet-landscape width.
- `1440x900`: desktop baseline.

- [ ] **Step 3: Capture current desktop timing baseline**

Use the browser performance panel or Lighthouse trace for `http://127.0.0.1:3000/de` at `1440x900`.

Record the exact current time from navigation to usable editor controls and current desktop first contentful paint in the implementation PR notes or a local scratch note. Do not invent these values.

This is the comparison point for the new client gate's blank-to-loading-to-editor path.

Do not commit this task unless screenshots or notes are added to the repo.

## Task 1: Extract The Current Editor Into A Client Component

**Files:**

- Create: `components/editor/editor-app.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Create the editor component file**

Create `components/editor/editor-app.tsx` by moving the current contents of `app/[locale]/page.tsx` into this new file.

The file must start with:

```tsx
"use client";
```

The exported component should be renamed from `Home` to `EditorApp`:

```tsx
export default function EditorApp() {
  return (
    <SubtitleProvider>
      <LocalSessionRecovery />
      <MainContent />
    </SubtitleProvider>
  );
}
```

Keep the current `MainContent`, `VideoPlayer`, `WaveformVisualizer`, and `BulkOffsetDrawer` logic unchanged in this task.

- [ ] **Step 2: Leave the route importing the extracted editor**

Replace `app/[locale]/page.tsx` with:

```tsx
import EditorApp from "@/components/editor/editor-app";

export default function Home() {
  return <EditorApp />;
}
```

- [ ] **Step 3: Verify the extraction did not change behavior**

```bash
npm test
npm run lint
npm run build
```

Expected:

- Tests pass.
- Lint passes with zero warnings.
- Build succeeds.
- The editor still loads on desktop.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/page.tsx components/editor/editor-app.tsx
git commit -m "refactor: extract editor app component"
```

## Task 2: Add The Breakpoint Contract And Latching State Helper

**Files:**

- Modify: `app/globals.css`
- Create: `components/editor/viewport.ts`
- Test: `tests/editor-viewport.test.ts`

- [ ] **Step 1: Add the Tailwind editor breakpoint**

In `app/globals.css`, add this near the top of the existing `@theme` block:

```css
  /* Keep in sync with EDITOR_MIN_WIDTH_PX in components/editor/viewport.ts. */
  --breakpoint-editor: 64rem;
```

`64rem` equals `1024px` at the browser default `16px` root font size. This creates Tailwind's `editor:` variant, so components can use `editor:hidden` and `editor:flex` instead of hardcoded `min-[1024px]` literals.

- [ ] **Step 2: Add viewport constants and pure latching helper**

Create `components/editor/viewport.ts`:

```ts
const CSS_PX_PER_REM = 16;

export const EDITOR_MIN_WIDTH_REM = 64;
export const EDITOR_MIN_WIDTH_PX = EDITOR_MIN_WIDTH_REM * CSS_PX_PER_REM;
export const EDITOR_WIDE_VIEWPORT_QUERY = `(min-width: ${EDITOR_MIN_WIDTH_PX}px)`;

export interface EditorViewportState {
  isWide: boolean;
  shouldMountEditor: boolean;
}

export const INITIAL_EDITOR_VIEWPORT_STATE: EditorViewportState = {
  isWide: false,
  shouldMountEditor: false,
};

export type MatchMediaLike = Pick<Window, "matchMedia">;

export function isWideEditorViewport(win: MatchMediaLike | undefined): boolean {
  return Boolean(win?.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY).matches);
}

export function nextEditorViewportState(
  current: EditorViewportState,
  nextIsWide: boolean,
): EditorViewportState {
  return {
    isWide: nextIsWide,
    shouldMountEditor: current.shouldMountEditor || nextIsWide,
  };
}
```

- [ ] **Step 3: Write the failing viewport tests**

Create `tests/editor-viewport.test.ts`:

```ts
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
```

Run:

```bash
npx tsx --test tests/editor-viewport.test.ts
```

Expected before Steps 1 and 2 are complete: FAIL because `components/editor/viewport.ts` or the CSS breakpoint does not exist.

Expected after Steps 1 and 2 are complete: PASS.

- [ ] **Step 4: Verify**

```bash
npx tsx --test tests/editor-viewport.test.ts
npm run lint
```

Expected:

- Viewport tests pass.
- Lint passes.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/editor/viewport.ts tests/editor-viewport.test.ts
git commit -m "feat: add editor viewport breakpoint"
```

## Task 3: Add The Localized Narrow-Screen Notice

**Files:**

- Create: `components/editor/narrow-screen-notice.tsx`
- Modify: `messages/en.json`
- Modify: `messages/de.json`
- Modify: `messages/pl.json`
- Modify: `messages/yue.json`
- Test: `tests/narrow-screen-notice.test.ts`

- [ ] **Step 1: Add the notice component**

Create `components/editor/narrow-screen-notice.tsx`:

```tsx
import Link from "next/link";

interface NarrowScreenNoticeProps {
  eyebrow: string;
  title: string;
  description: string;
  minimum: string;
  faqHref: string;
  faqLabel: string;
}

export function NarrowScreenNotice({
  eyebrow,
  title,
  description,
  minimum,
  faqHref,
  faqLabel,
}: NarrowScreenNoticeProps) {
  return (
    <section
      aria-labelledby="narrow-screen-title"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 px-6 py-10 text-center text-white editor:hidden"
    >
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-300">
          {eyebrow}
        </p>
        <h1
          id="narrow-screen-title"
          className="text-3xl font-semibold leading-tight"
        >
          {title}
        </h1>
        <p className="text-base leading-7 text-slate-200">{description}</p>
        <p className="text-sm text-slate-400">{minimum}</p>
        <Link
          href={faqHref}
          className="inline-flex min-h-10 items-center justify-center rounded-xs border border-teal-300 px-4 text-sm font-medium text-teal-100 transition hover:bg-teal-300 hover:text-slate-950"
        >
          {faqLabel}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the failing notice test**

Create `tests/narrow-screen-notice.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { NarrowScreenNotice } from "../components/editor/narrow-screen-notice";
import { cleanup, renderWithIntl } from "./helpers/render";

test.afterEach(() => cleanup());

test("narrow screen notice tells users to use a wider screen and links to FAQ", () => {
  const view = renderWithIntl(
    createElement(NarrowScreenNotice, {
      eyebrow: "Subtitle Editor",
      title: "Use a wider screen",
      description:
        "Subtitle editing needs room for video, timeline, and caption controls. Open this editor on a desktop, laptop, or tablet in landscape.",
      minimum: "Minimum recommended width: 1024px",
      faqHref: "/faq",
      faqLabel: "Frequently Asked Questions",
    }),
  );

  assert.equal(
    view.getByRole("heading", { name: "Use a wider screen" }).tagName,
    "H1",
  );
  view.getByText(
    "Subtitle editing needs room for video, timeline, and caption controls. Open this editor on a desktop, laptop, or tablet in landscape.",
  );
  view.getByText("Minimum recommended width: 1024px");

  const link = view.getByRole("link", {
    name: "Frequently Asked Questions",
  });
  assert.equal(link.getAttribute("href"), "/faq");
});
```

Run:

```bash
npx tsx --test tests/narrow-screen-notice.test.ts
```

Expected before Step 1 is complete: FAIL because the component does not exist.

Expected after Step 1 is complete: PASS.

- [ ] **Step 3: Add localized copy**

Add this object to `messages/en.json`:

```json
"narrowScreen": {
  "title": "Use a wider screen",
  "description": "Subtitle editing needs room for video, timeline, and caption controls. Open this editor on a desktop, laptop, or tablet in landscape.",
  "minimum": "Minimum recommended width: {width}px",
  "loading": "Loading editor..."
}
```

Add this object to `messages/de.json`:

```json
"narrowScreen": {
  "title": "Verwende einen breiteren Bildschirm",
  "description": "Die Untertitelbearbeitung braucht Platz fuer Video, Zeitleiste und Untertitel-Steuerung. Oeffne diesen Editor auf einem Desktop, Laptop oder Tablet im Querformat.",
  "minimum": "Empfohlene Mindestbreite: {width}px",
  "loading": "Editor wird geladen..."
}
```

Add this object to `messages/pl.json`:

```json
"narrowScreen": {
  "title": "Uzyj szerszego ekranu",
  "description": "Edycja napisow wymaga miejsca na wideo, os czasu i kontrolki napisow. Otworz ten edytor na komputerze, laptopie albo tablecie w orientacji poziomej.",
  "minimum": "Zalecana minimalna szerokosc: {width}px",
  "loading": "Ladowanie edytora..."
}
```

Add this object to `messages/yue.json`:

```json
"narrowScreen": {
  "title": "請使用較闊嘅畫面",
  "description": "字幕編輯需要足夠空間顯示影片、時間軸同字幕控制。請喺桌面電腦、手提電腦，或者橫向平板打開呢個編輯器。",
  "minimum": "建議最少闊度：{width}px",
  "loading": "載入編輯器..."
}
```

Claude review question: the German and Polish strings above are ASCII-safe but less natural than the existing locale files. If locale quality matters, update them to native-quality strings before merging.

- [ ] **Step 4: Verify**

```bash
npx tsx --test tests/narrow-screen-notice.test.ts tests/locale-parity.test.ts
npm run lint
```

Expected:

- Notice test passes.
- Locale parity test passes.
- Lint passes.

- [ ] **Step 5: Commit**

```bash
git add components/editor/narrow-screen-notice.tsx messages/en.json messages/de.json messages/pl.json messages/yue.json tests/narrow-screen-notice.test.ts
git commit -m "feat: add narrow screen editor notice"
```

## Task 4: Add The Responsive Editor Entry

**Files:**

- Create: `components/editor/responsive-editor-entry.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Add the responsive client entry**

Create `components/editor/responsive-editor-entry.tsx`:

```tsx
"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  EDITOR_WIDE_VIEWPORT_QUERY,
  INITIAL_EDITOR_VIEWPORT_STATE,
  isWideEditorViewport,
  nextEditorViewportState,
  type EditorViewportState,
} from "./viewport";

type EditorAppComponent = ComponentType;

interface ResponsiveEditorEntryProps {
  loadingLabel: string;
}

export default function ResponsiveEditorEntry({
  loadingLabel,
}: ResponsiveEditorEntryProps) {
  const hasRequestedEditorRef = useRef(false);
  const [viewportState, setViewportState] = useState<EditorViewportState>(
    INITIAL_EDITOR_VIEWPORT_STATE,
  );
  const [EditorApp, setEditorApp] = useState<EditorAppComponent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEditor = () => {
      if (hasRequestedEditorRef.current) return;
      hasRequestedEditorRef.current = true;

      void import("./editor-app").then((module) => {
        if (!cancelled) {
          setEditorApp(() => module.default);
        }
      });
    };

    const updateViewport = () => {
      const nextIsWide = isWideEditorViewport(window);
      setViewportState((current) =>
        nextEditorViewportState(current, nextIsWide),
      );
      if (nextIsWide) {
        loadEditor();
      }
    };

    const media = window.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY);
    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => {
      cancelled = true;
      media.removeEventListener("change", updateViewport);
    };
  }, []);

  if (!viewportState.shouldMountEditor) {
    return null;
  }

  if (!EditorApp) {
    return (
      <div className="hidden min-h-screen items-center justify-center text-sm text-slate-600 dark:text-slate-300 editor:flex">
        {loadingLabel}
      </div>
    );
  }

  return (
    <div hidden={!viewportState.isWide} aria-hidden={!viewportState.isWide}>
      <EditorApp />
    </div>
  );
}
```

This intentionally keeps the editor mounted after it has loaded once. If a user rotates a tablet or resizes a desktop window below the threshold, the narrow-screen notice becomes visible while the editor tree remains mounted and hidden, preserving in-memory subtitle state.

- [ ] **Step 2: Render the notice and responsive editor together**

Replace `app/[locale]/page.tsx` with:

```tsx
import { NarrowScreenNotice } from "@/components/editor/narrow-screen-notice";
import ResponsiveEditorEntry from "@/components/editor/responsive-editor-entry";
import { EDITOR_MIN_WIDTH_PX } from "@/components/editor/viewport";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const narrowScreen = await getTranslations("narrowScreen");
  const navigation = await getTranslations("navigation");

  return (
    <>
      <NarrowScreenNotice
        eyebrow={navigation("title")}
        title={narrowScreen("title")}
        description={narrowScreen("description")}
        minimum={narrowScreen("minimum", { width: EDITOR_MIN_WIDTH_PX })}
        faqHref="/faq"
        faqLabel={navigation("faq")}
      />
      <ResponsiveEditorEntry loadingLabel={narrowScreen("loading")} />
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm test
npm run lint
npm run build
```

Expected:

- Tests pass.
- Lint passes.
- Build succeeds.
- The route is no longer a top-level `"use client"` page.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/page.tsx components/editor/responsive-editor-entry.tsx
git commit -m "feat: lazy load editor on wide screens"
```

## Task 5: Browser And Lighthouse Verification

**Files:**

- No source edits unless verification finds bugs.

- [ ] **Step 1: Run full local checks**

```bash
npm test
npm run format:check
npm run lint
npm run build
git diff --check
```

Expected:

- Tests pass.
- Formatting gate passes.
- Lint passes.
- Build succeeds.
- No whitespace errors.

- [ ] **Step 2: Start production locally**

```bash
npm run start -- --hostname 127.0.0.1 --port 3000
```

- [ ] **Step 3: Verify first-time narrow viewport behavior**

Open `http://127.0.0.1:3000/de` at `390x844`.

Expected:

- The narrow-screen notice is visible.
- The `/faq` link is visible and navigates correctly.
- The full editor UI is not visible.
- The editor app chunk is not requested on first-time narrow load.

- [ ] **Step 4: Verify wide viewport behavior**

Open `http://127.0.0.1:3000/de` at `1440x900`.

Expected:

- The editor loads.
- The narrow-screen notice is hidden.
- Loading subtitle and media controls are present.
- Existing editor interactions are not obviously regressed.

- [ ] **Step 5: Verify latch behavior and waveform redraw**

Create a temporary local audio file for the smoke check:

```bash
node - <<'NODE'
const fs = require("node:fs");
const sampleRate = 44100;
const seconds = 1;
const dataSize = sampleRate * seconds * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);
fs.writeFileSync("/tmp/subtitle-editor-smoke.wav", buffer);
NODE
```

At `1440x900`, load the editor, load `tests/fixtures/styled-sample-1.vtt` as the subtitle file, then load `/tmp/subtitle-editor-smoke.wav` as the media file.

Then resize below the threshold, then resize back above the threshold.

Expected:

- The editor is hidden while narrow.
- The narrow-screen notice is visible while narrow.
- The editor returns when the viewport is wide again.
- The in-memory editor state is still present after resizing back.
- The waveform/timeline area redraws with non-zero width after resizing back.
- Existing waveform regions remain visible and aligned with the loaded subtitles.

If the waveform appears blank, zero-width, or misaligned after re-showing the editor, keep the latch but add a follow-up implementation step that triggers a WaveSurfer resize/redraw on `isWide: false -> true`.

- [ ] **Step 6: Measure desktop gate delay**

At `1440x900`, capture the post-change timing from navigation to usable editor controls.

Expected:

- The new timing is recorded against the Task 0 baseline.
- The blank-to-loading-to-editor transition is not visually jarring.
- If the delay is noticeable, add a follow-up task for an `editor:`-visible server-rendered skeleton rather than removing the gate.

- [ ] **Step 7: Run Lighthouse comparison**

Run local Lighthouse for one editor route:

```bash
npx --yes lighthouse@latest http://127.0.0.1:3000/de --preset=desktop --output=json --output-path=/tmp/subtitle-editor-de-desktop-after-gate.json --chrome-flags="--headless=new"
npx --yes lighthouse@latest http://127.0.0.1:3000/de --output=json --output-path=/tmp/subtitle-editor-de-mobile-after-gate.json --chrome-flags="--headless=new"
```

Expected:

- Desktop route remains functional and performant.
- Mobile route reports the narrow-screen notice as the main content.
- First-time mobile route no longer pays for the full editor bundle.

If Lighthouse still reports the missing `/sw.js` registration error, record it as evidence for the separate PWA investigation. Do not fix it in this PR.

- [ ] **Step 8: Commit only if verification caused source changes**

If no source changes are needed, do not create another commit.

## Separate Follow-Up Work

These are valid issues, but they should not be mixed into this mobile-gate PR:

- **PWA/service worker:** Decide whether to repair PWA generation for Next 16/OpenNext/Cloudflare or remove PWA support completely. Do not half-remove only the registrant.
- **Bulk-offset accessibility:** Add an `aria-label` to the bulk-offset button. This is a small accessibility PR or can be folded into an existing accessibility-focused PR.
- **CSS size:** Trim unused Radix palette imports after the gate lands.
- **Analytics:** Review GTM/Google Ads loading and third-party-cookie warnings separately.
- **Root redirect loop:** Investigate the local `next start` `/` and `/en` redirect loop separately from this feature.

## Discussion Questions For Claude

1. Is the latch behavior enough to protect in-memory edits on resize/rotation?
2. Does the waveform redraw correctly after `display:none -> visible`, or does it need an explicit WaveSurfer resize/redraw hook?
3. Is the desktop hydration/dynamic-import delay acceptable once measured?
4. Should the notice copy be rewritten by a native speaker for German and Polish before merge?

## Success Criteria

- Phones see an intentional prompt, not a cramped editor.
- The prompt links to `/faq`.
- Wide screens still get the current editor.
- First-time narrow screens do not download the full editor bundle.
- Resize/rotation after editor load does not unmount the editor or lose in-memory state.
- Waveform rendering is still correct after resize below and back above `1024px`.
- Desktop gate delay is measured against the pre-change baseline.
- The breakpoint is expressed as Tailwind `editor:` plus tested TypeScript constants.
- `/faq` and `/offline` remain unaffected.
- `npm test`, `npm run format:check`, `npm run lint`, `npm run build`, and `git diff --check` pass.
