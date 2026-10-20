import { describe, expect, it } from "vitest";
import { describeErrorCategory } from "../../../components/kata/attempt-messages.ts";

const CATEGORIES = [
  "key-refused",
  "insufficient-credit",
  "model-unavailable",
  "provider-rate-limit",
  "provider-unavailable",
  "timeout",
  "provider-unreachable",
  "request-refused",
  "model-refused",
];

describe("describeErrorCategory (CA4.5, CA4.6)", () => {
  it("gives a distinct, specific message for each category", () => {
    const messages = CATEGORIES.map(describeErrorCategory);
    expect(new Set(messages).size).toBe(CATEGORIES.length);
    expect(describeErrorCategory("key-refused")).toBe("Anthropic refused your API key. Check it in Settings.");
    expect(describeErrorCategory("timeout")).toBe("The model did not answer within 60 seconds. Try again.");
  });

  it("falls back to a generic message for an unknown category", () => {
    expect(describeErrorCategory("something-new")).toBe("The model call failed. Try again.");
  });
});
