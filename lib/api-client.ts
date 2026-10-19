import { getClientAuth } from "./firebase/client.ts";

// Calls a KatAI API route with the signed-in user's Firebase ID token.
export async function authorizedFetch(path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  const user = getClientAuth()?.currentUser;
  if (!user) throw new Error("You are not signed in.");
  return fetch(path, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}
