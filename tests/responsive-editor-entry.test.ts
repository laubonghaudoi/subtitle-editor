import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import ResponsiveEditorEntry from "../components/editor/responsive-editor-entry";
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
  eyebrow: "Subtitle Editor",
  title: "Use a wider screen",
  description:
    "This editor is built for desktop-size screens. You can continue here, but video, timeline, and caption controls may be cramped or hard to use.",
  minimum: "Minimum recommended width: 1024px",
  faqHref: "/faq",
  faqLabel: "Frequently Asked Questions",
  proceedLabel: "Proceed anyway",
};

function TestEditor() {
  return createElement(
    "main",
    { "aria-label": "Loaded editor" },
    "Loaded editor",
  );
}

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => {
      assert.equal(query, EDITOR_WIDE_VIEWPORT_QUERY);
      return {
        matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as MediaQueryList;
    },
  });
}

test("narrow entry waits for proceed before loading the editor", async () => {
  installMatchMedia(false);
  let loadCount = 0;

  const view = renderWithIntl(
    createElement(ResponsiveEditorEntry, {
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

test("wide entry loads the editor without the warning", async () => {
  installMatchMedia(true);
  let loadCount = 0;

  const view = renderWithIntl(
    createElement(ResponsiveEditorEntry, {
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
