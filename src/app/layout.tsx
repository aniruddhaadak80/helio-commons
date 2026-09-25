import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Helio Commons | Map the next compute frontier",
    template: "%s | Helio Commons",
  },
  description: "An evidence-first fieldbook for space compute and superintelligence bets.",
  keywords: ["space data centers", "Project Suncatcher", "AI futures", "superintelligence", "MCP", "research dashboard"],
  authors: [{ name: "Helio Commons" }],
  creator: "Helio Commons",
  openGraph: {
    type: "website",
    siteName: "Helio Commons",
    title: "Helio Commons | Map the next compute frontier",
    description: "Turn research signals into sealed, explainable flight plans.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helio Commons | Map the next compute frontier",
    description: "Turn research signals into sealed, explainable flight plans.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
        <footer className="footer">
          <div className="site-shell footer-inner">
            <span>HELIO COMMONS / FIELD MANUAL 01</span>
            <span>Planning aid, not certification · <Link href="/method">read the method <ArrowUpRight size={12} style={{ verticalAlign: "-2px" }} /></Link></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
