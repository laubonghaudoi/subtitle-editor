import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mergeActionsSource = readFileSync(
  "components/subtitle/subtitle-item-merge-actions.tsx",
  "utf8",
);
const deleteButtonSource = readFileSync(
  "components/subtitle/subtitle-item-delete-button.tsx",
  "utf8",
);

test("subtitle inline action buttons use the original compact utility styles", () => {
  assert.match(deleteButtonSource, /bg-red-300/);
  assert.match(deleteButtonSource, /hover:bg-red-400/);
  assert.match(deleteButtonSource, /text-red-800/);
  assert.match(deleteButtonSource, /dark:bg-red-800/);
  assert.match(deleteButtonSource, /dark:text-red-300/);

  assert.match(mergeActionsSource, /bg-amber-200/);
  assert.match(mergeActionsSource, /hover:bg-amber-300/);
  assert.match(mergeActionsSource, /text-amber-800/);
  assert.match(mergeActionsSource, /dark:bg-amber-800/);
  assert.match(mergeActionsSource, /dark:text-amber-700/);

  assert.match(mergeActionsSource, /bg-grass-300/);
  assert.match(mergeActionsSource, /hover:bg-grass-400/);
  assert.match(mergeActionsSource, /text-grass-800/);
  assert.match(mergeActionsSource, /dark:bg-grass-800/);
  assert.match(mergeActionsSource, /dark:text-grass-300/);

  assert.match(mergeActionsSource, /bg-gray-200/);
  assert.match(mergeActionsSource, /text-gray-700/);
  assert.match(mergeActionsSource, /dark:bg-gray-700/);

  assert.doesNotMatch(mergeActionsSource, /bg-\[#fff3c4\]|bg-\[#e6f6eb\]/);
  assert.doesNotMatch(deleteButtonSource, /bg-\[#feebec\]/);
});
