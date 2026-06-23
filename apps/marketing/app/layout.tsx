import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { WaitlistProvider } from "@/components/WaitlistProvider";
import { SITE } from "@/lib/content";
import "./globals.css";
import "./marketing.css";
import "./screenshot-v1.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        style={{
          fontFamily: "var(--font-body-loaded), var(--olimpia-font-body)",
        }}
      >
        <WaitlistProvider>{children}</WaitlistProvider>
      </body>
    </html>
  );
}
