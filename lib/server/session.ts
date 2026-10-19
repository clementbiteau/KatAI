import "server-only";
import { getAdminAuth } from "./firebase-admin.ts";

export type SessionUser = { uid: string };

type UserHandler = (request: Request, user: SessionUser) => Promise<Response>;

// Personal data must never be stored by a browser or a proxy cache.
export function privateJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// The uid always comes from a verified Firebase ID token, never from the request body (S6).
export async function verifyRequestUser(request: Request): Promise<SessionUser | null> {
  const match = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "");
  if (!match?.[1]) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1], true);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

// Wraps a route handler so it only runs for a signed-in user; otherwise answers 401.
export function withUser(handler: UserHandler): (request: Request) => Promise<Response> {
  return async (request) => {
    const user = await verifyRequestUser(request);
    return user ? handler(request, user) : privateJson({ error: "unauthorized" }, 401);
  };
}
