import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsLoader from "@/components/analytics-loader";
import WebVitalsReporter from "@/components/web-vitals-reporter";
import ServiceWorkerRegister from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import enMessages from "@/messages/en.json";
import "./globals.css";

const EN_FALLBACK_DESCRIPTION = enMessages.metadata.description;
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://subtitle-editor.org"),
  applicationName: "Subtitle Editor",
  title: {
    template: "%s | Subtitle Editor", // Page title will replace %s
    default:
      "Subtitle Editor - Permanently Free, Open-source, Fully Web-based SRT Editing Tool", // Default title for root layout
  },
  description: EN_FALLBACK_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/badge-cc.svg", type: "image/svg+xml" },
      { url: "/badge-cc.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-apple-180.png", sizes: "180x180" }],
    shortcut: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Subtitle Editor",
  },
  formatDetection: {
    telephone: false,
  },
  // Add Open Graph tags
  openGraph: {
    // title: Will use title.default or template from above
    // description: Will use the main description from above
    url: "https://subtitle-editor.org",
    siteName: "Subtitle Editor",
    images: [
      {
        url: "/badge-cc.svg", // Placeholder - recommend replacing with PNG/JPG 1200x630 later
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="description" content={EN_FALLBACK_DESCRIPTION} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <Toaster />
          <WebVitalsReporter />
          <ServiceWorkerRegister />
          <AnalyticsLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
