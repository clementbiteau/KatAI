"use client";

import { useCallback, useState } from "react";
import { runInSandbox } from "../sandbox/run-in-sandbox.ts";
import type { SandboxReport, SandboxRequest } from "../sandbox/types.ts";

export type SandboxRunState = { status: "idle" } | { status: "running" } | { status: "done"; report: SandboxReport };

// Runs generated code in the sandbox and tracks the run for the UI.
export function useSandboxRun() {
  const [state, setState] = useState<SandboxRunState>({ status: "idle" });

  const run = useCallback(async (request: SandboxRequest) => {
    setState({ status: "running" });
    const report = await runInSandbox(request);
    setState({ status: "done", report });
    return report;
  }, []);

  return { state, run };
}
