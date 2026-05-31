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

test("subtitle inline action buttons use compact tokenized utility styles", () => {
  assert.match(deleteButtonSource, /ring-1 ring-inset ring-red-800/);
  assert.match(deleteButtonSource, /bg-red-200/);
  assert.match(deleteButtonSource, /hover:bg-red-300/);
  assert.match(deleteButtonSource, /text-\[color:var\(--red-11\)\]/);

  assert.match(mergeActionsSource, /ring-1 ring-inset ring-amber-700/);
  assert.match(mergeActionsSource, /bg-amber-200/);
  assert.match(mergeActionsSource, /hover:bg-amber-300/);
  assert.match(mergeActionsSource, /text-\[color:var\(--amber-11\)\]/);

  assert.match(mergeActionsSource, /ring-1 ring-inset ring-green-800/);
  assert.match(mergeActionsSource, /bg-green-200/);
  assert.match(mergeActionsSource, /hover:bg-green-300/);
  assert.match(mergeActionsSource, /text-\[color:var\(--green-11\)\]/);

  assert.match(mergeActionsSource, /ring-1 ring-inset ring-slate-700/);
  assert.match(mergeActionsSource, /bg-slate-200/);
  assert.match(mergeActionsSource, /text-slate-900/);

  assert.doesNotMatch(mergeActionsSource, /bg-\[#fff3c4\]|bg-\[#e6f6eb\]/);
  assert.doesNotMatch(mergeActionsSource, /bg-grass-|text-grass-/);
  assert.doesNotMatch(deleteButtonSource, /bg-\[#feebec\]/);
});
