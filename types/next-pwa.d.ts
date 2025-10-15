declare module "next-pwa/cache" {
  import type { RuntimeCaching } from "workbox-build";

  const runtimeCaching: RuntimeCaching[];
  export default runtimeCaching;
}

declare module "next-pwa" {
  import type { NextConfig } from "next";
  import type { RuntimeCaching } from "workbox-build";

  interface NextPWAOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCaching[];
    buildExcludes?: (RegExp | string)[];
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
    };
  }

  export default function withPWA(
    options?: NextPWAOptions,
  ): (nextConfig?: NextConfig) => NextConfig;
}
