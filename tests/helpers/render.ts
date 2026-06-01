import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
} from "react";
import { JSDOM } from "jsdom";
import messages from "../../messages/en.json";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
const { window } = dom;

globalThis.window = window as unknown as typeof globalThis.window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", {
  value: window.navigator,
  configurable: true,
});
globalThis.HTMLElement = window.HTMLElement;
globalThis.SVGElement = window.SVGElement;
globalThis.MutationObserver =
  window.MutationObserver ??
  class {
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
  };
globalThis.ResizeObserver =
  window.ResizeObserver ??
  class {
    disconnect() {}
    observe() {}
    unobserve() {}
  };
globalThis.PointerEvent = window.PointerEvent ?? window.MouseEvent;
globalThis.requestAnimationFrame =
  window.requestAnimationFrame ??
  ((cb: FrameRequestCallback) => setTimeout(cb, 0));
globalThis.cancelAnimationFrame =
  window.cancelAnimationFrame ?? ((id: number) => clearTimeout(id));
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TestIntlProvider = NextIntlClientProvider as ComponentType<
  Omit<ComponentProps<typeof NextIntlClientProvider>, "children">
>;

export const renderWithIntl = (ui: ReactElement) =>
  render(
    createElement(
      TestIntlProvider,
      { locale: "en", messages, timeZone: "UTC" },
      ui,
    ),
  );

export { cleanup, fireEvent, within };
