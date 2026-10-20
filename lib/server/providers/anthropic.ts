import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { categorizeHttpStatus } from "./error-category.ts";
import { buildSystemPrompt, buildUserMessage, extractCode } from "./prompt.ts";
import type { ErrorCategory, Generation, GenerationRequest, ProviderCallOptions } from "./types.ts";

// Fixed address: never taken from input or from ANTHROPIC_BASE_URL (S7).
const ANTHROPIC_BASE_URL = "https://api.anthropic.com";
const MAX_OUTPUT_TOKENS = 16000;
const TIMEOUT_MS = 60_000;
// Server-side fallback on refusal: Opus and Sonnet 5.5 support it, Haiku 5.5 does not.
const MODELS_WITH_FALLBACK = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

function categorizeAnthropicError(error: InstanceType<typeof Anthropic.APIError>): ErrorCategory {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.APIConnectionError) return "provider-unreachable";
  return categorizeHttpStatus(error.status ?? 0);
}

// One call, with the user's own key, no automatic retry (CA4.6).
export async function generateWithAnthropic(
  apiKey: string,
  request: GenerationRequest,
  options: ProviderCallOptions = {},
): Promise<Generation> {
  const client = new Anthropic({
    apiKey,
    authToken: null,
    baseURL: ANTHROPIC_BASE_URL,
    maxRetries: 0,
    timeout: options.timeoutMs ?? TIMEOUT_MS,
    fetch: options.fetch,
  });
  const started = Date.now();
  try {
    const response = await client.beta.messages.create({
      model: request.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: buildSystemPrompt(request),
      messages: [{ role: "user", content: buildUserMessage(request.spec) }],
      output_config: { effort: "low" },
      ...(MODELS_WITH_FALLBACK.has(request.model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });
    const latencyMs = Date.now() - started;
    const usage = { inputTokens: response.usage.input_tokens ?? 0, outputTokens: response.usage.output_tokens ?? 0 };
    if (response.stop_reason === "refusal") return { ok: false, category: "model-refused", latencyMs, ...usage };
    const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("\n");
    return {
      ok: true,
      code: extractCode(text),
      truncated: response.stop_reason === "max_tokens",
      servedModel: response.model,
      latencyMs,
      ...usage,
    };
  } catch (error) {
    if (!(error instanceof Anthropic.APIError)) throw error;
    return {
      ok: false,
      category: categorizeAnthropicError(error),
      latencyMs: Date.now() - started,
      ...(error.status ? { httpStatus: error.status } : {}),
      ...(error.type ? { providerErrorType: error.type } : {}),
    };
  }
}
