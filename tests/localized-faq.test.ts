import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import de from "../app/[locale]/faq/copy/de";
import en from "../app/[locale]/faq/copy/en";
import pl from "../app/[locale]/faq/copy/pl";
import yue from "../app/[locale]/faq/copy/yue";
import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import plMessages from "../messages/pl.json";
import yueMessages from "../messages/yue.json";
import { FaqDocument } from "../app/[locale]/faq/faq-document";
import {
  getPublicPath,
  getPublicUrl,
  localeConfig,
  locales,
} from "../lib/locales";

const copies = { de, en, pl, yue };
const messages = {
  de: deMessages,
  en: enMessages,
  pl: plMessages,
  yue: yueMessages,
};

for (const locale of locales) {
  test(`the ${locale} FAQ publishes its visible answers and stable permalinks in JSON-LD`, () => {
    const content = copies[locale];
    const { document } = new JSDOM(
      renderToStaticMarkup(
        createElement(FaqDocument, {
          locale,
          content,
          productTitle: messages[locale].navigation.title,
        }),
      ),
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
    assert.equal(
      document.querySelector("header span")?.textContent,
      messages[locale].navigation.title,
    );
    const jumpLinks = document.querySelectorAll(
      'nav[aria-labelledby="faq-title"] a',
    );
    assert.deepEqual(
      Array.from(jumpLinks, (a) => [a.getAttribute("href"), a.textContent]),
      Object.entries(content.questions).map(([id, topic]) => [
        `#${id}`,
        topic.question,
      ]),
    );
    const sections = Array.from(document.querySelectorAll("section"));
    assert.deepEqual(
      sections.map((section) => section.getAttribute("aria-labelledby")),
      Object.keys(en.questions),
    );
    assert.deepEqual(
      schema.mainEntity,
      sections.map((section) => {
        const heading = section.querySelector("h2");
        const answer = Array.from(
          section.querySelectorAll("p, li"),
          (line) => line.textContent,
        ).join("\n");
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

test("the English FAQ keeps the author's original questions and lists in order", () => {
  const { document } = new JSDOM(
    renderToStaticMarkup(
      createElement(FaqDocument, {
        locale: "en",
        content: en,
        productTitle: enMessages.navigation.title,
      }),
    ),
  ).window;
  assert.equal(
    document.querySelector("h1")?.textContent,
    "Frequently Asked Questions",
  );
  assert.deepEqual(
    Array.from(
      document.querySelectorAll("h2"),
      (heading) => heading.textContent,
    ),
    [
      "Why another subtitle editor?",
      "Will you actively maintain this app?",
      "Can you support more video / audio file formats?",
      "Have feedback?",
      "I need an AI transcriber / srt generator, any recommendations?",
      "I want to download a YouTube video and extract the subtitles of it, how?",
    ],
  );
  assert.deepEqual(
    Array.from(document.querySelectorAll("section ul, section ol"), (list) => [
      list.localName,
      list.children.length,
    ]),
    [
      ["ul", 4],
      ["ol", 6],
      ["ul", 6],
      ["ul", 3],
    ],
  );
});
