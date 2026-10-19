"use client";

import { useState, type FormEvent } from "react";
import { authorizedFetch } from "../../lib/api-client.ts";
import { PROVIDER_NAMES, validateProviderKey, type ProviderKeyStatus } from "../../lib/providers.ts";

type Props = { status: ProviderKeyStatus; onStatusChange: (status: ProviderKeyStatus) => void };

function describeStatus(status: ProviderKeyStatus): string {
  if (!status.configured || !status.updatedAt) return "Not configured";
  const date = new Date(status.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `Configured on ${date}`;
}

// One provider's key: the field is write-only. A saved key is never shown again,
// not even partially (CA2.2).
export function ProviderKeyForm({ status, onStatusChange }: Props) {
  const name = PROVIDER_NAMES[status.provider];
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const send = async (request: Promise<Response>) => {
    setPending(true);
    setError(null);
    const response = await request;
    const body = (await response.json()) as ProviderKeyStatus & { error?: string };
    if (response.ok) {
      setValue("");
      onStatusChange(body);
    } else {
      setError(body.error ?? "Something went wrong. Please try again.");
    }
    setPending(false);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validateProviderKey(value);
    if (invalid) {
      setError(invalid);
      return;
    }
    void send(authorizedFetch("/api/keys", { method: "POST", body: { provider: status.provider, key: value } }));
  };

  return (
    <form className="form provider-key" onSubmit={handleSave} noValidate>
      <h2>{name}</h2>
      <p className="provider-key-status">{describeStatus(status)}</p>
      <label>
        {name} API key
        <input type="password" autoComplete="off" spellCheck={false} value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="provider-key-actions">
        <button type="submit" disabled={pending}>
          Save key
        </button>
        {status.configured && (
          <button type="button" disabled={pending} onClick={() => send(authorizedFetch(`/api/keys?provider=${status.provider}`, { method: "DELETE" }))}>
            Delete key
          </button>
        )}
      </div>
    </form>
  );
}
