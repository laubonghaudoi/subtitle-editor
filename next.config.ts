import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  i18n: {
    locales: ["en", "zh-hant"],
    defaultLocale: "en",
    localeDetection: false,
  },
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
