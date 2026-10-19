import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const rulesPath = resolve(import.meta.dirname, "../../../firestore.rules");

// FIRESTORE_EMULATOR_HOST is set by `firebase emulators:exec` (npm run test:emulator).
export function createRulesEnvironment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: "demo-katai",
    firestore: { rules: readFileSync(rulesPath, "utf8") },
  });
}

// Writes test data as the server would (rules bypassed), like the Admin SDK in production.
export function seedDocument(
  environment: RulesTestEnvironment,
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  return environment.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), path), data));
}
