// Model providers users can connect, in display order (closed list, docs/adr/0005).
export const PROVIDERS = ["anthropic", "openai"] as const;

export type Provider = (typeof PROVIDERS)[number];
