import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { PasswordResetToken } from "@/lib/models";
import {
  RESET_TOKEN_COOKIE,
  MAX_CODE_ATTEMPTS,
  clientIp,
  hashResetToken,
  isRateLimited,
  updatePasswordByEmail,
} from "@/lib/passwordReset";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const clearResetCookie = (res: NextResponse) => {
  res.cookies.set(RESET_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
};

export async function POST(req: NextRequest) {
  try {
    const resetToken = req.cookies.get(RESET_TOKEN_COOKIE)?.value || "";
    const body = await req.json().catch(() => ({}));
    const newPassword = String(body.newPassword || "");

    if (!PASSWORD_PATTERN.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters with an uppercase letter, a lowercase letter and a number.",
        },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    if (isRateLimited(`reset:ip:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    await connectToDB();

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Your reset session has expired. Please request a new code." },
        { status: 400 }
      );
    }

    const token = await PasswordResetToken.findOne({
      tokenHash: hashResetToken(resetToken),
    });

    if (
      !token ||
      !token.verified ||
      token.attempts >= MAX_CODE_ATTEMPTS ||
      token.expiresAt.getTime() < Date.now()
    ) {
      return clearResetCookie(
        NextResponse.json(
          { success: false, error: "Your reset session has expired. Please request a new code." },
          { status: 400 }
        )
      );
    }

    const updated = await updatePasswordByEmail(token.email, newPassword);
    if (!updated) {
      return clearResetCookie(
        NextResponse.json(
          { success: false, error: "Account not found. Please request a new code." },
          { status: 400 }
        )
      );
    }

    await PasswordResetToken.deleteMany({ email: token.email });

    const res = NextResponse.json({ success: true });
    return clearResetCookie(res);
  } catch (e: any) {
    console.error("[password-reset] reset-password error:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
