import { describe, expect, it } from "vitest";
import { effectiveRandoriStatus, randoriViewFromData } from "../../lib/randoris/view.ts";

const running = randoriViewFromData(
  "r1",
  { kataId: "retail-cart", provider: "anthropic", status: "running", bestPassed: 3, total: 12, attemptsCount: 2, bestElapsedMs: null },
  "2026-10-20T10:00:00.000Z",
  "2026-10-20T10:10:00.000Z",
);

describe("effectiveRandoriStatus (lazy closing, ADR 0007)", () => {
  it("keeps a randori running until its deadline", () => {
    expect(effectiveRandoriStatus(running, Date.parse("2026-10-20T10:09:59.999Z"))).toBe("running");
  });

  it("reports a running randori past its deadline as timed out", () => {
    expect(effectiveRandoriStatus(running, Date.parse("2026-10-20T10:10:00.000Z"))).toBe("timeout");
  });

  it("never changes a finished randori", () => {
    expect(effectiveRandoriStatus({ ...running, status: "succeeded" }, Date.parse("2026-10-21T00:00:00Z"))).toBe("succeeded");
    expect(effectiveRandoriStatus({ ...running, status: "abandoned" }, Date.parse("2026-10-21T00:00:00Z"))).toBe("abandoned");
  });
});
