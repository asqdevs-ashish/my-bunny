import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient | null {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn(
        "⚠️ DATABASE_URL not set. Database features will be unavailable."
      );
      return null;
    }

    const adapter = new PrismaPg({ connectionString: url });
    const client = new PrismaClient({ adapter });
    // ⚠️ Connection pooling is handled by the DATABASE_URL itself:
    //   - Neon: pooled URL has ?pgbouncer=true (PgBouncer on server side)
    //   - Supabase: pooled URL uses port 6543 (Supavisor on server side)
    //
    // Migrations ke liye "DATABASE_URL_UNPOOLED" env var use karo
    // (direct URL without pooler). Example:
    //   DATABASE_URL=postgresql://...@ep-xxx-pooler.aws.neon.tech/db?pgbouncer=true
    //   DATABASE_URL_UNPOOLED=postgresql://...@ep-xxx.aws.neon.tech/db

    return client;
  } catch (error) {
    console.warn(
      "⚠️ PrismaClient initialization failed. Database features will be unavailable.",
      error instanceof Error ? error.message : ""
    );
    return null;
  }
}

export function getPrisma(): PrismaClient | null {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

// Fallback for code that imports prisma directly
// This will be lazily initialized on first access
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma();
    if (!client) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          `⚠️ Prisma accessed (${String(prop)}) but not initialized`
        );
      }
      return async () => {
        throw new Error("Database not available");
      };
    }
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export { prismaProxy as prisma };
