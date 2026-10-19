"use client";

import { useEffect, useState } from "react";
import { authorizedFetch } from "../../lib/api-client.ts";
import type { ProviderKeyStatus } from "../../lib/providers.ts";
import { ProviderKeyForm } from "./provider-key-form.tsx";

// Lists the user's provider keys. Must be rendered inside RequireAuth.
export function ProviderKeysPanel() {
  const [statuses, setStatuses] = useState<ProviderKeyStatus[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authorizedFetch("/api/keys")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = (await response.json()) as { keys: ProviderKeyStatus[] };
        if (active) setStatuses(body.keys);
      })
      .catch(() => active && setLoadError("Your keys could not be loaded. Please reload the page."));
    return () => {
      active = false;
    };
  }, []);

  const replaceStatus = (next: ProviderKeyStatus) =>
    setStatuses((current) => current?.map((status) => (status.provider === next.provider ? next : status)) ?? null);

  if (loadError) return <p role="alert">{loadError}</p>;
  if (!statuses) return <p role="status">Loading your keys…</p>;
  return (
    <section aria-label="Provider keys">
      <p>
        KatAI calls your model with your own key and you pay your provider directly. Use a key dedicated to KatAI, with
        a spending limit set at your provider. Your key is encrypted on our server and never shown again.
      </p>
      {statuses.map((status) => (
        <ProviderKeyForm key={status.provider} status={status} onStatusChange={replaceStatus} />
      ))}
    </section>
  );
}
