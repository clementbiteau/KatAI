import { describe, expect, it } from "vitest";
import { isProvider, validateProviderKey } from "../../lib/providers.ts";

describe("validateProviderKey (CA2.5)", () => {
  it("accepts a key of 20 to 300 characters without spaces", () => {
    expect(validateProviderKey("a".repeat(20))).toBeNull();
    expect(validateProviderKey("a".repeat(300))).toBeNull();
  });

  it.each([
    ["", "Paste your API key."],
    ["a".repeat(19), "This does not look like an API key: it should be 20 to 300 characters long."],
    ["a".repeat(301), "This does not look like an API key: it should be 20 to 300 characters long."],
    ["sk-test key-with-space-inside", "An API key cannot contain spaces."],
  ])("refuses %j", (value, message) => {
    expect(validateProviderKey(value)).toBe(message);
  });
});

describe("isProvider", () => {
  it("only accepts the closed list of providers", () => {
    expect(isProvider("anthropic")).toBe(true);
    expect(isProvider("openai")).toBe(true);
    expect(isProvider("other")).toBe(false);
    expect(isProvider(undefined)).toBe(false);
  });
});
