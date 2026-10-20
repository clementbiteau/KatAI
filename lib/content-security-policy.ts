import { SANDBOX_BOOTSTRAP } from "../sandbox/frame-document.ts";

// Content Security Policy of every page (docs/adr/0003, T20). Scripts must come from
// the app, carry the request's nonce (Next.js applies it to its own scripts), or be the
// sandbox bootstrap allowed by its hash. The sandbox iframe inherits this policy, so
// blob: stays allowed for its worker and the scripts the worker loads (docs/adr/0006).

const FIREBASE_ENDPOINTS = [
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://firestore.googleapis.com",
];
const EMULATOR_ENDPOINTS = ["http://127.0.0.1:9099", "http://127.0.0.1:8080"];

export type PolicyOptions = { nonce: string; bootstrapHash: string; emulators: boolean; development: boolean };

let bootstrapHash: Promise<string> | undefined;

// SHA-256 of the sandbox bootstrap, in the 'sha256-…' form CSP expects. Computed once.
export function sandboxBootstrapHash(): Promise<string> {
  bootstrapHash ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(SANDBOX_BOOTSTRAP))
    .then((digest) => `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`);
  return bootstrapHash;
}

export function buildContentSecurityPolicy({ nonce, bootstrapHash: hash, emulators, development }: PolicyOptions): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' '${hash}' blob:${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Inline style attributes only (not <style> elements): WebKit applies some to its own
    // form controls, such as <select>. They cannot run scripts nor use selectors.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${[...FIREBASE_ENDPOINTS, ...(emulators ? EMULATOR_ENDPOINTS : [])].join(" ")}`,
    "worker-src blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(emulators ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
