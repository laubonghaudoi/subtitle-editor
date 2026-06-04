import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { BulkOffsetControls } from "../components/bulk-offset/controls";
import { cleanup, fireEvent, renderWithIntl } from "./helpers/render";

test.afterEach(() => cleanup());

test("bulk offset controls expose target state and emit offset changes", () => {
  const targetChanges: string[] = [];
  const offsetChanges: number[] = [];

  const view = renderWithIntl(
    createElement(BulkOffsetControls, {
      offsetSeconds: 0.123,
      onOffsetChange: (value) => offsetChanges.push(value),
      onApply: () => undefined,
      shiftTarget: "both",
      onShiftTargetChange: (target) => targetChanges.push(target),
      accentColor: "#facc15",
      inkColor: "#713f12",
    }),
  );

  assert.equal(
    view
      .getByRole("button", { name: "Whole subtitle" })
      .getAttribute("aria-pressed"),
    "true",
  );

  fireEvent.click(view.getByRole("button", { name: "Start time" }));
  fireEvent.click(
    view.getByRole("button", { name: "Increase offset by 1 second" }),
  );

  assert.deepEqual(targetChanges, ["start"]);
  assert.deepEqual(offsetChanges, [1.123]);
});
