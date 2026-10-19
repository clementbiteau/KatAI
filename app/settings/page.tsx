import type { Metadata } from "next";
import { RequireAuth } from "../../components/auth/require-auth.tsx";
import { ProviderKeysPanel } from "../../components/settings/provider-keys-panel.tsx";

export const metadata: Metadata = { title: "Settings · KatAI" };

export default function SettingsPage() {
  return (
    <main className="page">
      <h1>Settings</h1>
      <RequireAuth>
        <ProviderKeysPanel />
      </RequireAuth>
    </main>
  );
}
