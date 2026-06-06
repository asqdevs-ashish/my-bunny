/**
 * Environment variable validation.
 * Call `validateEnv()` during app startup to warn about missing vars.
 */

const REQUIRED_VARS = [
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
] as const;

const VARS_WITH_DEFAULTS: Record<string, string> = {
  NEXTAUTH_URL: "Inferred from Vercel deployment URL",
};

const PUSH_VARS = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
] as const;

const CRON_VARS = [
  "CRON_SECRET",
] as const;

const CLOUDINARY_VARS = [
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
] as const;

const CHAT_VARS = [
  "CHAT_ENCRYPTION_KEY",
] as const;

type EnvStatus = "ok" | "missing" | "optional";

interface EnvCheckResult {
  var: string;
  status: EnvStatus;
  note?: string;
}

export function checkEnv(): EnvCheckResult[] {
  const results: EnvCheckResult[] = [];

  for (const v of REQUIRED_VARS) {
    if (!process.env[v]) {
      results.push({ var: v, status: "missing", note: "REQUIRED — app may not work without this" });
    } else {
      results.push({ var: v, status: "ok" });
    }
  }

  for (const v of PUSH_VARS) {
    if (!process.env[v]) {
      results.push({ var: v, status: "optional", note: "Push notifications will be disabled" });
    }
  }

  for (const v of CRON_VARS) {
    if (!process.env[v]) {
      results.push({ var: v, status: "optional", note: "Cron job (cron-job.org) will not work — notifications won't arrive when app is closed" });
    }
  }

  for (const v of CLOUDINARY_VARS) {
    if (!process.env[v]) {
      results.push({ var: v, status: "optional", note: "Memory scrapbook image uploads will not work" });
    }
  }

  for (const v of CHAT_VARS) {
    if (!process.env[v]) {
      results.push({ var: v, status: "optional", note: "Chat messages will be stored as plaintext in database. Set this to encrypt at rest." });
    }
  }

  return results;
}

export function logEnvStatus() {
  if (typeof window !== "undefined") return; // Server-side only

  const results = checkEnv();
  const missing = results.filter((r) => r.status === "missing");
  const optional = results.filter((r) => r.status !== "ok");

  if (missing.length > 0) {
    console.warn("⚠️ Missing REQUIRED environment variables:");
    for (const r of missing) {
      console.warn(`   ❌ ${r.var} — ${r.note}`);
    }
  }

  if (optional.length > 0) {
    console.info("ℹ️ Optional env vars not set:");
    for (const r of optional) {
      console.info(`   ⚠️  ${r.var} — ${r.note}`);
    }
  }
}

/**
 * Whether push notifications are configured on the server side.
 */
export function isPushConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}


