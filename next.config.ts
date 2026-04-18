import type { NextConfig } from "next";
import withPWAInit, { runtimeCaching } from "@ducanh2912/next-pwa";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    exclude: [/middleware-manifest\.json$/],
    runtimeCaching,
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  reactCompiler: true,
};

if (process.env.NODE_ENV === "development") {
  // Allow `next dev` to expose local Cloudflare bindings (KV/R2/etc.)
  initOpenNextCloudflareForDev();
}

export default withPWA(withNextIntl(nextConfig));
