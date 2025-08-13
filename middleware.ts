import { NextRequest, NextResponse } from 'next/server';

const CHINESE_LOCALE = 'zh-hant';

function detectChinese(acceptLanguage: string | null): boolean {
  if (!acceptLanguage) return false;
  const lower = acceptLanguage.toLowerCase();
  return lower.includes('zh-hant') || lower.includes('zh-tw') || lower.includes('zh-hk') || lower.startsWith('zh');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always redirect /zh-hant/faq to /faq
  if (pathname.startsWith(`/${CHINESE_LOCALE}/faq`)) {
    const url = req.nextUrl.clone();
    url.pathname = '/faq';
    return NextResponse.redirect(url);
  }

  // Only auto-detect language on root path
  if (pathname === '/') {
    const accept = req.headers.get('accept-language');
    if (detectChinese(accept)) {
      const url = req.nextUrl.clone();
      url.pathname = `/${CHINESE_LOCALE}`;
      const res = NextResponse.redirect(url);
      res.cookies.set('NEXT_LOCALE', CHINESE_LOCALE);
      return res;
    }
  }

  const res = NextResponse.next();
  if (pathname.startsWith(`/${CHINESE_LOCALE}`)) {
    res.cookies.set('NEXT_LOCALE', CHINESE_LOCALE);
  } else {
    res.cookies.set('NEXT_LOCALE', 'en');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
