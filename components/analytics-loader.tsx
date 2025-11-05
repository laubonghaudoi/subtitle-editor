"use client";

import { useEffect } from "react";

type PreconnectTarget = {
  href: string;
  crossOrigin?: string;
};

const GOOGLE_ADS_ID = "AW-10839665138";
const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "505c9992-e14c-483a-aa4c-542fb097c809";

const PRECONNECT_TARGETS: PreconnectTarget[] = [
  { href: "https://www.googletagmanager.com", crossOrigin: "anonymous" },
  { href: "https://www.google-analytics.com", crossOrigin: "anonymous" },
  { href: "https://www.google.com", crossOrigin: "anonymous" },
  { href: "https://googleads.g.doubleclick.net", crossOrigin: "anonymous" },
  { href: "https://cloud.umami.is", crossOrigin: "anonymous" },
  { href: "https://api-gateway.umami.dev", crossOrigin: "anonymous" },
];

const injectLink = ({ href, crossOrigin }: PreconnectTarget) => {
  if (!document.head || document.querySelector(`link[data-preconnect="${href}"]`)) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = href;
  link.dataset.preconnect = href;
  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }
  document.head.appendChild(link);
};

const injectScript = (
  src: string,
  options: { id?: string; async?: boolean; defer?: boolean; attributes?: Record<string, string> } = {},
) => {
  if (!document.head) return;
  if (options.id && document.getElementById(options.id)) return;
  const script = document.createElement("script");
  script.src = src;
  if (options.id) {
    script.id = options.id;
  }
  script.async = options.async ?? true;
  script.defer = options.defer ?? false;
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      script.setAttribute(key, value);
    }
  }
  document.head.appendChild(script);
};

const injectInlineScript = (id: string, body: string) => {
  if (!document.head || document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.textContent = body;
  document.head.appendChild(script);
};

export default function AnalyticsLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === "1") return;

    let hasLoaded = false;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    const triggerEvents = ["pointerdown", "keydown", "touchstart"] as const;
    const listenerOptions: AddEventListenerOptions = { once: true, passive: true };

    const scheduleCleanup = () => {
      const enhancedWindow = window as typeof window & {
        cancelIdleCallback?: (handle: number) => void;
      };
      if (idleHandle !== null && enhancedWindow.cancelIdleCallback) {
        enhancedWindow.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
      triggerEvents.forEach((event) => window.removeEventListener(event, onTrigger, listenerOptions));
    };

    const loadAnalytics = () => {
      if (hasLoaded) return;
      hasLoaded = true;

      PRECONNECT_TARGETS.forEach(injectLink);

      injectScript("https://www.googletagmanager.com/gtag/js?id=" + GOOGLE_ADS_ID, {
        id: "gtag-script",
        async: true,
      });

      injectInlineScript(
        "gtag-inline-script",
        `
if (!window.dataLayer) window.dataLayer = [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');
`.trim(),
      );

      injectScript(UMAMI_SCRIPT_SRC, {
        id: "umami-script",
        defer: true,
        attributes: {
          "data-website-id": UMAMI_WEBSITE_ID,
        },
      });
    };

    const onTrigger = () => {
      loadAnalytics();
      scheduleCleanup();
    };

    triggerEvents.forEach((event) =>
      window.addEventListener(event, onTrigger, listenerOptions),
    );

    const enhancedWindow = window as typeof window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
    };

    if (enhancedWindow.requestIdleCallback) {
      idleHandle = enhancedWindow.requestIdleCallback(
        () => {
          loadAnalytics();
          scheduleCleanup();
        },
        { timeout: 6000 },
      );
    } else {
      timeoutHandle = window.setTimeout(() => {
        loadAnalytics();
        scheduleCleanup();
      }, 6000);
    }

    return scheduleCleanup;
  }, []);

  return null;
}
