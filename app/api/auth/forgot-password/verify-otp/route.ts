import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawOtp = typeof body?.otp === "string" ? body.otp.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid clinical email address." },
        { status: 400 }
      );
    }

    if (!rawOtp || rawOtp.length !== 6 || !/^\d{6}$/.test(rawOtp)) {
      return NextResponse.json(
        { success: false, error: "Please provide the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Password confirmation does not match. Please verify." },
        { status: 400 }
      );
    }

    // Hash the submitted OTP to check against database
    const submittedOtpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");

    // Find valid matching OTP
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: rawEmail,
        otpHash: submittedOtpHash,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification code. Please double-check the OTP or request a new one.",
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account associated with this email could not be located." },
        { status: 404 }
      );
    }

    // Hash the new password with Scrypt
    const newPasswordHash = hashPassword(newPassword);

    // Atomically update password, mark OTP as used, and revoke existing sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You may now sign in with your new credentials.",
    });
  } catch (error: any) {
    console.error("[Forgot Password Verify OTP Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected server error occurred while resetting the password.",
        details: process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
