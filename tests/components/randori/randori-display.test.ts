import { describe, expect, it } from "vitest";
import { formatClock, remainingMs } from "../../../components/randori/randori-display.ts";

describe("countdown on the server clock (CA7.7)", () => {
  const deadline = "2026-10-20T10:10:00.000Z";

  it("corrects the browser clock with the server offset", () => {
    const browserNow = Date.parse("2026-10-20T10:00:00.000Z");
    expect(remainingMs(deadline, 0, browserNow)).toBe(600_000);
    expect(remainingMs(deadline, 30_000, browserNow)).toBe(570_000);
    expect(remainingMs(deadline, -30_000, browserNow)).toBe(630_000);
  });

  it("never goes below zero", () => {
    expect(remainingMs(deadline, 0, Date.parse("2026-10-20T11:00:00.000Z"))).toBe(0);
  });

  it("formats minutes and seconds, rounding up so 0:00 means time is up", () => {
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(61_200)).toBe("1:02");
    expect(formatClock(400)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
  });
});
