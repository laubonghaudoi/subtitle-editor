import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import SubtitleItemDeleteButton from "../components/subtitle/subtitle-item-delete-button";
import SubtitleItemMergeActions from "../components/subtitle/subtitle-item-merge-actions";
import type { Subtitle } from "../types/subtitle";
import { cleanup, fireEvent, renderWithIntl } from "./helpers/render";

const subtitle: Subtitle = {
  uuid: "s1",
  id: 1,
  startTime: "00:00:00,000",
  endTime: "00:00:02,000",
  text: "First",
};

const nextSubtitle: Subtitle = {
  uuid: "s2",
  id: 2,
  startTime: "00:00:03,000",
  endTime: "00:00:05,000",
  text: "Second",
};

test.afterEach(() => cleanup());

test("subtitle delete button invokes the delete action", () => {
  let deleteCount = 0;
  const view = renderWithIntl(
    createElement(
      TooltipProvider,
      null,
      createElement(SubtitleItemDeleteButton, {
        onDelete: () => {
          deleteCount += 1;
        },
      }),
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Delete" }));

  assert.equal(deleteCount, 1);
});

test("subtitle merge actions invoke merge and add actions when there is room", () => {
  const merges: Array<[number, number]> = [];
  const adds: Array<[number, number | null, string]> = [];

  const view = renderWithIntl(
    createElement(
      TooltipProvider,
      null,
      createElement(SubtitleItemMergeActions, {
        subtitle,
        nextSubtitle,
        isLastItem: false,
        nextStartSeconds: 3,
        endSeconds: 2,
        onMerge: (currentId, nextId) => merges.push([currentId, nextId]),
        onAdd: (currentId, nextId, text) =>
          adds.push([currentId, nextId, text]),
      }),
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Merge" }));
  fireEvent.click(view.getByRole("button", { name: "Add" }));

  assert.deepEqual(merges, [[1, 2]]);
  assert.deepEqual(adds, [[1, 2, "New subtitle"]]);
});

test("subtitle add action is disabled when adjacent subtitles leave no room", () => {
  const view = renderWithIntl(
    createElement(
      TooltipProvider,
      null,
      createElement(SubtitleItemMergeActions, {
        subtitle,
        nextSubtitle,
        isLastItem: false,
        nextStartSeconds: 2.0005,
        endSeconds: 2,
        onMerge: () => undefined,
        onAdd: () => {
          throw new Error("add should not run");
        },
      }),
    ),
  );

  assert.equal(
    (view.getByRole("button", { name: "No room to add" }) as HTMLButtonElement)
      .disabled,
    true,
  );
});
