import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import { PasswordResetToken } from "@/lib/models";
import {
  RESET_TOKEN_COOKIE,
  MAX_CODE_ATTEMPTS,
  clientIp,
  hashResetCode,
  hashResetToken,
  isRateLimited,
} from "@/lib/passwordReset";

const clearResetCookie = (res: NextResponse) => {
  res.cookies.set(RESET_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
};

export async function POST(req: NextRequest) {
  try {
    const resetToken = req.cookies.get(RESET_TOKEN_COOKIE)?.value || "";
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "Please enter the 6-digit code." },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    if (isRateLimited(`verify:ip:${ip}`, 15, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    await connectToDB();

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Your reset session is invalid. Please request a new code." },
        { status: 400 }
      );
    }

    const token = await PasswordResetToken.findOne({
      tokenHash: hashResetToken(resetToken),
      verified: false,
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired code. Please request a new one." },
        { status: 400 }
      );
    }

    if (token.expiresAt.getTime() < Date.now()) {
      await PasswordResetToken.deleteOne({ _id: token._id });
      return clearResetCookie(
        NextResponse.json(
          { success: false, error: "This code has expired. Please request a new one." },
          { status: 400 }
        )
      );
    }

    if (token.attempts >= MAX_CODE_ATTEMPTS) {
      await PasswordResetToken.deleteOne({ _id: token._id });
      return clearResetCookie(
        NextResponse.json(
          { success: false, error: "Too many incorrect attempts. Please request a new code." },
          { status: 400 }
        )
      );
    }

    if (hashResetCode(code, resetToken) !== token.codeHash) {
      token.attempts += 1;
      await token.save();
      if (token.attempts >= MAX_CODE_ATTEMPTS) {
        await PasswordResetToken.deleteOne({ _id: token._id });
        return clearResetCookie(
          NextResponse.json(
            { success: false, error: "Too many incorrect attempts. Please request a new code." },
            { status: 400 }
          )
        );
      }
      return NextResponse.json(
        { success: false, error: "Incorrect code. Please try again." },
        { status: 400 }
      );
    }

    token.verified = true;
    await token.save();

    return NextResponse.json({ success: true, verified: true });
  } catch (e: any) {
    console.error("[password-reset] verify-reset-code error:", e);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
