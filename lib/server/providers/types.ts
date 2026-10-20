// Shared contract of the provider adapters (docs/adr/0005-appels-aux-fournisseurs.md).

export type GenerationRequest = {
  model: string;
  // Only the user's spec and the expected function: never the kata brief or tests (H2).
  spec: string;
  functionName: string;
  signature: string;
};

// Error categories recorded on an attempt (spec CA4.5, CA4.6, completed by ADR 0005).
export type ErrorCategory =
  | "key-refused"
  | "insufficient-credit"
  | "model-unavailable"
  | "provider-rate-limit"
  | "provider-unavailable"
  | "timeout"
  | "provider-unreachable"
  | "request-refused"
  | "model-refused";

type Usage = { inputTokens: number; outputTokens: number };

export type Generation =
  | ({ ok: true; code: string | null; truncated: boolean; servedModel: string; latencyMs: number } & Usage)
  | ({ ok: false; category: ErrorCategory; latencyMs: number } & Partial<Usage>);

// Test seams only: production code always uses the defaults.
export type ProviderCallOptions = { fetch?: typeof globalThis.fetch; timeoutMs?: number };
