import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const controlsSource = readFileSync("components/bulk-offset/controls.tsx", "utf8");

test("bulk offset active target button uses white text on the active track color", () => {
  const activeStyleMatch = controlsSource.match(
    /const activeToggleStyle: CSSProperties = \{[\s\S]*?\n  \};/,
  );

  assert.ok(activeStyleMatch);
  const [activeToggleStyleSource] = activeStyleMatch;
  assert.match(activeToggleStyleSource, /color:\s*"#fff"/);
  assert.doesNotMatch(activeToggleStyleSource, /color:\s*"#000"/);
});

test("bulk offset apply button uses white text on the active track color", () => {
  const applyButtonMatch = controlsSource.match(
    /onClick=\{onApply\}[\s\S]*?style=\{\{[\s\S]*?\}\}/,
  );

  assert.ok(applyButtonMatch);
  const [applyButtonSource] = applyButtonMatch;
  assert.match(applyButtonSource, /color:\s*"#fff"/);
  assert.doesNotMatch(applyButtonSource, /color:\s*"#000"/);
});
