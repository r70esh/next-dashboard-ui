import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { PasswordResetToken } from "@/lib/models";
import {
  RESET_TOKEN_COOKIE,
  RESET_CODE_TTL_MINUTES,
  clientIp,
  findUserByEmail,
  generateResetCode,
  generateResetToken,
  hashResetCode,
  hashResetToken,
  isRateLimited,
} from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/mailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    if (
      isRateLimited(`forgot:email:${email}`, 3, 10 * 60 * 1000) ||
      isRateLimited(`forgot:ip:${ip}`, 5, 10 * 60 * 1000)
    ) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return NextResponse.json({ success: true });
    }

    const resetToken = generateResetToken();
    const code = generateResetCode();

    await connectToDB();
    await PasswordResetToken.deleteMany({ email });
    await PasswordResetToken.create({
      email,
      codeHash: hashResetCode(code, resetToken),
      tokenHash: hashResetToken(resetToken),
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    try {
      await sendPasswordResetEmail({ to: user.email, code });
    } catch (err) {
      console.error("[password-reset] failed to send email:", err);
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(RESET_TOKEN_COOKIE, resetToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RESET_CODE_TTL_MINUTES * 60,
    });
    return res;
  } catch (e: any) {
    console.error("[password-reset] forgot-password error:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
