import { assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createRulesEnvironment, seedDocument } from "./environment.ts";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await createRulesEnvironment();
});

afterAll(async () => {
  await environment.cleanup();
});

beforeEach(async () => {
  await environment.clearFirestore();
  await seedDocument(environment, "providerKeys/alice_anthropic", { uid: "alice", ciphertext: "opaque" });
  await seedDocument(environment, "usage/alice", { recentSubmissions: [] });
});

// S3: provider keys and usage counters are server-only, even for their owner.
describe.each(["providerKeys/alice_anthropic", "usage/alice"])("%s", (path) => {
  it("refuses reads by the owner and by anonymous visitors", async () => {
    await assertFails(getDoc(doc(environment.authenticatedContext("alice").firestore(), path)));
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), path)));
  });

  it("refuses writes by the owner", async () => {
    await assertFails(setDoc(doc(environment.authenticatedContext("alice").firestore(), path), { uid: "alice" }));
  });
});

// S1 and S4: katas live in the repository; no collection is readable or writable by default.
describe("unlisted paths", () => {
  it("refuses kata writes and any read outside the owned collections", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(alice, "katas/cart-total"), { title: "forged" }));
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), "profiles/alice")));
  });
});
