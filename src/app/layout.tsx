import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font; exposed as --font-geist for @theme.
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaasNow — Maastricht, tonight",
  description: "See where Maastricht is going tonight.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  // Matches the Standard map; page.tsx keeps it in sync with the chosen style.
  themeColor: "#f1eee7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
