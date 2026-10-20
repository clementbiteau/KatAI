import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWithAnthropic } from "../../lib/server/providers/anthropic.ts";
import type { GenerationRequest } from "../../lib/server/providers/types.ts";

// The real Anthropic SDK runs against a fake fetch: the tests see the exact request
// it would send, and no call ever reaches Anthropic.
const userKey = "sk-ant-user-" + "u".repeat(40);
const request: GenerationRequest = {
  model: "claude-opus-5-5",
  functionName: "cartTotal",
  signature: "cartTotal(lines): number",
  spec: "Sum the cart in cents.",
};

type Captured = { url: string; headers: Headers; body: Record<string, unknown> };

function fakeFetch(status: number, body: unknown, captured: Captured[] = []) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    captured.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  });
}

function message(text: string, stopReason = "end_turn", model = "claude-opus-5-5") {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model,
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    usage: { input_tokens: 120, output_tokens: 340 },
  };
}

const apiError = (type: string) => ({ type: "error", error: { type, message: "test error" } });

afterEach(() => vi.unstubAllEnvs());

describe("generateWithAnthropic", () => {
  it("sends the spec with the user's key to the fixed Anthropic address, once (S7, ADR 0005)", async () => {
    vi.stubEnv("ANTHROPIC_BASE_URL", "https://attacker.example");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-platform-key-that-must-never-be-used");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "platform-token-that-must-never-be-used");
    const captured: Captured[] = [];
    const fetch = fakeFetch(200, message("```javascript\nfunction cartTotal() { return 0; }\n```"), captured);

    const result = await generateWithAnthropic(userKey, request, { fetch });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [call] = captured;
    expect(new URL(call!.url).origin).toBe("https://api.anthropic.com");
    expect(call!.headers.get("x-api-key")).toBe(userKey);
    expect(call!.headers.get("authorization")).toBeNull();
    expect(call!.body).toMatchObject({ model: "claude-opus-5-5", max_tokens: 16000, output_config: { effort: "low" } });
    expect(JSON.stringify(call!.body)).toContain("Sum the cart in cents.");
    expect(result).toEqual({
      ok: true,
      code: "function cartTotal() { return 0; }",
      truncated: false,
      servedModel: "claude-opus-5-5",
      inputTokens: 120,
      outputTokens: 340,
      latencyMs: expect.any(Number),
    });
  });

  it("opts into the server-side fallback on Opus and Sonnet 5.5, never on Haiku 5.5", async () => {
    for (const [model, expectsFallback] of [
      ["claude-opus-5-5", true],
      ["claude-sonnet-5-5", true],
      ["claude-haiku-5-5", false],
    ] as const) {
      const captured: Captured[] = [];
      await generateWithAnthropic(userKey, { ...request, model }, { fetch: fakeFetch(200, message("```js\nx\n```", "end_turn", model), captured) });
      const beta = captured[0]!.headers.get("anthropic-beta") ?? "";
      expect(beta.includes("server-side-fallback-2026-07-01")).toBe(expectsFallback);
      expect(captured[0]!.body.fallbacks).toBe(expectsFallback ? "default" : undefined);
    }
  });

  it("records the model that actually answered after a fallback", async () => {
    const result = await generateWithAnthropic(userKey, request, {
      fetch: fakeFetch(200, message("```js\nconst cartTotal = () => 0;\n```", "end_turn", "claude-opus-4-8")),
    });
    expect(result).toMatchObject({ ok: true, servedModel: "claude-opus-4-8" });
  });

  it("flags a truncated answer and an answer without code (CA4.7, CA4.13)", async () => {
    const truncated = await generateWithAnthropic(userKey, request, { fetch: fakeFetch(200, message("```javascript\nfunction cartTotal(", "max_tokens")) });
    expect(truncated).toMatchObject({ ok: true, truncated: true });
    const noCode = await generateWithAnthropic(userKey, request, { fetch: fakeFetch(200, message("Sorry, the spec is unclear.")) });
    expect(noCode).toMatchObject({ ok: true, code: null, truncated: false });
  });

  it("reports a refusal as the model-refused category, with its token usage", async () => {
    const refused = { ...message(""), content: [], stop_reason: "refusal", stop_details: { type: "refusal", category: "cyber", explanation: null } };
    expect(await generateWithAnthropic(userKey, request, { fetch: fakeFetch(200, refused) })).toMatchObject({
      ok: false,
      category: "model-refused",
      inputTokens: 120,
    });
  });

  it.each([
    [401, "authentication_error", "key-refused"],
    [403, "permission_error", "key-refused"],
    [402, "billing_error", "insufficient-credit"],
    [404, "not_found_error", "model-unavailable"],
    [429, "rate_limit_error", "provider-rate-limit"],
    [529, "overloaded_error", "provider-unavailable"],
    [500, "api_error", "provider-unavailable"],
    [400, "invalid_request_error", "request-refused"],
  ])("maps HTTP %i (%s) to %s, without retrying (CA4.5, CA4.6)", async (status, type, category) => {
    const fetch = fakeFetch(status, apiError(type));
    expect(await generateWithAnthropic(userKey, request, { fetch })).toMatchObject({
      ok: false,
      category,
      httpStatus: status,
      providerErrorType: type,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reports a timeout and an unreachable provider", async () => {
    const hanging = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
        ),
    );
    expect(await generateWithAnthropic(userKey, request, { fetch: hanging, timeoutMs: 50 })).toMatchObject({ ok: false, category: "timeout" });
    const offline = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await generateWithAnthropic(userKey, request, { fetch: offline })).toMatchObject({ ok: false, category: "provider-unreachable" });
    expect(offline).toHaveBeenCalledTimes(1);
  });
});
