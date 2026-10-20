// Model providers users can connect, in display order (closed list, docs/adr/0005).
// Tranche 1 supports Anthropic only; OpenAI was moved to Could on 2026-10-20 (docs/intent.md).
export const PROVIDERS = ["anthropic"] as const;

export type Provider = (typeof PROVIDERS)[number];

// What the API returns about a key: whether it exists and when it was saved, never the key.
export type ProviderKeyStatus = { provider: Provider; configured: boolean; updatedAt: string | null };

export const PROVIDER_NAMES: Record<Provider, string> = { anthropic: "Anthropic" };

// Closed list of models per provider, the first one being the default (docs/adr/0005).
export const PROVIDER_MODELS: Record<Provider, readonly { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
    { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
  ],
};

export function isSupportedModel(provider: Provider, model: unknown): model is string {
  return PROVIDER_MODELS[provider].some((candidate) => candidate.id === model);
}

export function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

// Shape check only (CA2.5): KatAI never calls a provider just to test a key.
export function validateProviderKey(value: string): string | null {
  if (value.length === 0) return "Paste your API key.";
  if (/\s/.test(value)) return "An API key cannot contain spaces.";
  if (value.length < 20 || value.length > 300) {
    return "This does not look like an API key: it should be 20 to 300 characters long.";
  }
  return null;
}
