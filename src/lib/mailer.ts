import nodemailer from "nodemailer";

export interface ResetEmailOptions {
  to: string;
  code: string;
}

export async function sendPasswordResetEmail({ to, code }: ResetEmailOptions) {
  const host = process.env.EMAIL_HOST;

  if (!host) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_HOST is not configured.");
    }
    console.log(`[password-reset] dev fallback — reset code for ${to}: ${code}`);
    return;
  }

  const port = Number(process.env.EMAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@mahankal.edu.np";

  await transporter.sendMail({
    from,
    to,
    subject: "Your MAHANKAL Password Reset Code",
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:32px 16px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0f172a;padding:24px;text-align:center;">
            <div style="width:48px;height:48px;border-radius:50%;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:8px;">🛡️</div>
            <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1px;">MAHANKAL</div>
            <div style="color:#cbd5e1;font-size:12px;margin-top:4px;">School Management Dashboard</div>
          </div>
          <div style="padding:28px;">
            <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px;">Password Reset Code</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Use the 6-digit code below to reset your password. It expires in
              <strong>10 minutes</strong>.
            </p>
            <div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;padding:20px;text-align:center;">
              <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#0f172a;">${code}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:20px 0 0;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
