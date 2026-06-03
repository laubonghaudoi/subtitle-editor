import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { NarrowScreenNotice } from "../components/editor/narrow-screen-notice";
import { cleanup, fireEvent, renderWithIntl } from "./helpers/render";

test.afterEach(() => cleanup());

test("narrow screen notice tells users to use a wider screen and links to FAQ", () => {
  let proceedCount = 0;
  const view = renderWithIntl(
    createElement(NarrowScreenNotice, {
      eyebrow: "Subtitle Editor",
      title: "Use a wider screen",
      description:
        "This editor is built for desktop-size screens. You can continue here, but video, timeline, and caption controls may be cramped or hard to use.",
      minimum: "Minimum recommended width: 1024px",
      faqHref: "/faq",
      faqLabel: "Frequently Asked Questions",
      proceedLabel: "Proceed anyway",
      onProceed: () => {
        proceedCount += 1;
      },
    }),
  );

  assert.equal(
    view.getByRole("heading", { name: "Use a wider screen" }).tagName,
    "H1",
  );
  view.getByText(
    "This editor is built for desktop-size screens. You can continue here, but video, timeline, and caption controls may be cramped or hard to use.",
  );
  view.getByText("Minimum recommended width: 1024px");

  const proceedButton = view.getByRole("button", { name: "Proceed anyway" });
  fireEvent.click(proceedButton);
  assert.equal(proceedCount, 1);

  const link = view.getByRole("link", {
    name: "Frequently Asked Questions",
  });
  assert.equal(link.getAttribute("href"), "/faq");
});

test("narrow screen notice uses monochrome colors", () => {
  const view = renderWithIntl(
    createElement(NarrowScreenNotice, {
      eyebrow: "Subtitle Editor",
      title: "Use a wider screen",
      description:
        "This editor is built for desktop-size screens. You can continue here, but video, timeline, and caption controls may be cramped or hard to use.",
      minimum: "Minimum recommended width: 1024px",
      faqHref: "/faq",
      faqLabel: "Frequently Asked Questions",
      proceedLabel: "Proceed anyway",
      onProceed: () => {},
    }),
  );

  const section = view.getByRole("region", { name: "Use a wider screen" });
  assert.match(section.className, /\bbg-white\b/);
  assert.match(section.className, /\btext-black\b/);
  assert.doesNotMatch(section.className, /slate|teal/);

  const proceedButton = view.getByRole("button", { name: "Proceed anyway" });
  assert.match(proceedButton.className, /\bbg-black\b/);
  assert.match(proceedButton.className, /\btext-white\b/);
  assert.doesNotMatch(proceedButton.className, /teal|slate/);

  const faqLink = view.getByRole("link", {
    name: "Frequently Asked Questions",
  });
  assert.match(faqLink.className, /\bborder-black\b/);
  assert.match(faqLink.className, /\btext-black\b/);
  assert.doesNotMatch(faqLink.className, /teal|slate/);
});
