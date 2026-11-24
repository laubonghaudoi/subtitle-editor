import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsLoader from "@/components/analytics-loader";
import ServiceWorkerRegister from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Locale } from "@/lib/locales";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function SiteDocument({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main id="main-content" className="min-h-screen" data-locale={locale}>
            {children}
          </main>
          <Toaster />
          <ServiceWorkerRegister />
          <AnalyticsLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
