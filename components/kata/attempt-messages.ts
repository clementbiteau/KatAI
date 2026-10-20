// What the user reads when a model call fails (spec CA4.5, CA4.6; categories in ADR 0005).
const MESSAGES: Record<string, string> = {
  "key-refused": "Anthropic refused your API key. Check it in Settings.",
  "insufficient-credit": "Your Anthropic account has no credit left.",
  "model-unavailable": "This model is not available for your key.",
  "provider-rate-limit": "Anthropic's rate limit was reached. Wait a moment and try again.",
  "provider-unavailable": "Anthropic is unavailable right now. Try again later.",
  timeout: "The model did not answer within 60 seconds. Try again.",
  "provider-unreachable": "Anthropic could not be reached. Check your connection and try again.",
  "request-refused": "Anthropic rejected the request.",
  "model-refused": "The model declined this request. Rephrase your specification.",
};

export function describeErrorCategory(category: string): string {
  return MESSAGES[category] ?? "The model call failed. Try again.";
}
