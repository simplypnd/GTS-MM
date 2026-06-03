import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthHashErrorHandler } from "@/components/auth/AuthHashErrorHandler";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ThemeSync } from "@/components/theme/ThemeSync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "GTS MM | Secure Online Deals with MidMan",
    template: "%s | GTS MM",
  },
  description:
    "Secure buyer and seller deals in the Philippines with MidMan fund protection, QR Ph, and wallet withdrawals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PH" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <ThemeSync />
          <AuthHashErrorHandler />
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
