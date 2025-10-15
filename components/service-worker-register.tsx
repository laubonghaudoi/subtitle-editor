"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";

declare global {
  interface Window {
    workbox?: {
      register: (options?: { immediate?: boolean }) => Promise<unknown>;
    };
  }
}

const registerServiceWorker = async () => {
  try {
    if (typeof window !== "undefined" && window.workbox) {
      await window.workbox.register();
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const registration = await navigator.serviceWorker.register(
      SERVICE_WORKER_URL,
    );
    registration.update().catch((error) => {
      console.warn("[pwa] Unable to update service worker", error);
    });
  } catch (error) {
    console.error("[pwa] Service worker registration failed", error);
  }
};

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleLoad = () => {
      void registerServiceWorker();
    };

    if (document.readyState === "complete") {
      handleLoad();
      return;
    }

    window.addEventListener("load", handleLoad);
    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  return null;
}
