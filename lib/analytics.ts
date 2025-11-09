import { onCLS, onINP, onFCP, onLCP, onTTFB } from "web-vitals";

type UmamiClient = {
  track: (event: string, payload?: Record<string, unknown>) => void;
};

const getUmamiClient = (): UmamiClient | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as Window & { umami?: unknown }).umami;
  if (
    candidate &&
    typeof candidate === "object" &&
    "track" in candidate &&
    typeof (candidate as { track?: unknown }).track === "function"
  ) {
    return candidate as UmamiClient;
  }

  return null;
};

export function reportWebVitals() {
  onCLS(console.log);
  onINP(console.log); // INP replaced FID
  onFCP(console.log);
  onLCP(console.log);
  onTTFB(console.log);

  // You can also send these to your analytics service
  // Example with your existing umami setup:
  const umami = getUmamiClient();
  if (umami) {
    onCLS(({ name, value }) => {
      umami.track("web-vital", { metric: name, value });
    });
    onINP(({ name, value }) => {
      umami.track("web-vital", { metric: name, value });
    });
    onFCP(({ name, value }) => {
      umami.track("web-vital", { metric: name, value });
    });
    onLCP(({ name, value }) => {
      umami.track("web-vital", { metric: name, value });
    });
    onTTFB(({ name, value }) => {
      umami.track("web-vital", { metric: name, value });
    });
  }
}
