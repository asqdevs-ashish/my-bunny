import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
};

export async function resolveCurrentUser(sessionUser: SessionUser) {
  const db = prisma;
  if (!db) throw new Error("Database not available");

  if (sessionUser.id) {
    const byId = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (byId) return byId;
  }

  if (sessionUser.email) {
    const byEmail = await db.user.findUnique({ where: { email: sessionUser.email } });
    if (byEmail) return byEmail;
  }

  return null;
}

export async function resolveOrCreateCurrentUser(sessionUser: SessionUser) {
  const db = prisma;
  if (!db) throw new Error("Database not available");

  if (!sessionUser.email) {
    throw new Error("Session user email missing");
  }

  // Use upsert to handle concurrent creation gracefully
  const placeholderPassword = await bcrypt.hash(`temp-${Date.now()}-${Math.random()}`, 10);

  return db.user.upsert({
    where: { email: sessionUser.email },
    update: {
      name: sessionUser.name || undefined,
      image: undefined,
    },
    create: {
      name: sessionUser.name || "User",
      email: sessionUser.email,
      password: placeholderPassword,
    },
  });
}
