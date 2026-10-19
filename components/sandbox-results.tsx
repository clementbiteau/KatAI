import { SANDBOX_TIMEOUT_MS } from "../sandbox/run-in-sandbox.ts";
import type { SandboxOutcome, SandboxReport } from "../sandbox/types.ts";

const STATUS_TEXT: Record<SandboxOutcome["status"], string> = {
  passed: "Passed",
  failed: "Failed",
  timeout: "Timed out",
};

// Score and per-test results of one sandbox run. Statuses are written out, not only colored.
export function SandboxResults({ report }: { report: SandboxReport }) {
  const passed = report.outcomes.filter((outcome) => outcome.status === "passed").length;
  return (
    <section className="results" aria-label="Test results">
      <p className="results-score" data-testid="score">
        {passed} / {report.outcomes.length} tests passed
      </p>
      {report.status === "load-error" && (
        <p className="results-notice" role="alert">
          The generated code could not be loaded: {report.loadError}
        </p>
      )}
      {report.status === "timeout" && (
        <p className="results-notice" role="status">
          Execution stopped after {SANDBOX_TIMEOUT_MS / 1000} seconds. Unfinished tests are marked as timed out.
        </p>
      )}
      <ul className="results-list">
        {report.outcomes.map((outcome) => (
          <li key={outcome.label} data-status={outcome.status}>
            {STATUS_TEXT[outcome.status]}: {outcome.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
