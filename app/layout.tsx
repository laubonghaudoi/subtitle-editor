import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import WebVitalsReporter from "@/components/web-vitals-reporter";
import ServiceWorkerRegister from "@/components/service-worker-register";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import "./globals.css";
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
  description:
    "Edit, create, and align SRT subtitle and captions files easily with this free, open-source, web-based editor. Features video preview and waveform visualization. No signup required.",
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
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <WebVitalsReporter />
        <ServiceWorkerRegister />
        {/* Google Ads Tag */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-10839665138"
        />
        <Script id="google-ads-script" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-10839665138');
          `}
        </Script>
        <Script
          strategy="afterInteractive"
          src="https://cloud.umami.is/script.js"
          data-website-id="505c9992-e14c-483a-aa4c-542fb097c809"
        />
      </body>
    </html>
  );
}
