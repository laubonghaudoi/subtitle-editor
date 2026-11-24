import test from "node:test";
import assert from "node:assert/strict";
import { act, createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import ResponsiveEditorEntry, {
  type EditorAppProps,
} from "../components/editor/responsive-editor-entry";
import {
  EDITOR_WIDE_VIEWPORT_QUERY,
  NARROW_SCREEN_PROCEED_SESSION_KEY,
} from "../components/editor/viewport";
import { cleanup, fireEvent, renderWithIntl } from "./helpers/render";

test.afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

const narrowScreenNotice = {
  title: "Use a wider screen",
  description:
    "This editor is built for desktop-size screens. You can continue here, but video, timeline, and caption controls may be cramped or hard to use.",
  minimum: "Minimum recommended width: 1024px",
  faqHref: "/faq",
  faqLabel: "Frequently Asked Questions",
  proceedLabel: "Proceed anyway",
};

const introduction = createElement(
  "header",
  null,
  createElement("h1", null, "Online SRT and VTT subtitle editor"),
  createElement("a", { href: "/faq#sync-subtitles" }, "Sync subtitles"),
);

function TestEditor({ introduction }: EditorAppProps) {
  return createElement(
    "main",
    { "aria-label": "Loaded editor" },
    introduction,
    createElement("p", null, "Loaded editor"),
    createElement("input", { "aria-label": "Draft" }),
  );
}

function installMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => {
      assert.equal(query, EDITOR_WIDE_VIEWPORT_QUERY);
      return {
        matches,
        media: query,
        addEventListener: (_event: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) =>
          listeners.delete(listener),
      } as unknown as MediaQueryList;
    },
  });
  return (newMatches: boolean) => {
    matches = newMatches;
    act(() => {
      for (const listener of listeners) listener();
    });
  };
}

test("server renders one product heading and contextual help before the narrow-screen warning", () => {
  const markup = renderToString(
    createElement(ResponsiveEditorEntry, {
      introduction,
      loadingLabel: "Loading editor...",
      narrowScreenNotice,
    }),
  );
  const entry = document.createElement("div");
  entry.innerHTML = markup;
  assert.equal(entry.querySelectorAll("h1").length, 1);
  assert.equal(
    entry.querySelector("h1")?.textContent,
    "Online SRT and VTT subtitle editor",
  );
  assert.equal(
    entry.querySelector("a")?.getAttribute("href"),
    "/faq#sync-subtitles",
  );
  assert.equal(entry.querySelector("h2")?.textContent, "Use a wider screen");
});

test("narrow entry waits for proceed before loading the editor", async () => {
  installMatchMedia(false);
  let loadCount = 0;

  const view = renderWithIntl(
    createElement(ResponsiveEditorEntry, {
      introduction,
      loadingLabel: "Loading editor...",
      narrowScreenNotice,
      loadEditor: async () => {
        loadCount += 1;
        return { default: TestEditor };
      },
    }),
  );

  view.getByRole("heading", { name: "Use a wider screen" });
  assert.equal(loadCount, 0);
  assert.equal(view.queryByText("Loaded editor"), null);

  fireEvent.click(view.getByRole("button", { name: "Proceed anyway" }));

  assert.equal(
    window.sessionStorage.getItem(NARROW_SCREEN_PROCEED_SESSION_KEY),
    "true",
  );
  await view.findByText("Loaded editor");
  assert.equal(loadCount, 1);
  assert.equal(
    view.queryByRole("heading", { name: "Use a wider screen" }),
    null,
  );
});

test("narrow entry honors proceed consent saved in this tab", async () => {
  installMatchMedia(false);
  window.sessionStorage.setItem(NARROW_SCREEN_PROCEED_SESSION_KEY, "true");
  let loadCount = 0;

  const view = renderWithIntl(
    createElement(ResponsiveEditorEntry, {
      introduction,
      loadingLabel: "Loading editor...",
      narrowScreenNotice,
      loadEditor: async () => {
        loadCount += 1;
        return { default: TestEditor };
      },
    }),
  );

  await view.findByText("Loaded editor");
  assert.equal(loadCount, 1);
  assert.equal(
    view.queryByRole("heading", { name: "Use a wider screen" }),
    null,
  );
});

test("strict mode loads the editor on desktop and resizes without losing edits", async () => {
  const resize = installMatchMedia(true);
  let loadCount = 0;

  const view = renderWithIntl(
    createElement(
      StrictMode,
      null,
      createElement(ResponsiveEditorEntry, {
        introduction,
        loadingLabel: "Loading editor...",
        narrowScreenNotice,
        loadEditor: async () => {
          loadCount += 1;
          return { default: TestEditor };
        },
      }),
    ),
  );

  await view.findByText("Loaded editor");
  assert.equal(loadCount, 1);
  assert.equal(
    view.queryByRole("heading", { name: "Use a wider screen" }),
    null,
  );
  const draft = view.getByRole("textbox", {
    name: "Draft",
  }) as HTMLInputElement;
  fireEvent.change(draft, { target: { value: "Work in progress" } });
  resize(false);
  view.getByRole("heading", { level: 2, name: "Use a wider screen" });
  assert.equal(view.queryByRole("textbox"), null);
  assert.equal(view.container.querySelectorAll("h1").length, 1);
  resize(true);
  assert.equal(view.getByRole("textbox"), draft);
  assert.equal(draft.value, "Work in progress");
  assert.equal(view.container.querySelectorAll("h1").length, 1);
  assert.equal(loadCount, 1);
});
