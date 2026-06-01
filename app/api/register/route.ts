import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/register
 *
 * Create a new user account.
 * Expects: { name, email, password }
 * Returns: { user: { id, name, email } }
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    if (normalizedEmail.length < 3) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if ((password as string).length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if ((name as string).trim().length < 1) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const db = prisma;
    if (!db) {
      return Response.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password as string, 10);

    const user = await db.user.create({
      data: {
        name: (name as string).trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
