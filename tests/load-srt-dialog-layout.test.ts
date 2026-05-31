import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const loadSrtSource = readFileSync("components/app-header/load-srt.tsx", "utf8");

test("load subtitle dialog gives localized file buttons more room than the subtitle count", () => {
  assert.match(
    loadSrtSource,
    /grid-cols-\[minmax\(5rem,0\.75fr\)_minmax\(0,1\.25fr\)\]/,
  );
  assert.match(loadSrtSource, /w-full min-w-0 p-0/);
  assert.match(loadSrtSource, /w-full min-w-0 border-2 border-black/);
  assert.match(loadSrtSource, /className="min-w-0 truncate"/);
  assert.doesNotMatch(loadSrtSource, /col-span-6 grid grid-cols-2 gap-2/);
});

test("load subtitle track delete button uses the shared red outlined delete style", () => {
  const deleteTriggerMatch = loadSrtSource.match(
    /<AlertDialogTrigger asChild>[\s\S]*?<Button[\s\S]*?>/,
  );

  assert.ok(deleteTriggerMatch);
  const [deleteTriggerSource] = deleteTriggerMatch;
  assert.match(deleteTriggerSource, /ring-1/);
  assert.match(deleteTriggerSource, /ring-inset/);
  assert.match(deleteTriggerSource, /ring-red-800/);
  assert.match(deleteTriggerSource, /bg-red-200/);
  assert.match(deleteTriggerSource, /hover:bg-red-300/);
  assert.match(deleteTriggerSource, /text-\[color:var\(--red-11\)\]/);
  assert.doesNotMatch(deleteTriggerSource, /bg-red-300 cursor-pointer/);
});
