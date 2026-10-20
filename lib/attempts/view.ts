import type { Provider } from "../providers.ts";

// Shape of an attempt as the API returns it (docs/adr/0002). Never contains a provider key.

export type AttemptStatus = "generated" | "done" | "error";

export type AttemptResult = {
  passed: number;
  total: number;
  tests: { label: string; status: "passed" | "failed" | "timeout" }[];
};

export type AttemptView = {
  id: string;
  kataId: string;
  randoriId: string | null;
  provider: Provider;
  model: string;
  servedModel: string | null;
  spec: string;
  code: string | null;
  status: AttemptStatus;
  errorCategory: string | null;
  truncated: boolean;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
  result: AttemptResult | null;
};

// Builds the view from a stored attempt, for the server (Admin SDK) and the browser
// (client SDK) alike. Unknown fields, such as httpStatus, stay out of the view.
export function attemptViewFromData(id: string, data: Record<string, unknown>, createdAt: string): AttemptView {
  return {
    id,
    kataId: data.kataId as string,
    randoriId: (data.randoriId as string | null) ?? null,
    provider: data.provider as Provider,
    model: data.model as string,
    servedModel: (data.servedModel as string | null) ?? null,
    spec: data.spec as string,
    code: (data.code as string | null) ?? null,
    status: data.status as AttemptStatus,
    errorCategory: (data.errorCategory as string | null) ?? null,
    truncated: Boolean(data.truncated),
    latencyMs: (data.latencyMs as number) ?? 0,
    inputTokens: (data.inputTokens as number | null) ?? null,
    outputTokens: (data.outputTokens as number | null) ?? null,
    createdAt,
    result: (data.result as AttemptResult | null) ?? null,
  };
}
