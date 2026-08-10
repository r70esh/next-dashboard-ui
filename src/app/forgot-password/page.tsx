"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        sessionStorage.setItem("pw_reset_email", email.trim());
        router.push("/verify-code");
      } else {
        setError(json.error || "Something went wrong. Please try again.");
        if (res.status === 429) setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Forgot Password</h1>
          <p className="text-xs text-slate-300 mt-1">MAHANKAL School Management</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h2 className="text-lg font-bold text-slate-800">Reset your password</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email and we will send you a 6-digit verification code.
            </p>
          </div>

          {sent && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3 rounded-xl mb-4">
              You have tried too many times. Please wait a few minutes before requesting again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            {error && !sent && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 mt-1 bg-sky-600 hover:bg-sky-700"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>

            <div className="text-center text-xs text-slate-500 mt-2">
              Remembered your password?{" "}
              <Link href="/sign-in" className="text-sky-600 hover:text-sky-800 font-bold underline ml-1">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
