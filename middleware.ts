import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh-hant'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Disable automatic locale detection based on browser preferences
  localeDetection: false,

  // Always use prefix except for the default locale (English)
  // This means /en/... will redirect to /..., but /zh-hant/... stays as is
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames, but exclude FAQ page and other static assets
  matcher: ['/((?!_next|api|faq|.*\\..*).*)']
};