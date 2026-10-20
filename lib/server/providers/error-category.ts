import type { ErrorCategory } from "./types.ts";

// Same HTTP meaning for every provider (docs/adr/0005).
export function categorizeHttpStatus(status: number): ErrorCategory {
  if (status === 401 || status === 403) return "key-refused";
  if (status === 402) return "insufficient-credit";
  if (status === 404) return "model-unavailable";
  if (status === 408) return "timeout";
  if (status === 429) return "provider-rate-limit";
  if (status >= 500) return "provider-unavailable";
  return "request-refused";
}
