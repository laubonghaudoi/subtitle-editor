import test from "node:test";
import assert from "node:assert/strict";
import { isValidLocale, localeConfig, locales } from "../lib/locales";

test("Polish is available as a supported locale", () => {
  assert.ok(locales.includes("pl"));
  assert.equal(localeConfig.pl.name, "Polish");
  assert.equal(localeConfig.pl.nativeName, "Polski");
  assert.equal(localeConfig.pl.url, "https://subtitle-editor.org/pl");
  assert.equal(isValidLocale("pl"), true);
});
