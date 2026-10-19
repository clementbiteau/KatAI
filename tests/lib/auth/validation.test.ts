import { describe, expect, it } from "vitest";
import { safeRedirectPath, validateCredentials } from "../../../lib/auth/validation.ts";

describe("validateCredentials", () => {
  it("accepts a valid email and a password of 8 characters", () => {
    expect(validateCredentials("ada@example.com", "12345678")).toBeNull();
  });

  it("rejects a malformed email", () => {
    expect(validateCredentials("ada@", "12345678")).toBe("Enter a valid email address.");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(validateCredentials("ada@example.com", "1234567")).toBe("Choose a password of at least 8 characters.");
  });
});

describe("safeRedirectPath", () => {
  it("keeps an internal path", () => {
    expect(safeRedirectPath("/settings")).toBe("/settings");
    expect(safeRedirectPath("/katas?level=hard")).toBe("/katas?level=hard");
  });

  it.each([null, "", "settings", "//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)"])(
    "falls back to the home page for %s (no open redirect)",
    (next) => {
      expect(safeRedirectPath(next)).toBe("/");
    },
  );
});
