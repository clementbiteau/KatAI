"use client";

// End-to-end harness, built only with KATAI_E2E=1 (see next.config.ts).
// It lets browser tests run any code against a kata through the real sandbox,
// without the sign-in and model steps that come in later tasks.
import { useState } from "react";
import { SandboxResults } from "../../components/sandbox-results.tsx";
import { useSandboxRun } from "../../components/use-sandbox-run.ts";
import { KATAS } from "../../katas/catalog.ts";

export default function SandboxHarnessPage() {
  const [kataId, setKataId] = useState(KATAS[0]?.id ?? "");
  const [code, setCode] = useState("");
  const { state, run } = useSandboxRun();
  const kata = KATAS.find((candidate) => candidate.id === kataId);

  return (
    <main className="home">
      <h1>Sandbox harness</h1>
      <label>
        Kata
        <select value={kataId} onChange={(event) => setKataId(event.target.value)}>
          {KATAS.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Generated code
        <textarea value={code} onChange={(event) => setCode(event.target.value)} rows={12} />
      </label>
      <button
        type="button"
        disabled={!kata || state.status === "running"}
        onClick={() => kata && run({ code, functionName: kata.functionName, tests: kata.tests })}
      >
        Run tests
      </button>
      {state.status === "done" && <SandboxResults report={state.report} />}
    </main>
  );
}
