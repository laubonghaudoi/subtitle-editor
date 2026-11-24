import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  getPublicPath,
  getPublicUrl,
  locales,
  type PublicPage,
} from "../lib/locales";
import { getPageMetadata } from "../lib/seo";

test("indexable routes have reciprocal language links, canonical URLs and social previews", () => {
  const origin = "https://subtitle-editor.org";
  const expectedUrls = new Set<string>();
  for (const page of ["editor", "faq"] satisfies PublicPage[]) {
    const suffix = page === "faq" ? "/faq" : "";
    const english = origin + (suffix || "/");
    const languages = {
      en: english,
      de: `${origin}/de${suffix}`,
      pl: `${origin}/pl${suffix}`,
      "zh-Hant-HK": `${origin}/yue${suffix}`,
      "x-default": english,
    };

    for (const locale of locales) {
      const canonical = languages[locale === "yue" ? "zh-Hant-HK" : locale];
      expectedUrls.add(canonical);
      const title = `${locale} ${page}`;
      const description = `${locale} description`;
      const metadata = getPageMetadata(locale, page, { title, description });
      assert.equal(getPublicUrl(locale, page), canonical);
      assert.equal(getPublicPath(locale, page), new URL(canonical).pathname);
      assert.deepEqual(metadata.alternates, { canonical, languages });
      assert.equal(metadata.title, title);
      assert.equal(metadata.description, description);
      assert.equal(metadata.openGraph?.url, canonical);
      assert.equal(metadata.twitter?.title, title);
    }
  }

  const entries = sitemap();
  assert.deepEqual(
    entries.map(({ url }) => url).sort(),
    [...expectedUrls].sort(),
  );
  for (const { url, alternates } of entries) {
    assert.ok(Object.values(alternates?.languages ?? {}).includes(url));
    assert.equal(Object.keys(alternates?.languages ?? {}).length, 5);
  }
});
