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
