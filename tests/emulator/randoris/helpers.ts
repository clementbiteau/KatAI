import { randomBytes } from "node:crypto";
import { saveProviderKey } from "../../../lib/server/data/provider-keys.ts";
import { encryptProviderKey } from "../../../lib/server/key-encryption.ts";
import { createUserToken, resetAuthAndCollection } from "../server/helpers.ts";

// Shared setup for randori tests on the emulators.

export const MINUTE = 60_000;

export async function resetRandoriData(): Promise<void> {
  for (const collection of ["providerKeys", "usage", "attempts", "randoris"]) await resetAuthAndCollection(collection);
}

// A signed-up user, with an Anthropic key saved unless told otherwise.
export async function userWithKey(email: string, withKey = true): Promise<{ uid: string; idToken: string }> {
  process.env.KEY_ENCRYPTION_KEY ??= randomBytes(32).toString("base64");
  const user = await createUserToken(email);
  if (withKey) {
    const key = "sk-ant-test-" + "r".repeat(40);
    await saveProviderKey(user.uid, "anthropic", encryptProviderKey(key, `${user.uid}:anthropic`));
  }
  return user;
}
