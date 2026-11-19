import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== "false"; // default true for 465
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || '"AyuTrace Security" <noreply@ayutrace.org>';

/**
 * AyuTrace Mailer Transporter (Google Workspace / Gmail SMTP)
 */
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

interface SendOtpParams {
  to: string;
  name?: string;
  otp: string;
  expiresInMinutes?: number;
}

/**
 * Sends a high-security Password Reset OTP verification email to the user.
 */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
  expiresInMinutes = 10,
}: SendOtpParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn(
        "[Mailer Security Notice] SMTP credentials are not configured in environment. OTP verification email not dispatched."
      );
      // In development / demo mode, return success so developers can test OTP flows without SMTP credentials
      return {
        success: true,
        messageId: "mock-otp-dispatch-id",
      };
    }
    const greeting = name ? `Hello ${name},` : "Hello,";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AyuTrace Password Reset Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" max-width="540px" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #042f2e; padding: 28px 36px; text-align: left;">
                    <div style="display: inline-block; vertical-align: middle;">
                      <div style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">AyuTrace</div>
                      <div style="color: #2dd4bf; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">Clinical Drug Traceability & Safety</div>
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 36px 28px 36px;">
                    <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.01em;">
                      Password Reset Verification Code
                    </h1>
                    
                    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                      ${greeting}
                    </p>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                      We received a request to reset the password for your clinical AyuTrace account. Use the 6-digit One-Time Password (OTP) below to authenticate your request:
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0f766e; margin-bottom: 8px;">
                        One-Time Security OTP
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; padding-left: 0.25em;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                        Valid for <strong>${expiresInMinutes} minutes</strong>
                      </div>
                    </div>

                    <!-- Warning Advisory -->
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 24px 0;">
                      <p style="font-size: 12px; line-height: 1.5; color: #991b1b; margin: 0;">
                        <strong>Security Notice:</strong> If you did not initiate this password reset, please disregard this email. Your clinical account credentials remain secure.
                      </p>
                    </div>

                    <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 24px 0 0 0;">
                      Best regards,<br>
                      <strong>AyuTrace Clinical Security & Governance Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
                    <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
                      AyuTrace Statutory Healthcare System &bull; 21 CFR Part 11 Compliant &bull; Automated System Dispatch
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: `[AyuTrace] ${otp} is your password reset code`,
      text: `${greeting}\n\nYour AyuTrace password reset code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not request this reset, please ignore this email.\n\n— AyuTrace Security Team`,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Mailer Error] Failed to send password reset OTP email:", error);
    return { success: false, error: error?.message || "Failed to dispatch email via SMTP." };
  }
}
