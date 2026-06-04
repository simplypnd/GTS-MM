import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthHashErrorHandler } from "@/components/auth/AuthHashErrorHandler";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { createClient } from "@/lib/supabase/server";
import type { SessionProfile, ThemePreference } from "@/lib/types/database";
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

async function loadSessionProfile(
  userId: string
): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, is_mediator, is_admin, theme_preference")
    .eq("id", userId)
    .single();

  if (!data) return null;

  const theme = data.theme_preference as ThemePreference | null;
  return {
    display_name: data.display_name ?? null,
    is_mediator: !!data.is_mediator,
    is_admin: !!data.is_admin,
    theme_preference:
      theme === "light" || theme === "dark" ? theme : null,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionProfile = user ? await loadSessionProfile(user.id) : null;

  return (
    <html lang="en-PH" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <ThemeSync
            initialThemePreference={sessionProfile?.theme_preference ?? null}
          />
          <AuthHashErrorHandler />
          <Navbar
            initialUserId={user?.id ?? null}
            initialDisplayName={sessionProfile?.display_name ?? null}
            initialIsMediator={sessionProfile?.is_mediator ?? false}
            initialIsAdmin={sessionProfile?.is_admin ?? false}
          />
          <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
          <SiteFooter
            isLoggedIn={!!user}
            displayName={sessionProfile?.display_name ?? null}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
