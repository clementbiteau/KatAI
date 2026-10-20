import "server-only";
import type { Provider } from "../../providers.ts";
import { generateWithAnthropic } from "./anthropic.ts";
import { extractCode } from "./prompt.ts";
import type { Generation, GenerationRequest } from "./types.ts";

// Echo provider, for end-to-end tests only: it needs KATAI_FAKE_PROVIDER=1 and the
// Firebase emulators, and is never enabled on Vercel (where emulators are refused too).
export function isEchoProviderEnabled(): boolean {
  return (
    process.env.KATAI_FAKE_PROVIDER === "1" &&
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) &&
    !process.env.VERCEL_ENV
  );
}

// Answers with the code block written in the spec, like a model following it to the letter.
function generateEcho(request: GenerationRequest): Generation {
  return { ok: true, code: extractCode(request.spec), truncated: false, servedModel: "echo", latencyMs: 0, inputTokens: 0, outputTokens: 0 };
}

// Single entry point for the routes, whatever the provider (docs/adr/0005).
export async function generateCode(provider: Provider, apiKey: string, request: GenerationRequest): Promise<Generation> {
  if (isEchoProviderEnabled()) return generateEcho(request);
  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(apiKey, request);
  }
}
