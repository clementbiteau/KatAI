import "server-only";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { PROVIDERS, type Provider, type ProviderKeyStatus } from "../../providers.ts";
import { getAdminDb } from "../firebase-admin.ts";
import type { EncryptedKey } from "../key-encryption.ts";

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

// One key per user and provider: saving again replaces the previous key (H3, CA2.3).
export async function saveProviderKey(uid: string, provider: Provider, encrypted: EncryptedKey): Promise<ProviderKeyStatus> {
  const document = keyDocument(uid, provider);
  await document.set({ uid, provider, ...encrypted, updatedAt: FieldValue.serverTimestamp() });
  const updatedAt = (await document.get()).get("updatedAt") as Timestamp;
  return { provider, configured: true, updatedAt: updatedAt.toDate().toISOString() };
}

export async function deleteProviderKey(uid: string, provider: Provider): Promise<ProviderKeyStatus> {
  await keyDocument(uid, provider).delete();
  return { provider, configured: false, updatedAt: null };
}

// Encrypted key for a model call (T14): only the server ever reads it (S3).
export async function readProviderKey(uid: string, provider: Provider): Promise<EncryptedKey | null> {
  const snapshot = await keyDocument(uid, provider).get();
  if (!snapshot.exists) return null;
  const { ciphertext, iv, authTag, keyVersion } = snapshot.data() as EncryptedKey;
  return { ciphertext, iv, authTag, keyVersion };
}
