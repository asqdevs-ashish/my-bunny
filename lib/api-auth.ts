import { auth } from "./auth";
import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Create a JWT token for the mobile app user.
 * Token expires in 30 days.
 */
export async function createToken(user: ApiUser): Promise<string> {
  return new SignJWT({ sub: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("my-bunny")
    .setAudience("my-bunny-mobile")
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(getSecretKey());
}

/**
 * Verify a JWT token and return the user payload.
 */
export async function verifyToken(token: string): Promise<ApiUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "my-bunny",
      audience: "my-bunny-mobile",
    });
    return {
      id: payload.sub as string,
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Unified auth: tries Bearer JWT token first (for mobile app),
 * then falls back to NextAuth session (for web browser).
 *
 * Pass the `request` object so Bearer token can be extracted.
 * If `request` is omitted, falls directly to NextAuth.
 */
export async function getApiUser(request?: Request): Promise<ApiUser | null> {
  // 1. Try Bearer token (for mobile app)
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const user = await verifyToken(token);
      if (user) return user;
    }
  }

  // 2. Fall back to NextAuth session (for web browser)
  try {
    const session = await auth();
    if (session?.user) {
      return {
        id: session.user.id as string,
        name: session.user.name as string,
        email: session.user.email as string,
      };
    }
  } catch {
    // NextAuth may not be available in some environments
  }

  return null;
}

