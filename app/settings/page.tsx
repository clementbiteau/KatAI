import type { Metadata } from "next";
import { RequireAuth } from "../../components/auth/require-auth.tsx";

export const metadata: Metadata = { title: "Settings · KatAI" };

// Provider keys (task T11) will be managed here.
export default function SettingsPage() {
  return (
    <main className="page">
      <h1>Settings</h1>
      <RequireAuth>
        <p>Your model provider keys will be managed here.</p>
      </RequireAuth>
    </main>
  );
}
