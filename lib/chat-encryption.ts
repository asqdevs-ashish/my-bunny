/**
 * Chat Message Encryption Utility
 *
 * Uses AES-256-GCM to encrypt chat messages before storing them in the database.
 * This ensures that even if the database is compromised, chat contents remain unreadable.
 *
 * How it works:
 *   1. Encrypt: plaintext → random IV + ciphertext + auth tag → base64-encoded string
 *   2. Decrypt: base64 string → IV + ciphertext + auth tag → plaintext
 *
 * The encryption key is derived from CHAT_ENCRYPTION_KEY env var (must be 32 hex chars = 16 bytes for AES-256).
 * If CHAT_ENCRYPTION_KEY is not set, messages are stored in plaintext (backward compatible).
 *
 * Format of encrypted messages:
 *   ENC:<base64(IV + authTag + ciphertext)>
 *
 * Unencrypted messages are passed through as-is (for backward compatibility with existing data).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/** Prefix for encrypted messages so we can distinguish them from plaintext */
const ENC_PREFIX = "ENC:";

/**
 * Get the encryption key from environment variable.
 * The key must be a 32-byte hex string (64 hex characters).
 * Returns null if not configured.
 */
function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.CHAT_ENCRYPTION_KEY;
  if (!keyHex) return null;

  try {
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== KEY_LENGTH) {
      console.warn(
        `CHAT_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars). Got ${key.length} bytes.`
      );
      return null;
    }
    return key;
  } catch {
    console.warn("CHAT_ENCRYPTION_KEY is not a valid hex string. Chat encryption disabled.");
    return null;
  }
}

/**
 * Encrypt a plaintext string.
 * Returns the encrypted string with ENC: prefix, or the original text if encryption is not configured.
 */
export function encryptMessage(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  if (!key) return plaintext; // No encryption key configured — store as-is

  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Format: iv (16) + authTag (16) + ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return ENC_PREFIX + combined.toString("base64");
  } catch (error) {
    console.error("Encryption failed:", error);
    return plaintext; // Fallback to plaintext on error
  }
}

/**
 * Decrypt an encrypted message string.
 * Returns the original plaintext, or the input as-is if it wasn't encrypted.
 */
export function decryptMessage(encrypted: string): string {
  if (!encrypted) return encrypted;

  // Not encrypted — backward compatible with existing data
  if (!encrypted.startsWith(ENC_PREFIX)) return encrypted;

  const key = getEncryptionKey();
  if (!key) {
    console.warn("Cannot decrypt — CHAT_ENCRYPTION_KEY not configured.");
    return "[🔒 Encrypted — Key not configured]";
  }

  try {
    const raw = Buffer.from(encrypted.slice(ENC_PREFIX.length), "base64");

    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[🔒 Decryption Error]";
  }
}

/**
 * Generate a random 32-byte hex string suitable for use as CHAT_ENCRYPTION_KEY.
 * Run this once and add the output to your .env file.
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}
