import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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

        const gfEmail = process.env.GF_EMAIL;
        const gfPassword = process.env.GF_PASSWORD;

        if (!gfEmail || !gfPassword) {
          console.error("Missing GF_EMAIL or GF_PASSWORD in environment");
          return null;
        }

        if (credentials.email as string !== gfEmail) return null;

        // Compare password using bcrypt (plaintext .env → hash comparison)
        const isValid = await bcrypt.compare(
          credentials.password as string,
          gfPassword
        );

        // Also support non-hashed password for convenience
        const isExactMatch = credentials.password as string === gfPassword;

        if (!isValid && !isExactMatch) return null;

        return {
          id: "1",
          name: "My Love",
          email: gfEmail,
        };
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
  secret: process.env.NEXTAUTH_SECRET,
});
