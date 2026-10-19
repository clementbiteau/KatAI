import { beforeEach, describe, expect, it } from "vitest";
import { requestPasswordReset, signIn, signOutUser, signUp } from "../../../lib/auth/service.ts";
import { getClientAuth } from "../../../lib/firebase/client.ts";

// Runs against the Auth emulator: npm run test:emulator sets FIREBASE_AUTH_EMULATOR_HOST,
// and the emulator test project sets NEXT_PUBLIC_FIREBASE_USE_EMULATORS=1 (vitest.config.ts).
const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const emulatorApi = `http://${emulatorHost}/emulator/v1/projects/demo-katai`;

async function resetEmails(): Promise<{ email: string; requestType: string }[]> {
  const response = await fetch(`${emulatorApi}/oobCodes`);
  const body = (await response.json()) as { oobCodes: { email: string; requestType: string }[] };
  return body.oobCodes.filter((code) => code.requestType === "PASSWORD_RESET");
}

beforeEach(async () => {
  await fetch(`${emulatorApi}/accounts`, { method: "DELETE" });
  await signOutUser();
});

describe("auth service on the emulator", () => {
  it("creates an account and signs the user in (CA1.1)", async () => {
    expect(await signUp("ada@example.com", "correct-horse")).toEqual({ ok: true });
    expect(getClientAuth()?.currentUser?.email).toBe("ada@example.com");
  });

  it("refuses a second account for the same email without confirming it exists (CA1.2)", async () => {
    await signUp("ada@example.com", "correct-horse");
    await signOutUser();
    const result = await signUp("ada@example.com", "another-password");
    expect(result).toEqual({
      ok: false,
      message: "We could not create an account with these details. If you already have an account, sign in instead.",
    });
  });

  it("signs in with valid credentials and signs out (CA1.3, CA1.6)", async () => {
    await signUp("ada@example.com", "correct-horse");
    await signOutUser();
    expect(await signIn("ada@example.com", "correct-horse")).toEqual({ ok: true });
    await signOutUser();
    expect(getClientAuth()?.currentUser).toBeNull();
  });

  it("gives the same message for a wrong password and an unknown email (CA1.4)", async () => {
    await signUp("ada@example.com", "correct-horse");
    await signOutUser();
    const wrongPassword = await signIn("ada@example.com", "wrong-password");
    const unknownEmail = await signIn("nobody@example.com", "correct-horse");
    expect(wrongPassword).toEqual({ ok: false, message: "Incorrect email or password." });
    expect(unknownEmail).toEqual(wrongPassword);
  });

  it("answers a reset request the same way whether or not the account exists (CA1.8)", async () => {
    await signUp("ada@example.com", "correct-horse");
    await signOutUser();
    expect(await requestPasswordReset("ada@example.com")).toEqual({ ok: true });
    expect(await requestPasswordReset("nobody@example.com")).toEqual({ ok: true });
    expect((await resetEmails()).map((code) => code.email)).toEqual(["ada@example.com"]);
  });
});
