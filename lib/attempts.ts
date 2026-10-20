import type { Provider } from "./providers.ts";

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
