import "./globals.css";

import { AppLayout } from "@/components/app-layout";
import { AppTitle } from "@/components/app-title";
import { AuthGuard } from "@/guards/auth-guard";
import type { Metadata } from "next";
import Providers from "@/providers/bprogress-provider";
import { StoreProvider } from "@/providers/store.provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/toast/toaster";
import { poppins } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Logistics System",
    template: "%s | Logistics System",
  },
  description: "Logistics System",
  applicationName: "Logistics System",
  authors: [{ name: "Logistics" }],
  generator: "Next.js",
  keywords: ["Logistics, System"],
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/images/logo_full.png",
    shortcut: "/images/logo_icon.png",
    apple: "/images/logo_icon.png",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/images/logo_icon.png",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Logistics System",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="app-theme">
          <StoreProvider>
            <Providers>
              <AppTitle />
              <AuthGuard>
                <AppLayout>
                  {children}
                </AppLayout>
                <Toaster />
              </AuthGuard>
            </Providers>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
