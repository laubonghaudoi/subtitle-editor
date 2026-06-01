import test from "node:test";
import assert from "node:assert/strict";
import { flattenKeys, loadCatalog } from "./helpers/locale-keys";

const LOCALES = ["en", "yue", "de", "pl"] as const;
type Locale = (typeof LOCALES)[number];

const PENDING_PR_48: Partial<Record<Locale, Set<string>>> = {
  yue: new Set([
    "waveform.instructions",
    "waveform.keyboardHint",
    "waveform.regionSummary",
    "waveform.regionAnnouncement",
    "waveform.untitledTrack",
  ]),
};

test("locale catalogs match en object keys while treating arrays as leaves", () => {
  const en = new Set(flattenKeys(loadCatalog("en")));
  for (const locale of LOCALES.filter(
    (value): value is Locale => value !== "en",
  )) {
    const keys = new Set(flattenKeys(loadCatalog(locale)));
    const allow = PENDING_PR_48[locale] ?? new Set<string>();
    const missing = [...en].filter((key) => !keys.has(key) && !allow.has(key));
    const extra = [...keys].filter((key) => !en.has(key));

    assert.deepEqual(missing, [], `${locale} missing: ${missing.join(", ")}`);
    assert.deepEqual(extra, [], `${locale} extra: ${extra.join(", ")}`);
  }
});
