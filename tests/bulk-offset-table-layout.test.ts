import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tableSource = readFileSync("components/bulk-offset/table.tsx", "utf8");

const getSection = (source: string, start: string, end: string) => {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1);
  return source.slice(startIndex, endIndex + end.length);
};

test("bulk offset table stacks preview timing under original timing", () => {
  const theadSource = getSection(tableSource, "<thead", "</thead>");
  const headerRows = theadSource.match(/<tr[\s\S]*?<\/tr>/g) ?? [];

  assert.equal(headerRows.length, 2);
  assert.match(headerRows[0], /rowSpan=\{2\}[\s\S]*<Checkbox/);
  assert.match(headerRows[0], /rowSpan=\{2\}[\s\S]*bulkOffset\.table\.id/);
  assert.match(headerRows[0], /bulkOffset\.table\.start/);
  assert.match(headerRows[0], /bulkOffset\.table\.end/);
  assert.match(headerRows[0], /rowSpan=\{2\}[\s\S]*bulkOffset\.table\.text/);
  assert.doesNotMatch(headerRows[0], /border-b border-dashed/);
  assert.match(headerRows[0], /repeating-linear-gradient/);
  assert.match(headerRows[0], /aria-hidden="true"/);
  assert.equal((theadSource.match(/bg-background/g) ?? []).length, 8);
  assert.doesNotMatch(theadSource, /h-10/);
  assert.doesNotMatch(headerRows[0], /bulkOffset\.table\.previewStart/);
  assert.doesNotMatch(headerRows[0], /bulkOffset\.table\.previewEnd/);
  assert.match(headerRows[1], /bulkOffset\.table\.previewStart/);
  assert.match(headerRows[1], /bulkOffset\.table\.previewEnd/);
});

test("bulk offset table renders each subtitle as original and preview rows", () => {
  const bodySource = getSection(tableSource, "<tbody>", "</tbody>");

  assert.match(bodySource, /<Fragment key=\{subtitle\.uuid\}>\s*<tr/);
  assert.match(bodySource, /<td className="px-4 align-middle" rowSpan=\{2\}>/);
  assert.match(
    bodySource,
    /<td className="px-2 py-1 text-left text-sm" rowSpan=\{2\}>/,
  );
  assert.match(
    bodySource,
    /<td className="px-4 py-1 align-middle" rowSpan=\{2\}>/,
  );
  assert.match(bodySource, /subtitle\.startTime[\s\S]*subtitle\.endTime/);
  assert.match(bodySource, /preview\.previewStart[\s\S]*preview\.previewEnd/);
});
