import createNextIntlPlugin from "next-intl/plugin";
import runtimeCaching from "next-pwa/cache";
import withPWAInit from "next-pwa";
import type { NextConfig } from "next";

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
  reactCompiler: true,
};

export default withPWA(withNextIntl(nextConfig));
