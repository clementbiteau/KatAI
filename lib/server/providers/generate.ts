import "server-only";
import type { Provider } from "../../providers.ts";
import { generateWithAnthropic } from "./anthropic.ts";
import type { Generation, GenerationRequest } from "./types.ts";

// Single entry point for the routes, whatever the provider (docs/adr/0005).
export function generateCode(provider: Provider, apiKey: string, request: GenerationRequest): Promise<Generation> {
  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(apiKey, request);
  }
}
