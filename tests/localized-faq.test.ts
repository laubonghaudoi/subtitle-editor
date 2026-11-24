import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import de from "../app/[locale]/faq/copy/de";
import en from "../app/[locale]/faq/copy/en";
import pl from "../app/[locale]/faq/copy/pl";
import yue from "../app/[locale]/faq/copy/yue";
import { FaqDocument } from "../app/[locale]/faq/faq-document";
import {
  getPublicPath,
  getPublicUrl,
  localeConfig,
  locales,
} from "../lib/locales";

const copies = { de, en, pl, yue };

for (const locale of locales) {
  test(`the ${locale} FAQ publishes its visible answers and stable permalinks in JSON-LD`, () => {
    const content = copies[locale];
    const { document } = new JSDOM(
      renderToStaticMarkup(createElement(FaqDocument, { locale, content })),
    ).window;
    const canonical = getPublicUrl(locale, "faq");
    const json = document.querySelector(
      'script[type="application/ld+json"]',
    )?.textContent;
    assert.ok(json);
    const schema = JSON.parse(json);
    assert.equal(schema["@type"], "FAQPage");
    assert.equal(schema["@id"], canonical);
    assert.equal(schema.inLanguage, locale);
    assert.equal(schema.name, document.querySelector("h1")?.textContent);
    const sections = Array.from(document.querySelectorAll("section"));
    assert.deepEqual(
      sections.map((section) => section.getAttribute("aria-labelledby")),
      Object.keys(en.questions),
    );
    assert.deepEqual(
      schema.mainEntity,
      sections.map((section) => {
        const heading = section.querySelector("h2");
        const answer = section.querySelector("p")?.textContent;
        assert.ok(heading?.id);
        assert.ok(answer);
        assert.equal(
          heading.querySelector("a")?.getAttribute("href"),
          `#${heading.id}`,
        );
        return {
          "@type": "Question",
          "@id": `${canonical}#${heading.id}`,
          name: heading.textContent,
          acceptedAnswer: { "@type": "Answer", text: answer },
        };
      }),
    );
    const navigation = document.querySelector("nav");
    assert.ok(navigation);
    assert.equal(navigation.getAttribute("aria-label"), content.languageLabel);
    for (const language of locales) {
      const link: HTMLAnchorElement | null =
        navigation.querySelector<HTMLAnchorElement>(`a[lang="${language}"]`);
      assert.equal(link?.getAttribute("href"), getPublicPath(language, "faq"));
      assert.equal(link?.textContent, localeConfig[language].nativeName);
      assert.equal(
        link?.getAttribute("aria-current"),
        language === locale ? "page" : null,
      );
    }
  });
}
