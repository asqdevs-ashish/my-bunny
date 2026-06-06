// ─── Database-Backed OTP Store ────────────────────────────────
// Uses the VerificationCode table in PostgreSQL so OTPs persist
// across API route boundaries and serverless deployments.
// 5-minute TTL and max 5 attempts per code.

import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 30_000; // 30 seconds between sends

/** Generate a random 6-digit OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Store an OTP for the given email (5 min TTL) */
export async function storeOTP(email: string, code: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  // Delete any previously stored OTPs for this email
  await prisma.verificationCode.deleteMany({
    where: { email: normalized },
  });

  await prisma.verificationCode.create({
    data: {
      email: normalized,
      code,
      attempts: 0,
      expiresAt,
    },
  });
}

/** Verify OTP for the given email */
export async function verifyOTP(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const normalized = email.toLowerCase().trim();

  // Find the latest OTP entry for this email
  const entry = await prisma.verificationCode.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!entry) {
    return { valid: false, error: "No verification code found. Please request a new one." };
  }

  // Expired
  if (Date.now() > entry.expiresAt.getTime()) {
    await prisma.verificationCode.delete({ where: { id: entry.id } });
    return { valid: false, error: "Code has expired. Please request a new one." };
  }

  // Max attempts exceeded
  if (entry.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode.delete({ where: { id: entry.id } });
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  await prisma.verificationCode.update({
    where: { id: entry.id },
    data: { attempts: entry.attempts + 1 },
  });

  // Wrong code
  if (entry.code !== code) {
    return {
      valid: false,
      error: `Invalid code. ${MAX_ATTEMPTS - entry.attempts - 1} attempts remaining.`,
    };
  }

  // Valid — delete after use
  await prisma.verificationCode.delete({ where: { id: entry.id } });
  return { valid: true };
}

/** Check if an OTP was recently sent (within last 30 seconds — rate limit) */
export async function wasRecentlySent(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const entry = await prisma.verificationCode.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!entry) return false;
  return Date.now() - entry.createdAt.getTime() < RATE_LIMIT_MS;
}
