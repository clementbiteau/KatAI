import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/auth/auth-context.tsx";
import { SiteHeader } from "../components/auth/site-header.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: "KatAI",
  description: "Spec katas for working with AI coding agents.",
};

// Every page is rendered per request: the CSP nonce changes with each request, and
// Next.js can only apply it while rendering (proxy.ts, T20).
export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
