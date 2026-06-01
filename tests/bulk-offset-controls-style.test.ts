import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const controlsSource = readFileSync(
  "components/bulk-offset/controls.tsx",
  "utf8",
);

test("bulk offset active target button uses black text on the active track color", () => {
  const activeStyleMatch = controlsSource.match(
    /const activeToggleStyle: CSSProperties = \{[\s\S]*?\n  \};/,
  );

  assert.ok(activeStyleMatch);
  const [activeToggleStyleSource] = activeStyleMatch;
  // Black on the bright track quartet is >=7.6:1; white was 1.5–2.8:1 (fails AA)
  assert.match(activeToggleStyleSource, /color:\s*"#000"/);
  assert.doesNotMatch(activeToggleStyleSource, /color:\s*"#fff"/);
});

test("bulk offset apply button uses black text on the active track color", () => {
  const applyButtonMatch = controlsSource.match(
    /onClick=\{onApply\}[\s\S]*?style=\{\{[\s\S]*?\}\}/,
  );

  assert.ok(applyButtonMatch);
  const [applyButtonSource] = applyButtonMatch;
  assert.match(applyButtonSource, /color:\s*"#000"/);
  assert.doesNotMatch(applyButtonSource, /color:\s*"#fff"/);
});

test("bulk offset numeric value uses the AA track ink color and bold weight", () => {
  const offsetInputMatch = controlsSource.match(
    /value=\{formattedOffset\}[\s\S]*?aria-label=\{t\("bulkOffset\.offsetInputLabel"\)\}/,
  );

  assert.ok(offsetInputMatch);
  const [offsetInputSource] = offsetInputMatch;
  assert.match(offsetInputSource, /font-bold/);
  // inkColor is the darkened, AA-compliant per-track text color (raw track
  // color as text was only ~1.5:1 on white).
  assert.match(offsetInputSource, /style=\{\{\s*color:\s*inkColor\s*\}\}/);
});
