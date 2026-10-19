import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { PROVIDERS, type Provider } from "../../providers.ts";
import { getAdminDb } from "../firebase-admin.ts";

export type ProviderKeyStatus = { provider: Provider; configured: boolean; updatedAt: string | null };

function keyDocument(uid: string, provider: Provider) {
  return getAdminDb().doc(`providerKeys/${uid}_${provider}`);
}

// Only says whether each key exists and when it was saved: never any part of the key (CA2.2).
export async function listProviderKeyStatuses(uid: string): Promise<ProviderKeyStatus[]> {
  const snapshots = await getAdminDb().getAll(...PROVIDERS.map((provider) => keyDocument(uid, provider)));
  return PROVIDERS.map((provider, index) => {
    const snapshot = snapshots[index];
    const updatedAt = snapshot?.exists ? (snapshot.get("updatedAt") as Timestamp | undefined) : undefined;
    return { provider, configured: Boolean(snapshot?.exists), updatedAt: updatedAt?.toDate().toISOString() ?? null };
  });
}
