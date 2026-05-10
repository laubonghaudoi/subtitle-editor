import test from "node:test";
import assert from "node:assert/strict";

import {
  applySubtitleSelectionInteraction,
  pruneSubtitleSelection,
} from "../lib/subtitle-selection";

const orderedUuids = ["s1", "s2", "s3", "s4"];

test("plain click selects one subtitle and sets the anchor", () => {
  const result = applySubtitleSelectionInteraction({
    orderedUuids,
    selectedUuids: new Set(["s1", "s2"]),
    anchorUuid: "s1",
    targetUuid: "s3",
  });

  assert.deepEqual(Array.from(result.selectedUuids), ["s3"]);
  assert.equal(result.anchorUuid, "s3");
});

test("cmd or ctrl click toggles one subtitle and sets the anchor", () => {
  const selected = applySubtitleSelectionInteraction({
    orderedUuids,
    selectedUuids: new Set(["s1"]),
    anchorUuid: "s1",
    targetUuid: "s3",
    modifiers: { ctrlKey: true },
  });

  assert.deepEqual(Array.from(selected.selectedUuids), ["s1", "s3"]);
  assert.equal(selected.anchorUuid, "s3");

  const deselected = applySubtitleSelectionInteraction({
    orderedUuids,
    selectedUuids: selected.selectedUuids,
    anchorUuid: selected.anchorUuid,
    targetUuid: "s1",
    modifiers: { metaKey: true },
  });

  assert.deepEqual(Array.from(deselected.selectedUuids), ["s3"]);
  assert.equal(deselected.anchorUuid, "s1");
});

test("shift click replaces selection with an anchor range", () => {
  const result = applySubtitleSelectionInteraction({
    orderedUuids,
    selectedUuids: new Set(["s4"]),
    anchorUuid: "s2",
    targetUuid: "s4",
    modifiers: { shiftKey: true, ctrlKey: true },
  });

  assert.deepEqual(Array.from(result.selectedUuids), ["s2", "s3", "s4"]);
  assert.equal(result.anchorUuid, "s2");
});

test("pruneSubtitleSelection removes unavailable selected and anchor UUIDs", () => {
  const result = pruneSubtitleSelection(
    new Set(["s1", "s3", "missing"]),
    "missing",
    ["s1", "s2", "s3"],
  );

  assert.deepEqual(Array.from(result.selectedUuids), ["s1", "s3"]);
  assert.equal(result.anchorUuid, null);
});
