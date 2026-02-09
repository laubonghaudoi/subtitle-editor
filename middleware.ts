import createMiddleware from "next-intl/middleware";
import { locales } from "@/lib/locales";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: "en",

  // Disable automatic locale detection based on browser preferences
  localeDetection: false,

  // Always use prefix except for the default locale (English)
  // This means /en/... will redirect to /..., but /yue/... stays as is
  localePrefix: "as-needed",
});

export const config = {
  // Match only internationalized pathnames, but exclude static utility routes/assets.
  matcher: ["/((?!_next|api|faq|offline|.*\\..*).*)"],
};
