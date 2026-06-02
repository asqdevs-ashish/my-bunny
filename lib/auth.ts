import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Wraps a promise with a timeout so it doesn't hang forever.
 * If the promise doesn't settle within `ms` milliseconds, it rejects with a timeout error.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  promise.catch(() => {});
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`DB ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const authProviders: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = (credentials.email as string).trim().toLowerCase();
      const password = credentials.password as string;

      try {
        const db = prisma;
        if (!db) return null;

        const user = await withTimeout(
          db.user.findUnique({ where: { email } }),
          5000,
          "findUnique"
        );

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: (user as unknown as { image?: string | null }).image ?? undefined,
        };
      } catch (error) {
        console.error("DB auth failed:", error);
        return null;
      }
    },
  }),
];

// Only add Google provider if credentials are configured
if (googleClientId && googleClientSecret) {
  authProviders.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.info("ℹ️ Google OAuth not configured — skipping Google provider");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: authProviders,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, create or update user in DB
      if (account?.provider === "google" && user.email) {
        try {
          const db = prisma;
          if (db) {
            await db.user.upsert({
              where: { email: user.email },
              update: {
                name: user.name || "User",
                image: user.image || undefined,
              },
              create: {
                name: user.name || "User",
                email: user.email,
                image: user.image || undefined,
                password: await bcrypt.hash(
                  `google-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  10
                ),
              },
            });
          }
        } catch (error) {
          console.error("Failed to upsert Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image ?? undefined;
      } else if (token.email) {
        // Refresh user info from DB if possible
        try {
          const db = prisma;
          if (db) {
            const dbUser = await withTimeout(
              db.user.findUnique({ where: { email: token.email as string } }),
              3000,
              "jwt-findUnique"
            );
            if (dbUser) {
              token.id = dbUser.id;
              token.name = dbUser.name;
              token.email = dbUser.email;
              token.image = dbUser.image ?? undefined;
            }
          }
        } catch {
          // ignore
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.image ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});
