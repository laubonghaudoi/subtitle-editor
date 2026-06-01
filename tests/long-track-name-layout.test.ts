import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const saveSrtSource = readFileSync(
  "components/app-header/save-srt.tsx",
  "utf8",
);
const findReplaceSource = readFileSync(
  "components/find-replace/index.tsx",
  "utf8",
);

test("save dialog constrains long track names without pushing export buttons", () => {
  assert.match(
    saveSrtSource,
    /className="grid gap-3 sm:grid-cols-\[minmax\(0,1fr\)_auto\] sm:items-center pl-4"/,
  );
  assert.match(saveSrtSource, /<div className="min-w-0">/);
  assert.match(
    saveSrtSource,
    /<span[\s\S]*className="block truncate font-medium"[\s\S]*title=\{track\.name\}/,
  );
  assert.match(
    saveSrtSource,
    /<div className="flex flex-wrap gap-2 sm:justify-end">/,
  );
  assert.doesNotMatch(
    saveSrtSource,
    /className="flex items-center justify-between pl-4"/,
  );
});

test("find and replace dialog wraps long track names inside the dialog", () => {
  assert.match(findReplaceSource, /<DialogHeader className="min-w-0">/);
  assert.match(
    findReplaceSource,
    /<DialogTitle className="min-w-0 leading-tight break-words">/,
  );
  assert.match(findReplaceSource, /className="flex min-w-0 flex-col gap-4"/);
  assert.match(
    findReplaceSource,
    /className="min-w-0 flex-1 rounded-\[2px\] px-2 py-1"/,
  );
});
