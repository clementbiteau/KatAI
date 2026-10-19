import type { NextConfig } from "next";

// KATAI_E2E=1 builds the end-to-end harness pages (*.e2e.tsx) into a separate
// folder. Regular and production builds never contain them.
const endToEndBuild = process.env.KATAI_E2E === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: endToEndBuild ? ["tsx", "ts", "e2e.tsx"] : ["tsx", "ts"],
  distDir: endToEndBuild ? ".next-e2e" : ".next",
};

export default nextConfig;
