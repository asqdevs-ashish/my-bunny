import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, storeOTP, wasRecentlySent } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";

/**
 * POST /api/otp/send
 *
 * Send an OTP to the given email for verification during registration.
 * Expects: { email }
 * Returns: { success: boolean, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length < 5 || !normalizedEmail.includes("@")) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Rate limit: don't send if OTP was sent less than 30 seconds ago
    if (await wasRecentlySent(normalizedEmail)) {
      return Response.json(
        { error: "Please wait 30 seconds before requesting a new code" },
        { status: 429 }
      );
    }

    const db = prisma;
    if (!db) {
      return Response.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Check if email is already registered
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp);

    // Send OTP email
    const sent = await sendOTPEmail(normalizedEmail, otp);

    if (!sent) {
      return Response.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
