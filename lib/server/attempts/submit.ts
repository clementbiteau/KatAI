import "server-only";
import type { AttemptView } from "../../attempts/view.ts";
import { findKata } from "../../../katas/catalog.ts";
import type { Kata } from "../../../katas/types.ts";
import { isProvider, isSupportedModel, type Provider } from "../../providers.ts";
import { validateSpec } from "../../specs.ts";
import { createAttempt } from "../data/attempts.ts";
import { readProviderKey, saveProviderKey } from "../data/provider-keys.ts";
import { checkRandoriOpen, countRandoriAttempt } from "../data/randori-progress.ts";
import { reserveSubmission } from "../data/usage.ts";
import { currentKeyVersion, decryptProviderKey, encryptProviderKey } from "../key-encryption.ts";
import { generateCode } from "../providers/generate.ts";

// randoriId links the attempt to a running randori of the caller (US7), or is null.
export type Submission = { kata: Kata; provider: Provider; model: string; spec: string; randoriId: string | null };

export type SubmitOutcome =
  | { ok: true; attempt: AttemptView }
  | { ok: false; status: number; error: string; code?: string; retryAfterSeconds?: number };

// Checks the request body against the closed lists and the spec limits (CA4.4).
export function parseSubmission(body: unknown): Submission | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request." };
  const { kataId, provider, model, spec, randoriId } = body as Record<string, unknown>;
  const kata = typeof kataId === "string" ? findKata(kataId) : undefined;
  if (!kata) return { error: "Unknown kata." };
  if (!isProvider(provider)) return { error: "Unknown provider." };
  if (!isSupportedModel(provider, model)) return { error: "This model is not available." };
  const invalidSpec = typeof spec === "string" ? validateSpec(spec) : "Write a specification first.";
  if (invalidSpec) return { error: invalidSpec };
  return { kata, provider, model, spec: spec as string, randoriId: typeof randoriId === "string" && randoriId ? randoriId : null };
}

// Decrypts the user's key for this call only (S8), and re-encrypts it with the current
// master key when it was saved with the previous one (docs/adr/0004).
async function unlockProviderKey(uid: string, provider: Provider): Promise<string | null> {
  const encrypted = await readProviderKey(uid, provider);
  if (!encrypted) return null;
  const associatedData = `${uid}:${provider}`;
  const apiKey = decryptProviderKey(encrypted, associatedData);
  if (encrypted.keyVersion !== currentKeyVersion()) {
    await saveProviderKey(uid, provider, encryptProviderKey(apiKey, associatedData));
  }
  return apiKey;
}

// An answer without code is finished at once: every test fails (CA4.7).
function failedResult(kata: Kata) {
  return { passed: 0, total: kata.tests.length, tests: kata.tests.map((test) => ({ label: test.label, status: "failed" as const })) };
}

// Checks the key, the randori and the rate limit, calls the model once, then records the
// attempt whatever the outcome (CA4.1, CA4.3, CA4.5 to CA4.7, CA4.11, CA7.2, CA7.5).
// `now` is the arrival time of the request, on the server clock.
export async function submitAttempt(uid: string, { kata, provider, model, spec, randoriId }: Submission, now: number = Date.now()): Promise<SubmitOutcome> {
  if (!(await readProviderKey(uid, provider))) {
    return { ok: false, status: 409, code: "missing-key", error: "Add your Anthropic API key in Settings first." };
  }
  const randoriRefusal = randoriId ? await checkRandoriOpen(uid, randoriId, kata.id, now) : null;
  if (randoriRefusal) return { ok: false, ...randoriRefusal };
  const reservation = await reserveSubmission(uid);
  if (!reservation.allowed) {
    const { retryAfterSeconds } = reservation;
    return { ok: false, status: 429, code: "rate-limited", retryAfterSeconds, error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` };
  }
  let apiKey: string | null;
  try {
    apiKey = await unlockProviderKey(uid, provider);
  } catch {
    return { ok: false, status: 409, code: "unreadable-key", error: "Your saved key can no longer be read. Please save it again in Settings." };
  }
  if (!apiKey) return { ok: false, status: 409, code: "missing-key", error: "Add your Anthropic API key in Settings first." };
  const generation = await generateCode(provider, apiKey, { model, spec, functionName: kata.functionName, signature: kata.signature });
  const base = { kataId: kata.id, randoriId, provider, model, spec, latencyMs: generation.latencyMs, inputTokens: generation.inputTokens ?? null, outputTokens: generation.outputTokens ?? null };
  const attempt = generation.ok
    ? { ...base, servedModel: generation.servedModel, code: generation.code, truncated: generation.truncated, status: generation.code ? ("generated" as const) : ("done" as const), errorCategory: null, httpStatus: null, result: generation.code ? null : failedResult(kata) }
    : { ...base, servedModel: null, code: null, truncated: false, status: "error" as const, errorCategory: generation.category, httpStatus: generation.httpStatus ?? null, result: null };
  const created = await createAttempt(uid, attempt);
  if (randoriId) await countRandoriAttempt(randoriId);
  return { ok: true, attempt: created };
}
