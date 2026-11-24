import type { Viewport } from "next";
import { siteMetadata } from "@/lib/seo";
import SiteDocument from "../site-document";

export const metadata = siteMetadata;
export const viewport: Viewport = { themeColor: "#0f172a" };

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
