import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeRegexSource,
  applyRegexReplacement,
  cloneRegex,
  collectMatches,
} from "../lib/find-replace-helpers";

test("collectMatches skips zero-length matches when not allowed", () => {
  const pattern = /係*/g;
  const matches = collectMatches("前文再續", pattern, false);
  assert.equal(matches.length, 0);
});

test("collectMatches returns zero-length matches when allowed", () => {
  const pattern = /係*/g;
  const matches = collectMatches("測試", pattern, true);
  assert.ok(matches.length > 0);
  assert.ok(matches.every((match) => match[0].length === 0));
});

test("cloneRegex can force global flag", () => {
  const original = /abc/;
  const cloned = cloneRegex(original, { forceGlobal: true });
  assert.ok(cloned);
  assert.equal(cloned?.flags.includes("g"), true);
  assert.equal(cloned?.source, original.source);
});

test("analyzeRegexSource detects zero-length enabling features", () => {
  const anchored = /^foo/;
  const wordBoundary = /\bbar/;
  const normal = /baz/;

  assert.equal(analyzeRegexSource(anchored).allowZeroLength, true);
  assert.equal(analyzeRegexSource(wordBoundary).allowZeroLength, true);
  assert.equal(analyzeRegexSource(normal).allowZeroLength, false);
});

test("applyRegexReplacement expands numbered and named captures", () => {
  const regex = /(?<greeting>hello) (world)/i;
  const { result, changed } = applyRegexReplacement(
    "Hello world!",
    regex,
    "$<greeting>, $2",
    false,
  );

  assert.equal(changed, true);
  assert.equal(result, "Hello, world!");
});

test("applyRegexReplacement ignores zero-length matches when disallowed", () => {
  const regex = /係*/g;
  const { result, changed } = applyRegexReplacement("前文", regex, "a", false);
  assert.equal(changed, false);
  assert.equal(result, "前文");
});

test("applyRegexReplacement handles zero-length matches when allowed", () => {
  const regex = /(?=,)/g;
  const { result, changed } = applyRegexReplacement(
    "one,two",
    regex,
    "|",
    true,
  );
  assert.equal(changed, true);
  assert.equal(result, "one|,two");
});
