import {
  abandonRandori,
  parseRandoriStart,
  readRandoriWithClock,
  startRandori,
  type RandoriOutcome,
} from "../../../lib/server/randoris/commands.ts";
import { privateJson, withUser } from "../../../lib/server/session.ts";

export const dynamic = "force-dynamic";

function respond(outcome: RandoriOutcome): Response {
  if (outcome.ok) return privateJson({ randori: outcome.randori, serverNow: outcome.serverNow });
  return privateJson({ error: outcome.error, code: outcome.code, randoriId: outcome.randoriId }, outcome.status);
}

// Reads a randori with the server time, to resume its countdown (CA7.7).
export const GET = withUser(async (request, user) =>
  respond(await readRandoriWithClock(user.uid, new URL(request.url).searchParams.get("id") ?? "", Date.now())),
);

// Starts a randori on the server clock (CA7.1, CA7.9, CA7.10).
export const POST = withUser(async (request, user) => {
  const start = parseRandoriStart(await request.json().catch(() => null));
  if ("error" in start) return privateJson({ error: start.error }, 400);
  return respond(await startRandori(user.uid, start, Date.now()));
});

// Abandons a running randori (CA7.8).
export const PATCH = withUser(async (request, user) =>
  respond(await abandonRandori(user.uid, await request.json().catch(() => null), Date.now())),
);
