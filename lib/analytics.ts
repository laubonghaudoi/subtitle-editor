import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onINP(console.log); // INP replaced FID
  onFCP(console.log);
  onLCP(console.log);
  onTTFB(console.log);
  
  // You can also send these to your analytics service
  // Example with your existing umami setup:
  if (typeof window !== 'undefined' && (window as any).umami) {
    onCLS(({ name, value }) => {
      (window as any).umami.track('web-vital', { metric: name, value });
    });
    onINP(({ name, value }) => {
      (window as any).umami.track('web-vital', { metric: name, value });
    });
    onFCP(({ name, value }) => {
      (window as any).umami.track('web-vital', { metric: name, value });
    });
    onLCP(({ name, value }) => {
      (window as any).umami.track('web-vital', { metric: name, value });
    });
    onTTFB(({ name, value }) => {
      (window as any).umami.track('web-vital', { metric: name, value });
    });
  }
}
