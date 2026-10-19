import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decryptProviderKey, encryptProviderKey } from "../../../lib/server/key-encryption.ts";

const providerKey = "sk-test-" + "x".repeat(40);
const masterKey = () => randomBytes(32).toString("base64");

beforeEach(() => {
  vi.stubEnv("KEY_ENCRYPTION_KEY", masterKey());
  vi.stubEnv("KEY_ENCRYPTION_KEY_VERSION", "2");
  vi.stubEnv("KEY_ENCRYPTION_KEY_PREVIOUS", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("provider key encryption (docs/adr/0004)", () => {
  it("round-trips a key and never stores it in clear", () => {
    const encrypted = encryptProviderKey(providerKey, "alice:anthropic");
    expect(encrypted.keyVersion).toBe(2);
    expect(JSON.stringify(encrypted)).not.toContain(providerKey);
    expect(decryptProviderKey(encrypted, "alice:anthropic")).toBe(providerKey);
  });

  it("uses a fresh IV for every encryption", () => {
    const first = encryptProviderKey(providerKey, "alice:anthropic");
    const second = encryptProviderKey(providerKey, "alice:anthropic");
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("refuses a ciphertext moved to another user or provider", () => {
    const encrypted = encryptProviderKey(providerKey, "alice:anthropic");
    expect(() => decryptProviderKey(encrypted, "bob:anthropic")).toThrow();
    expect(() => decryptProviderKey(encrypted, "alice:openai")).toThrow();
  });

  it("refuses a tampered ciphertext or authentication tag", () => {
    const encrypted = encryptProviderKey(providerKey, "alice:anthropic");
    const flipped = (value: string) => {
      const bytes = Buffer.from(value, "base64");
      bytes[0] = (bytes[0] ?? 0) ^ 1;
      return bytes.toString("base64");
    };
    expect(() => decryptProviderKey({ ...encrypted, ciphertext: flipped(encrypted.ciphertext) }, "alice:anthropic")).toThrow();
    expect(() => decryptProviderKey({ ...encrypted, authTag: flipped(encrypted.authTag) }, "alice:anthropic")).toThrow();
  });

  it("still decrypts keys saved with the previous master key during a rotation", () => {
    const oldMasterKey = masterKey();
    vi.stubEnv("KEY_ENCRYPTION_KEY", oldMasterKey);
    vi.stubEnv("KEY_ENCRYPTION_KEY_VERSION", "1");
    const encryptedWithOldKey = encryptProviderKey(providerKey, "alice:anthropic");

    vi.stubEnv("KEY_ENCRYPTION_KEY", masterKey());
    vi.stubEnv("KEY_ENCRYPTION_KEY_VERSION", "2");
    vi.stubEnv("KEY_ENCRYPTION_KEY_PREVIOUS", oldMasterKey);
    expect(decryptProviderKey(encryptedWithOldKey, "alice:anthropic")).toBe(providerKey);
  });

  it("fails clearly when the master key is missing or has the wrong length", () => {
    vi.stubEnv("KEY_ENCRYPTION_KEY", "");
    expect(() => encryptProviderKey(providerKey, "alice:anthropic")).toThrow("KEY_ENCRYPTION_KEY is not configured.");
    vi.stubEnv("KEY_ENCRYPTION_KEY", randomBytes(16).toString("base64"));
    expect(() => encryptProviderKey(providerKey, "alice:anthropic")).toThrow("KEY_ENCRYPTION_KEY must be 32 bytes.");
  });
});
