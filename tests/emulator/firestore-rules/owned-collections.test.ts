import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createRulesEnvironment, seedDocument } from "./environment.ts";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await createRulesEnvironment();
});

afterAll(async () => {
  await environment.cleanup();
});

// S2, S5 and S9: attempts and randoris share the same owner-read-only model.
describe.each(["attempts", "randoris"])("%s collection", (collectionName) => {
  beforeEach(async () => {
    await environment.clearFirestore();
    await seedDocument(environment, `${collectionName}/alice-doc`, { uid: "alice", kataId: "cart-total" });
    await seedDocument(environment, `${collectionName}/bob-doc`, { uid: "bob", kataId: "cart-total" });
  });

  it("lets the owner read their own document", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(alice, `${collectionName}/alice-doc`)));
  });

  it("lets the owner list their documents with a uid filter", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertSucceeds(getDocs(query(collection(alice, collectionName), where("uid", "==", "alice"))));
  });

  it("refuses reading another user's document or listing without a uid filter", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, `${collectionName}/bob-doc`)));
    await assertFails(getDocs(collection(alice, collectionName)));
  });

  it("refuses every client write, even by the owner", async () => {
    const alice = environment.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(alice, `${collectionName}/new-doc`), { uid: "alice" }));
    await assertFails(updateDoc(doc(alice, `${collectionName}/alice-doc`), { kataId: "slugify" }));
    await assertFails(deleteDoc(doc(alice, `${collectionName}/alice-doc`)));
  });

  it("refuses anonymous reads", async () => {
    const anonymous = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonymous, `${collectionName}/alice-doc`)));
  });
});
