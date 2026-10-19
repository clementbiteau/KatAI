import { describe, expect, it } from "vitest";
import { describeAuthError } from "../../../lib/auth/errors.ts";

describe("describeAuthError", () => {
  it.each(["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"])(
    "gives one generic sign-in message for %s, never saying which field is wrong (CA1.4)",
    (code) => {
      expect(describeAuthError(code, "sign-in")).toBe("Incorrect email or password.");
    },
  );

  it("asks to wait after too many attempts (CA1.5)", () => {
    expect(describeAuthError("auth/too-many-requests", "sign-in")).toBe(
      "Too many attempts. Please wait a few minutes and try again.",
    );
  });

  it("does not confirm that an email is already registered (CA1.2)", () => {
    const message = describeAuthError("auth/email-already-in-use", "sign-up");
    expect(message).toBe("We could not create an account with these details. If you already have an account, sign in instead.");
    expect(message.toLowerCase()).not.toContain("already in use");
  });

  it("explains password and email problems on sign-up", () => {
    expect(describeAuthError("auth/weak-password", "sign-up")).toBe("Choose a password of at least 8 characters.");
    expect(describeAuthError("auth/invalid-email", "sign-up")).toBe("Enter a valid email address.");
  });

  it("explains network errors and falls back to a generic message", () => {
    expect(describeAuthError("auth/network-request-failed", "reset")).toBe(
      "Network error. Check your connection and try again.",
    );
    expect(describeAuthError("auth/something-new", "sign-up")).toBe("Something went wrong. Please try again.");
  });
});
