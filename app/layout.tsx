import type { ReactNode } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeInitScript } from "../theme/ThemeInitScript";
import { QueryProvider } from "../host/query-provider";
import { APP_NAME } from "../constants/brand";
import "../theme/globals.css";

const inter = localFont({
  src: "../theme/fonts/InterVariable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = { title: APP_NAME, description: `${APP_NAME} workspace` };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head><ThemeInitScript /></head>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
