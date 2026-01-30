import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";
import runtimeCaching from "next-pwa/cache";
import withPWAInit from "next-pwa";

const withNextIntl = createNextIntlPlugin();
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  skipWaiting: true,
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: {
    document: "/offline",
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
