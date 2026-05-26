import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Wraps a promise with a timeout so it doesn't hang forever.
 * If the promise doesn't settle within `ms` milliseconds, it rejects with a timeout error.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  // Prevent unhandled rejection if the original promise rejects after the timeout fires
  promise.catch(() => {});
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`DB ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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

        // Try to find user in database (with 5s timeout so it doesn't hang on Vercel)
        try {
          const db = prisma;
          if (db) {
            const user = await withTimeout(
              db.user.findUnique({ where: { email } }),
              5000,
              "findUnique"
            );

            if (user) {
              // Compare password
              const isValid = await bcrypt.compare(password, user.password);
              if (isValid) {
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                };
              }
              // If DB user exists but password mismatch, continue to env fallback
            }
          }
        } catch (error) {
          console.error("DB auth failed, falling back to env vars:", error);
        }

        // Fallback: check against environment variables (for initial setup)
        const myEmail = process.env.MY_EMAIL || process.env.GF_EMAIL;
        const myPassword = process.env.MY_PASSWORD || process.env.GF_PASSWORD;
        const partnerEmail = process.env.PARTNER_EMAIL;
        const partnerPassword = process.env.PARTNER_PASSWORD;

        let fallbackUser = null;

        // Check if this is user 1 (My Love)
        if (myEmail && email === myEmail.trim().toLowerCase()) {
          const isValid =
            password === myPassword ||
            (myPassword ? await bcrypt.compare(password, myPassword).catch(() => false) : false);
          if (isValid) {
            fallbackUser = { name: "My Love", email: myEmail };
          }
        }

        // Check if this is user 2 (Partner)
        if (partnerEmail && email === partnerEmail.trim().toLowerCase()) {
          const isValid =
            password === partnerPassword ||
            (partnerPassword ? await bcrypt.compare(password, partnerPassword).catch(() => false) : false);
          if (isValid) {
            fallbackUser = { name: "Partner", email: partnerEmail };
          }
        }

        if (fallbackUser) {
          // Resolve or create in DB to get a real ID (with 5s timeout)
          try {
            const db = prisma;
            if (db) {
              const user = await withTimeout(
                db.user.upsert({
                  where: { email: fallbackUser.email },
                  update: { name: fallbackUser.name },
                  create: {
                    name: fallbackUser.name,
                    email: fallbackUser.email,
                    password: await bcrypt.hash(password, 10),
                  },
                }),
                5000,
                "upsert"
              );
              return {
                id: user.id,
                name: user.name,
                email: user.email,
              };
            }
          } catch (error) {
            console.error("Failed to sync fallback user to DB:", error);
          }

          // Return with static ID if DB is unavailable or upsert failed
          // This ensures login works even when Prisma/Database is down
          return {
            id: fallbackUser.email === myEmail ? "1" : "2",
            name: fallbackUser.name,
            email: fallbackUser.email,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      } else if (token.id) {
        // Refresh user info from DB if possible (with 3s timeout)
        try {
          const db = prisma;
          if (db && token.id !== "1" && token.id !== "2") {
            const dbUser = await withTimeout(
              db.user.findUnique({ where: { id: token.id as string } }),
              3000,
              "jwt-findUnique"
            );
            if (dbUser) {
              token.name = dbUser.name;
              token.email = dbUser.email;
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
