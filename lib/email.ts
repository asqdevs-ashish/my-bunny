// ─── Email Utility ────────────────────────────────────────────
// Sends OTP emails via Nodemailer (SMTP).
// Falls back to console.log in dev mode if SMTP credentials are not set.
//
// Required env vars for production:
//   SMTP_HOST     — SMTP server (default: smtp.gmail.com)
//   SMTP_PORT     — SMTP port (default: 587)
//   SMTP_USER     — SMTP username (e.g. your Gmail address)
//   SMTP_PASS     — SMTP password (e.g. Gmail App Password)
//   EMAIL_FROM    — sender address (default: "My Bunny <noreply@mybunny.app>")

import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.EMAIL_FROM || "My Bunny <noreply@mybunny.app>";

/** Get a Nodemailer transporter (lazily created) */
let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.log(
      "ℹ️ SMTP not configured — OTP emails will be logged to console. " +
      "Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to send real emails."
    );
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for others
    auth: { user, pass },
  });

  return _transporter;
}

/** Verify SMTP connection (call once at startup) */
export async function verifySmtpConnection(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP connection verification failed:", error);
    return false;
  }
}

/**
 * Send an OTP verification email.
 * Returns true if sent successfully (or logged in dev mode).
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const transporter = getTransporter();

  // Dev mode — just log the OTP to console
  if (!transporter) {
    console.log(`\n📧 ═══════════════════════════════════════════`);
    console.log(`   OTP for ${email}: ${otp}`);
    console.log(`   (Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to send real emails)`);
    console.log(`═══════════════════════════════════════════════\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Your My Bunny verification code",
      html: otpEmailTemplate(otp),
    });

    return true;
  } catch (error) {
    console.error("Failed to send OTP email via Nodemailer:", error);
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
