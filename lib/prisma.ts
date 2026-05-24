import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient | null {
  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    const client = new PrismaClient({ adapter });
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
        console.warn(`⚠️ Prisma accessed (${String(prop)}) but not initialized`);
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
