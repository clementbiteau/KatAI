import { describe, expect, it } from "vitest";
import { isSupportedModel, PROVIDER_MODELS } from "../../lib/providers.ts";
import { MAX_SPEC_LENGTH, validateSpec } from "../../lib/specs.ts";

describe("validateSpec (CA4.4)", () => {
  it("accepts a spec of 1 to 4000 characters", () => {
    expect(MAX_SPEC_LENGTH).toBe(4000);
    expect(validateSpec("x")).toBeNull();
    expect(validateSpec("x".repeat(4000))).toBeNull();
  });

  it("refuses an empty or blank spec", () => {
    expect(validateSpec("")).toBe("Write a specification first.");
    expect(validateSpec("  \n ")).toBe("Write a specification first.");
  });

  it("refuses a spec longer than 4000 characters", () => {
    expect(validateSpec("x".repeat(4001))).toBe("Your specification is longer than 4000 characters.");
  });
});

describe("closed list of models (ADR 0005)", () => {
  it("offers Claude Opus 5.5 first, then Sonnet 5.5 and Haiku 5.5", () => {
    expect(PROVIDER_MODELS.anthropic.map((model) => model.id)).toEqual([
      "claude-opus-5-5",
      "claude-sonnet-5-5",
      "claude-haiku-5-5",
    ]);
  });

  it("accepts only listed models for a provider", () => {
    expect(isSupportedModel("anthropic", "claude-haiku-5-5")).toBe(true);
    expect(isSupportedModel("anthropic", "claude-fable-5-1")).toBe(false);
    expect(isSupportedModel("anthropic", "gpt-6-sol")).toBe(false);
  });
});
