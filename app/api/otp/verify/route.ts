import { NextRequest } from "next/server";
import { verifyOTP } from "@/lib/otp";

/**
 * POST /api/otp/verify
 *
 * Verify an OTP code sent to the given email.
 * Expects: { email, code }
 * Returns: { success: boolean, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (normalizedCode.length !== 6 || !/^\d{6}$/.test(normalizedCode)) {
      return Response.json(
        { error: "Invalid code format. Please enter a 6-digit code." },
        { status: 400 }
      );
    }

    const result = await verifyOTP(normalizedEmail, normalizedCode);

    if (!result.valid) {
      return Response.json(
        { error: result.error || "Invalid or expired code. Please try again." },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
