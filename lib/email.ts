// ─── Email Utility ────────────────────────────────────────────
// Sends OTP emails via Resend API.
// Falls back to console.log in dev mode if RESEND_API_KEY is not set.

const FROM_EMAIL = process.env.EMAIL_FROM || "My Bunny <noreply@mybunny.app>";

/**
 * Send an OTP verification email.
 * Returns true if sent successfully (or logged in dev mode).
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Dev mode — just log the OTP to console
  if (!resendApiKey) {
    console.log(`\n📧 ═══════════════════════════════════════════`);
    console.log(`   OTP for ${email}: ${otp}`);
    console.log(`   (Set RESEND_API_KEY to send emails in production)`);
    console.log(`═══════════════════════════════════════════════\n`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Your My Bunny verification code",
        html: otpEmailTemplate(otp),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error("Failed to send OTP email:", res.status, errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

/** Beautiful OTP email template */
function otpEmailTemplate(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#fffbf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:400px;margin:40px auto;padding:0;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#f59e0b);margin-bottom:16px;">
        <span style="font-size:28px;">💕</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#1a1a1a;">My Bunny</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#666;">Your wellness companion</p>
    </div>

    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
      <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1a1a1a;text-align:center;">
        Verify your email
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:#666;text-align:center;line-height:1.5;">
        Use the code below to verify your account. This code expires in <strong>5 minutes</strong>.
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:8px;color:#f43f5e;background:#fff5f5;padding:16px 32px;border-radius:12px;border:2px dashed #fecdd3;">
          ${otp}
        </div>
      </div>

      <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.4;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#ccc;text-align:center;">
      Made with ❤️ by My Bunny
    </p>
  </div>
</body>
</html>`;
}
