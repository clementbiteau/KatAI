import { getAdminDb } from "../../../lib/server/firebase-admin.ts";

// Shared helpers for server route tests on the Auth and Firestore emulators.
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

export async function createUserToken(email: string): Promise<{ uid: string; idToken: string }> {
  const response = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse", returnSecureToken: true }),
    },
  );
  const body = (await response.json()) as { localId: string; idToken: string };
  return { uid: body.localId, idToken: body.idToken };
}

export function apiRequest(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  return new Request(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function resetAuthAndCollection(collection: string): Promise<void> {
  await fetch(`http://${authHost}/emulator/v1/projects/demo-katai/accounts`, { method: "DELETE" });
  const documents = await getAdminDb().collection(collection).listDocuments();
  await Promise.all(documents.map((document) => document.delete()));
}
