import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/api-auth";

/**
 * POST /api/login
 *
 * Login endpoint for the mobile app.
 * Validates email/password and returns { user, token } for Bearer auth.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    const db = prisma;
    if (!db) {
      return Response.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password as string, user.password);
    if (!isValid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
