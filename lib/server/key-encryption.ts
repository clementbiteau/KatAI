import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption of users' provider keys (docs/adr/0004-chiffrement-des-cles.md).
// The associated data binds a ciphertext to one user and one provider.

export type EncryptedKey = { ciphertext: string; iv: string; authTag: string; keyVersion: number };

function currentVersion(): number {
  return Number(process.env.KEY_ENCRYPTION_KEY_VERSION || "1");
}

// The current master key, or the previous one while a rotation is in progress.
function masterKey(version: number): Buffer {
  const encoded = version === currentVersion() ? process.env.KEY_ENCRYPTION_KEY : process.env.KEY_ENCRYPTION_KEY_PREVIOUS;
  if (!encoded) throw new Error(version === currentVersion() ? "KEY_ENCRYPTION_KEY is not configured." : "Unknown key version.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("KEY_ENCRYPTION_KEY must be 32 bytes.");
  return key;
}

export function encryptProviderKey(plaintext: string, associatedData: string): EncryptedKey {
  const keyVersion = currentVersion();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(keyVersion), iv);
  cipher.setAAD(Buffer.from(associatedData, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion,
  };
}

// Throws if the ciphertext, its tag or its associated data was changed.
export function decryptProviderKey(encrypted: EncryptedKey, associatedData: string): string {
  const decipher = createDecipheriv("aes-256-gcm", masterKey(encrypted.keyVersion), Buffer.from(encrypted.iv, "base64"));
  decipher.setAAD(Buffer.from(associatedData, "utf8"));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, "base64")), decipher.final()]).toString("utf8");
}
