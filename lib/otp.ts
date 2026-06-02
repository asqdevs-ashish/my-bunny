// ─── In-Memory OTP Store ──────────────────────────────────────
// Simple OTP store with 5-minute TTL and max 5 attempts.
// Works for single-server deployments.
// For multi-instance (e.g. serverless), consider using Redis or DB.

interface OtpEntry {
  code: string;
  expiresAt: number;
  createdAt: number;
  email: string;
  attempts: number;
}

const MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 30_000; // 30 seconds between sends

const otpStore = new Map<string, OtpEntry>();

/** Generate a random 6-digit OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store an OTP for the given email (5 min TTL) */
export function storeOTP(email: string, code: string): void {
  const normalized = email.toLowerCase().trim();
  const now = Date.now();
  otpStore.set(normalized, {
    code,
    email: normalized,
    expiresAt: now + OTP_TTL_MS,
    createdAt: now,
    attempts: 0,
  });
}

/** Verify OTP for the given email. Returns true if valid, and deletes the entry. */
export function verifyOTP(email: string, code: string): { valid: boolean; error?: string } {
  const normalized = email.toLowerCase().trim();
  const entry = otpStore.get(normalized);

  if (!entry) {
    return { valid: false, error: "No verification code found. Please request a new one." };
  }

  // Expired
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, error: "Code has expired. Please request a new one." };
  }

  // Max attempts exceeded
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalized);
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  entry.attempts++;

  // Wrong code
  if (entry.code !== code) {
    return { valid: false, error: `Invalid code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
  }

  // Valid — delete after use
  otpStore.delete(normalized);
  return { valid: true };
}

/** Check if an OTP was recently sent (within last 30 seconds — rate limit) */
export function wasRecentlySent(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const entry = otpStore.get(normalized);
  if (!entry) return false;
  return Date.now() - entry.createdAt < RATE_LIMIT_MS;
}
