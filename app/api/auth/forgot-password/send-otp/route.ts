import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/email/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid clinical email address." },
        { status: 400 }
      );
    }

    // Check if user exists in the database
    const user = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No clinical account found registered with this email address. Please check spelling or register a new account.",
        },
        { status: 404 }
      );
    }

    // Invalidate any existing unused OTPs for this user
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: user.email,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate cryptographically secure 6-digit OTP
    const otpNumber = crypto.randomInt(100000, 999999);
    const otpString = otpNumber.toString();

    // Hash the OTP for secure database storage
    const otpHash = crypto.createHash("sha256").update(otpString).digest("hex");

    // Expiration: 10 minutes from now
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Persist OTP in database
    await prisma.passwordResetOtp.create({
      data: {
        email: user.email,
        otpHash,
        expiresAt,
        used: false,
      },
    });

    // Send the OTP via SMTP
    const emailResult = await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp: otpString,
      expiresInMinutes,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not dispatch verification email via SMTP. Please try again later.",
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}. It is valid for ${expiresInMinutes} minutes.`,
    });
  } catch (error: any) {
    console.error("[Forgot Password Send OTP Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected server error occurred while sending the OTP.",
        details: process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
