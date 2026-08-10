"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const RESEND_SECONDS = 60;

const maskEmail = (email: string) =>
  email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`);

export default function VerifyCodePage() {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pw_reset_email") || "";
    setEmail(stored);
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const verify = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/reset-password");
      } else {
        setError(json.error || "Invalid code. Please try again.");
        setDigits(Array(6).fill(""));
        inputs.current[0]?.focus();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    verify(code);
  };

  const handleResend = async () => {
    if (!email) {
      router.push("/forgot-password");
      return;
    }
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCountdown(RESEND_SECONDS);
        setDigits(Array(6).fill(""));
        inputs.current[0]?.focus();
      } else {
        setError(json.error || "Unable to resend. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Verify Code</h1>
          <p className="text-xs text-slate-300 mt-1">MAHANKAL School Management</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✉️</div>
            <h2 className="text-lg font-bold text-slate-800">Enter verification code</h2>
            <p className="text-xs text-slate-500 mt-1">
              {email ? (
                <>
                  We sent a 6-digit code to <span className="font-semibold text-slate-700">{maskEmail(email)}</span>
                </>
              ) : (
                <>Please enter the code sent to your email</>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-extrabold text-slate-800 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-sky-600 bg-slate-50 focus:bg-white transition"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 mt-1 bg-sky-600 hover:bg-sky-700"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center text-xs text-slate-500">
              {countdown > 0 ? (
                <>Resend code in <span className="font-bold text-slate-700">{countdown}s</span></>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="cursor-pointer text-sky-600 hover:text-sky-800 font-bold underline disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>

            <div className="text-center text-xs text-slate-500 mt-1">
              <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700 underline font-medium">
                Use a different email
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
