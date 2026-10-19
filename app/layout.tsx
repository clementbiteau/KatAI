import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/auth/auth-context.tsx";
import { SiteHeader } from "../components/auth/site-header.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: "KatAI",
  description: "Spec katas for working with AI coding agents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
