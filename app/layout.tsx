import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import NextTopLoader from "nextjs-toploader";
import AuthCookieSync from "@/components/AuthCookieSync";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Gameforsmart",
  description: "Modern Admin Panel for SaaS Management",
  generator: "v0.app",
  icons: {
    icon: "/icons/icon-32x32.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <AuthCookieSync />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="var(--top-loader-color)" showSpinner={false} height={3} />
          <I18nProvider>{children}</I18nProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
