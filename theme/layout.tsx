import { headers } from "next/headers";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeInitScript } from "@/modules/workspace";
import "./globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Boss",
  description: "Boss platform console",
};

import { Toaster } from "sonner";

// suppressHydrationWarning on <html>: ThemeInitScript may add the `dark` class
// before React hydrates (workspace routes only), which would otherwise be
// reported as a className mismatch.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeInitScript nonce={nonce} />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
