import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { BulkOffsetTable } from "../components/bulk-offset/table";
import type { Subtitle } from "../types/subtitle";
import { cleanup, fireEvent, renderWithIntl, within } from "./helpers/render";

const subtitles: Subtitle[] = [
  {
    uuid: "s1",
    id: 1,
    startTime: "00:00:00,000",
    endTime: "00:00:02,000",
    text: "First caption",
  },
  {
    uuid: "s2",
    id: 2,
    startTime: "00:00:03,000",
    endTime: "00:00:05,000",
    text: "",
  },
];

test.afterEach(() => cleanup());

test("bulk offset table renders original and preview rows with accessible selection", () => {
  const toggles: Array<[number, string, boolean, boolean]> = [];

  const view = renderWithIntl(
    createElement(BulkOffsetTable, {
      subtitles,
      previewSubtitles: [
        {
          previewStart: "00:00:01,000",
          previewEnd: "00:00:03,000",
          startChanged: true,
          endChanged: true,
        },
        {
          previewStart: "00:00:04,000",
          previewEnd: "00:00:06,000",
          startChanged: true,
          endChanged: true,
        },
      ],
      selectedUuids: new Set(["s1"]),
      onToggleRow: (index, uuid, shouldSelect, shiftKey) => {
        toggles.push([index, uuid, shouldSelect, shiftKey]);
      },
      onToggleAll: () => undefined,
      headerCheckboxState: false,
      trackColor: "#facc15",
      trackBackgroundColor: "rgba(250,204,21,0.2)",
      inkColor: "#713f12",
    }),
  );

  const table = view.getByRole("table");
  assert.equal(within(table).getAllByRole("row").length, 6);
  assert.ok(view.getByText("Start"));
  assert.ok(view.getByText("Preview start"));
  assert.ok(view.getByText("First caption"));
  assert.ok(view.getByText("Empty"));

  fireEvent.pointerDown(view.getByLabelText("Select caption 2"), {
    shiftKey: true,
  });
  fireEvent.click(view.getByLabelText("Select caption 2"));

  assert.deepEqual(toggles, [[1, "s2", true, true]]);
});
