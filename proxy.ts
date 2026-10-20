import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy, sandboxBootstrapHash } from "./lib/content-security-policy.ts";

// Runs before every page request: a fresh nonce per request, set in the CSP of both the
// request (so Next.js applies it to its scripts) and the response (T20, docs/adr/0003).
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy({
    nonce,
    bootstrapHash: await sandboxBootstrapHash(),
    emulators: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "1",
    development: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

// Pages only: API routes answer JSON, static assets need no policy, and prefetches are skipped.
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
