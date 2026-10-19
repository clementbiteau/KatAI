import { SANDBOX_DOCUMENT } from "./frame-document.ts";
import type { SandboxMessage, SandboxOutcome, SandboxReport, SandboxRequest } from "./types.ts";
import { buildWorkerSource } from "./worker-source.ts";

export const SANDBOX_TIMEOUT_MS = 5000;

function createSandboxFrame(): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("aria-hidden", "true");
  frame.style.display = "none";
  frame.srcdoc = SANDBOX_DOCUMENT;
  document.body.append(frame);
  return frame;
}

// Tests without a result when the run stops get the given status, in test order.
function completeOutcomes(
  request: SandboxRequest,
  received: SandboxOutcome[],
  missingStatus: SandboxOutcome["status"],
): SandboxOutcome[] {
  return request.tests.map((test, index) => received[index] ?? { label: test.label, status: missingStatus });
}

// Runs untrusted generated code against a kata's tests in an isolated iframe and
// worker (docs/adr/0006). Always resolves; the iframe is removed once done.
export function runInSandbox(request: SandboxRequest, timeoutMs = SANDBOX_TIMEOUT_MS): Promise<SandboxReport> {
  return new Promise((resolve) => {
    const frame = createSandboxFrame();
    const received: SandboxOutcome[] = [];

    const finish = (report: SandboxReport) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      frame.remove();
      resolve(report);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      const message = event.data as SandboxMessage;
      if (message.type === "result") {
        const expectedLabel = request.tests[received.length]?.label;
        const valid = message.outcome.label === expectedLabel && ["passed", "failed"].includes(message.outcome.status);
        received.push({ label: expectedLabel ?? message.outcome.label, status: valid ? message.outcome.status : "failed" });
      } else if (message.type === "load-error") {
        finish({ status: "load-error", loadError: String(message.message), outcomes: completeOutcomes(request, [], "failed") });
      } else if (message.type === "done") {
        finish({ status: "completed", outcomes: completeOutcomes(request, received, "failed") });
      }
    };

    const timer = setTimeout(
      () => finish({ status: "timeout", outcomes: completeOutcomes(request, received, "timeout") }),
      timeoutMs,
    );
    window.addEventListener("message", onMessage);
    frame.addEventListener(
      "load",
      () => {
        const runRequest = { type: "run", workerSource: buildWorkerSource(), ...request };
        frame.contentWindow?.postMessage(runRequest, "*");
      },
      { once: true },
    );
  });
}
