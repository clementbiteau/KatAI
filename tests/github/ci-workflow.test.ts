import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

// ADR 0008: the CI's safety properties, read from the workflow itself. The Firestore deploy
// key only reaches the deploy job, which only runs after a green CI on main (T21).
type Step = { uses?: string; run?: string; if?: string; env?: Record<string, string> };
type Job = { "runs-on": string; "timeout-minutes"?: number; needs?: string[]; if?: string; environment?: string; steps: Step[] };

const source = readFileSync(resolve(import.meta.dirname, "../../.github/workflows/ci.yml"), "utf8");
const workflow = parse(source) as { jobs: Record<string, Job> };
const jobs = Object.entries(workflow.jobs);
const deploy = workflow.jobs["deploy-firestore"];

describe("CI workflow (ADR 0008)", () => {
  it.each(jobs)("%s runs on a pinned image with a time limit", (_name, job) => {
    expect(job["runs-on"]).toBe("ubuntu-24.04");
    expect(job["timeout-minutes"]).toBeGreaterThan(0);
  });

  it("pins every third-party action to a full commit SHA", () => {
    const actions = jobs.flatMap(([, job]) => job.steps.map((step) => step.uses)).filter((uses) => uses && !uses.startsWith("./"));
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) expect(action).toMatch(/@[0-9a-f]{40}$/);
  });

  it("deploys Firestore rules and indexes only from main, after every check, once the project exists", () => {
    expect(deploy?.needs).toEqual(["quality", "tests", "sandbox", "secrets"]);
    expect(deploy?.if).toBe("github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.FIREBASE_PROJECT_ID != ''");
    expect(deploy?.environment).toBe("production");
    const commands = deploy?.steps.map((step) => step.run ?? "").join("\n");
    expect(commands).toContain('firebase deploy --only firestore:rules,firestore:indexes --project "$FIREBASE_PROJECT_ID" --non-interactive');
  });

  it("gives the deploy key to the deploy job only, and always deletes it", () => {
    const jobsReadingSecrets = jobs.filter(([, job]) => JSON.stringify(job).includes("secrets.")).map(([name]) => name);
    expect(jobsReadingSecrets).toEqual(["deploy-firestore"]);
    const cleanup = deploy?.steps.at(-1);
    expect(cleanup?.if).toBe("always()");
    expect(cleanup?.run).toContain('rm -f "$RUNNER_TEMP/deploy-key.json"');
  });
});
