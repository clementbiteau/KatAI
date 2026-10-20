import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, sandboxBootstrapHash } from "../../lib/content-security-policy.ts";
import { SANDBOX_BOOTSTRAP } from "../../sandbox/frame-document.ts";

function directive(policy: string, name: string): string {
  return policy.split("; ").find((part) => part.startsWith(`${name} `) || part === name) ?? "";
}

const production = { nonce: "abc123", bootstrapHash: "sha256-HASH", emulators: false, development: false };

describe("content security policy (ADR 0003, T20)", () => {
  it("hashes the sandbox bootstrap exactly as browsers do", async () => {
    const expected = `sha256-${createHash("sha256").update(SANDBOX_BOOTSTRAP).digest("base64")}`;
    expect(await sandboxBootstrapHash()).toBe(expected);
  });

  it("allows scripts only from the app, the request nonce, the sandbox hash and sandbox blobs", () => {
    const scripts = directive(buildContentSecurityPolicy(production), "script-src");
    expect(scripts).toBe("script-src 'self' 'nonce-abc123' 'sha256-HASH' blob:");
    expect(scripts).not.toContain("unsafe-inline");
    expect(scripts).not.toContain("unsafe-eval");
  });

  it("forbids framing, plugins and foreign forms, and limits connections to Firebase", () => {
    const policy = buildContentSecurityPolicy(production);
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(directive(policy, "form-action")).toBe("form-action 'self'");
    expect(directive(policy, "worker-src")).toBe("worker-src blob:");
    expect(directive(policy, "style-src")).toBe("style-src 'self' 'nonce-abc123'");
    expect(directive(policy, "style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
    expect(directive(policy, "connect-src")).toBe(
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
    );
    expect(directive(policy, "upgrade-insecure-requests")).toBe("upgrade-insecure-requests");
  });

  it("opens the local emulators only for emulator builds, and eval only in development", () => {
    const local = buildContentSecurityPolicy({ ...production, emulators: true, development: true });
    expect(directive(local, "connect-src")).toContain("http://127.0.0.1:9099 http://127.0.0.1:8080");
    expect(directive(local, "upgrade-insecure-requests")).toBe("");
    expect(directive(local, "script-src")).toContain("'unsafe-eval'");
  });
});
