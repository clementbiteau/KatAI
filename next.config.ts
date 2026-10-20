import type { NextConfig } from "next";

// KATAI_E2E=1 builds the end-to-end harness pages (*.e2e.tsx) into a separate
// folder. Regular and production builds never contain them.
const endToEndBuild = process.env.KATAI_E2E === "1";

// Security headers on every response; the CSP itself is set per request by proxy.ts.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
  pageExtensions: endToEndBuild ? ["tsx", "ts", "e2e.tsx"] : ["tsx", "ts"],
  distDir: endToEndBuild ? ".next-e2e" : ".next",
};

export default nextConfig;
