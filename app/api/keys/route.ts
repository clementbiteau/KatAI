import { deleteProviderKey, listProviderKeyStatuses, saveProviderKey } from "../../../lib/server/data/provider-keys.ts";
import { encryptProviderKey } from "../../../lib/server/key-encryption.ts";
import { privateJson, withUser } from "../../../lib/server/session.ts";
import { isProvider, validateProviderKey } from "../../../lib/providers.ts";

export const dynamic = "force-dynamic";

// Configuration status of the signed-in user's provider keys (CA2.2).
export const GET = withUser(async (_request, user) => privateJson({ keys: await listProviderKeyStatuses(user.uid) }));

// Encrypts and stores a provider key (docs/adr/0004). The key is never logged nor sent back.
export const POST = withUser(async (request, user) => {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return privateJson({ error: "Invalid request." }, 400);
  const { provider, key } = body as { provider?: unknown; key?: unknown };
  if (!isProvider(provider)) return privateJson({ error: "Unknown provider." }, 400);
  const invalidKey = typeof key === "string" ? validateProviderKey(key) : "Paste your API key.";
  if (invalidKey) return privateJson({ error: invalidKey }, 400);
  let encrypted;
  try {
    encrypted = encryptProviderKey(key as string, `${user.uid}:${provider}`);
  } catch {
    return privateJson({ error: "Saving keys is not available right now." }, 503);
  }
  return privateJson(await saveProviderKey(user.uid, provider, encrypted));
});

export const DELETE = withUser(async (request, user) => {
  const provider = new URL(request.url).searchParams.get("provider");
  if (!isProvider(provider)) return privateJson({ error: "Unknown provider." }, 400);
  return privateJson(await deleteProviderKey(user.uid, provider));
});
