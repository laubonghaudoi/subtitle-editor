import type { NextConfig } from "next";
import withPWAInit, { runtimeCaching } from "@ducanh2912/next-pwa";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";

const subtitleFontSubset = /\/PlangothicP[12]-[^/]+\.woff2$/;
const withNextIntl = createNextIntlPlugin();
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  // Cloudflare consumes _headers as configuration, so it has no public URL.
  publicExcludes: ["!_headers", "!noprecache/**/*"],
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Let the font runtime cache store only the Unicode ranges the editor uses.
    exclude: [/middleware-manifest\.json$/, subtitleFontSubset],
    runtimeCaching: [
      {
        urlPattern: subtitleFontSubset,
        handler: "CacheFirst",
        options: {
          cacheName: "subtitle-fonts",
          expiration: { maxEntries: 256 },
        },
      },
      ...runtimeCaching,
    ],
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
