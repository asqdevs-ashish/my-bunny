import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/api-auth";

/**
 * POST /api/auth/google-mobile
 *
 * Verifies a Google ID token from the mobile app and returns a JWT for API auth.
 * Called from the React Native app after Google OAuth.
 *
 * Body: { idToken: string }
 * Returns: { user, token }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== "string") {
      return Response.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the ID token with Google's tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error("Google token verification failed:", errorText);
      return Response.json(
        { error: "Invalid Google token" },
        { status: 401 }
      );
    }

    const payload = await verifyRes.json();

    // Verify the token belongs to our app (check audience)
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (googleClientId && payload.aud !== googleClientId) {
      console.error("Google token audience mismatch:", payload.aud);
      return Response.json(
        { error: "Invalid token audience" },
        { status: 401 }
      );
    }

    // Verify email is confirmed by Google
    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      return Response.json(
        { error: "Email not verified by Google" },
        { status: 401 }
      );
    }

    // Extract user info from the verified token
    const email: string | undefined = payload.email;
    const name: string | undefined = payload.name;
    const googleSub: string | undefined = payload.sub; // Google user ID

    if (!email) {
      return Response.json(
        { error: "No email returned from Google" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const db = prisma;
    if (!db) {
      return Response.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Find existing user by email, or create a new one
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user with Google data
      const hashedPassword = await bcrypt.hash(
        `google-${googleSub || Date.now()}-${Math.random().toString(36).slice(2)}`,
        10
      );

      user = await db.user.create({
        data: {
          name: name || "User",
          email: normalizedEmail,
          password: hashedPassword,
          image: payload.picture || null,
        },
      });
    } else {
      // Update existing user's name/image if they came from Google
      if (name || payload.picture) {
        await db.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            image: payload.picture || user.image,
          },
        });
      }
    }

    // Generate JWT token for the mobile app
    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.error("Google mobile auth error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
