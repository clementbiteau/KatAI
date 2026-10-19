import { describe, expect, it } from "vitest";
import type { KataTest } from "../../../katas/types.ts";
import { runInSandbox } from "../../../sandbox/run-in-sandbox.ts";
import { NETWORK_PROBE, runProbeInPlainWorker, STORAGE_PROBE } from "./probes.ts";

const doubleTests: KataTest[] = [
  { label: "doubles 2", args: [2], expected: 4 },
  { label: "doubles 5", args: [5], expected: 10 },
  { label: "rejects negatives", args: [-1], throws: "RangeError" },
];

const DOUBLE = `function double(value) {
  if (value < 0) throw new RangeError("negative");
  return value * 2;
}`;

describe("runInSandbox", () => {
  it("runs a correct function against every test", async () => {
    const report = await runInSandbox({ code: DOUBLE, functionName: "double", tests: doubleTests });
    expect(report.status).toBe("completed");
    expect(report.outcomes.map((outcome) => outcome.status)).toEqual(["passed", "passed", "passed"]);
  });

  it("finds a function declared as a const arrow function", async () => {
    const code = "const double = (value) => { if (value < 0) throw new RangeError('n'); return value * 2; };";
    const report = await runInSandbox({ code, functionName: "double", tests: doubleTests });
    expect(report.outcomes.every((outcome) => outcome.status === "passed")).toBe(true);
  });

  it("reports a syntax error as a load error and fails every test (CA4.8)", async () => {
    const report = await runInSandbox({ code: "function double(value) { return value * ; }", functionName: "double", tests: doubleTests });
    expect(report.status).toBe("load-error");
    expect(report.loadError?.length).toBeGreaterThan(0);
    expect(report.outcomes.map((outcome) => outcome.status)).toEqual(["failed", "failed", "failed"]);
  });

  it("reports a missing function as a load error", async () => {
    const report = await runInSandbox({ code: "function triple(v) { return v * 3; }", functionName: "double", tests: doubleTests });
    expect(report.status).toBe("load-error");
    expect(report.loadError).toContain("double");
  });

  it("stops an endless loop at the deadline and keeps the page responsive (CA4.9)", async () => {
    const code = "function double(value) { if (value === 5) { while (true) {} } return value * 2; }";
    const started = performance.now();
    let heartbeats = 0;
    const heartbeat = setInterval(() => (heartbeats += 1), 50);
    const report = await runInSandbox({ code, functionName: "double", tests: doubleTests }, 1000);
    clearInterval(heartbeat);
    expect(report.status).toBe("timeout");
    expect(report.outcomes.map((outcome) => outcome.status)).toEqual(["passed", "timeout", "timeout"]);
    expect(performance.now() - started).toBeLessThan(2500);
    expect(heartbeats).toBeGreaterThanOrEqual(10);
  });

  it.each([
    ["network", NETWORK_PROBE],
    ["IndexedDB storage", STORAGE_PROBE],
  ])("blocks %s access from generated code, unlike a plain worker (CA4.10)", async (_name, probeSource) => {
    expect(await runProbeInPlainWorker(probeSource)).toBe("allowed");
    const tests: KataTest[] = [{ label: "access is blocked", args: [], expected: "blocked" }];
    const report = await runInSandbox({ code: probeSource, functionName: "probe", tests });
    expect(report.outcomes).toEqual([{ label: "access is blocked", status: "passed" }]);
  });

  it("removes its iframe once the run is over", async () => {
    await runInSandbox({ code: DOUBLE, functionName: "double", tests: doubleTests });
    expect(document.querySelectorAll("iframe[sandbox]").length).toBe(0);
  });
});
