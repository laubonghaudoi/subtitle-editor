import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import de from "../messages/de.json";
import en from "../messages/en.json";
import pl from "../messages/pl.json";
import yue from "../messages/yue.json";

// Run against a production build so redirects, generated metadata and HTML are all exercised.
const preview = process.env.TEST_SITE_ORIGIN || "http://localhost:3000";
const publicOrigin = "https://subtitle-editor.org";
const versions = [
  {
    lang: "en",
    alternate: "en",
    editor: "/",
    faq: "/faq",
    messages: en,
    oldIntroLead: "Open an SRT or WebVTT file, edit the captions",
  },
  {
    lang: "de",
    alternate: "de",
    editor: "/de",
    faq: "/de/faq",
    messages: de,
    oldIntroLead:
      "Öffnen Sie eine SRT- oder WebVTT-Datei, bearbeiten Sie die Untertitel",
  },
  {
    lang: "pl",
    alternate: "pl",
    editor: "/pl",
    faq: "/pl/faq",
    messages: pl,
    oldIntroLead: "Otwórz plik SRT lub WebVTT, popraw napisy",
  },
  {
    lang: "yue",
    alternate: "zh-Hant-HK",
    editor: "/yue",
    faq: "/yue/faq",
    messages: yue,
    oldIntroLead: "開啟 SRT 或 WebVTT 字幕檔，改好字幕",
  },
];

function get(path: string) {
  return fetch(new URL(path, preview), { redirect: "manual" });
}

for (const version of versions) {
  for (const page of ["editor", "faq"] as const) {
    const path = version[page];
    test(`${path} serves localized content and reciprocal links without JavaScript`, async () => {
      const response = await get(path);
      assert.equal(response.status, 200);
      const { document } = new JSDOM(await response.text()).window;
      const canonical = publicOrigin + path;
      assert.equal(document.documentElement.lang, version.lang);
      assert.equal(document.querySelectorAll("h1").length, 1);
      assert.ok(document.querySelector("h1")?.textContent?.trim());
      const title = document.title;
      const description = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      )?.content;
      if (page === "editor") {
        const main = document.querySelector("main");
        assert.ok(main);
        assert.equal(
          main.querySelector("h1")?.textContent,
          version.messages.navigation.title,
        );
        assert.equal(title, version.messages.metadata.title);
        assert.equal(description, version.messages.metadata.description);
        for (const script of main.querySelectorAll("script")) script.remove();
        assert.ok(
          !main.textContent.includes(version.oldIntroLead),
          "The old introduction should be absent even in hidden elements",
        );
      } else {
        const paragraphs = Array.from(
          document.querySelectorAll("main p"),
          (p) => p.textContent,
        ).join(" ");
        assert.match(paragraphs, /SRT/i);
        assert.match(paragraphs, /VTT/i);
        assert.ok(title.trim());
        assert.ok(description?.trim());
      }
      assert.equal(
        document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
        canonical,
      );
      assert.equal(
        new URL(
          document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
            ?.content ?? "",
        ).href,
        canonical,
      );
      assert.doesNotMatch(
        document
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content") || "",
        /noindex|nosnippet/i,
      );

      const alternates = Object.fromEntries(
        Array.from(
          document.querySelectorAll<HTMLLinkElement>("link[hreflang]"),
          (link) => [link.hreflang, link.href],
        ),
      );
      const expected = Object.fromEntries(
        versions.map((v) => [v.alternate, publicOrigin + v[page]]),
      );
      assert.deepEqual(alternates, {
        ...expected,
        "x-default": publicOrigin + versions[0][page],
      });
      const otherPage = page === "editor" ? version.faq : version.editor;
      assert.ok(
        document.querySelector(`a[href="${otherPage}"]`),
        `Missing link to ${otherPage}`,
      );
    });
  }
}

test("the sitemap lists the eight canonical pages and the offline fallback stays out of search", async () => {
  const sitemapResponse = await get("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const { document } = new JSDOM(await sitemapResponse.text(), {
    contentType: "text/xml",
  }).window;
  const urls = Array.from(
    document.getElementsByTagName("loc"),
    (loc) => loc.textContent,
  );
  assert.deepEqual(
    urls.sort(),
    versions
      .flatMap((v) => [publicOrigin + v.editor, publicOrigin + v.faq])
      .sort(),
  );
  const robots = await get("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(
    await robots.text(),
    /Sitemap: https:\/\/subtitle-editor\.org\/sitemap\.xml/i,
  );
  const offline = await get("/offline");
  assert.equal(offline.status, 200);
  const offlinePage = new JSDOM(await offline.text()).window.document;
  assert.match(
    offlinePage.querySelector('meta[name="robots"]')?.getAttribute("content") ||
      "",
    /noindex/i,
  );
});

test("English aliases redirect to their canonical paths and unknown locales return 404", async () => {
  for (const [alias, target] of [
    ["/en", "/"],
    ["/en/faq", "/faq"],
  ]) {
    const response = await get(alias);
    assert.ok([301, 308].includes(response.status));
    const location = response.headers.get("location");
    assert.ok(location);
    assert.equal(new URL(location, preview).pathname, target);
  }
  for (const path of ["/fr", "/fr/faq", "/de/missing-page"]) {
    assert.equal((await get(path)).status, 404, path);
  }
});
