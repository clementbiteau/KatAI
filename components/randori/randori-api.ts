import { authorizedFetch } from "../../lib/api-client.ts";
import type { RandoriView } from "../../lib/randoris/view.ts";

// Calls to /api/randoris. The server keeps the clock (docs/adr/0007).

export type RandoriAnswer =
  | { ok: true; randori: RandoriView; serverNow: string }
  | { ok: false; error: string; code?: string; randoriId?: string };

async function call(path: string, method: string, body?: unknown): Promise<RandoriAnswer> {
  const response = await authorizedFetch(path, { method, body }).catch(() => null);
  if (!response) return { ok: false, error: "You are not signed in." };
  const json = (await response.json()) as Record<string, unknown>;
  if (!response.ok) return { ok: false, error: String(json.error ?? "Something went wrong."), code: json.code as string, randoriId: json.randoriId as string };
  return { ok: true, randori: json.randori as RandoriView, serverNow: json.serverNow as string };
}

export function startRandoriRequest(kataId: string): Promise<RandoriAnswer> {
  return call("/api/randoris", "POST", { kataId, provider: "anthropic" });
}

export function fetchRandori(id: string): Promise<RandoriAnswer> {
  return call(`/api/randoris?id=${encodeURIComponent(id)}`, "GET");
}

export function abandonRandoriRequest(id: string): Promise<RandoriAnswer> {
  return call("/api/randoris", "PATCH", { randoriId: id });
}
