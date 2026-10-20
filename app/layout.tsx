import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/auth/auth-context.tsx";
import { SiteHeader } from "../components/auth/site-header.tsx";
import { bodyFont, displayFont, monoFont } from "./fonts.ts";
import "./globals.css";

export const metadata: Metadata = {
  title: "KatAI",
  description: "Spec katas for working with AI coding agents.",
};

// Every page is rendered per request: the CSP nonce changes with each request, and
// Next.js can only apply it while rendering (proxy.ts, T20). The skip link is the first
// keyboard stop and leads past the header to the page content (T24).
export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <AuthProvider>
          <SiteHeader />
          <div id="content" tabIndex={-1}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
