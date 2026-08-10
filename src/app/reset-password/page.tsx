"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const passwordChecks = (pwd: string) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /\d/.test(pwd),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const checks = passwordChecks(password);
  const allPass = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        sessionStorage.removeItem("pw_reset_email");
        router.push("/password-reset-success");
      } else {
        setError(json.error || "Something went wrong. Please try again.");
        if (res.status === 400 && /session|expired|new code|account not found/i.test(json.error || "")) {
          setSessionExpired(true);
        }
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
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Set New Password</h1>
          <p className="text-xs text-slate-300 mt-1">MAHANKAL School Management</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🛡️</div>
            <h2 className="text-lg font-bold text-slate-800">Create a new password</h2>
            <p className="text-xs text-slate-500 mt-1">Your code is verified. Choose a strong password.</p>
          </div>

          {sessionExpired && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3 rounded-xl mb-4">
              Your reset session has expired. Please{" "}
              <Link href="/forgot-password" className="underline font-bold">
                request a new code
              </Link>
              .
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="text-xs text-sky-600 hover:underline font-medium cursor-pointer"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { ok: checks.length, label: "8+ characters" },
                { ok: checks.upper, label: "Uppercase letter" },
                { ok: checks.lower, label: "Lowercase letter" },
                { ok: checks.number, label: "Number" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1.5 rounded-lg border ${
                    item.ok
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-slate-400 bg-slate-50 border-slate-200"
                  }`}
                >
                  <span>{item.ok ? "✓" : "○"}</span>
                  {item.label}
                </div>
              ))}
            </div>

            {error && !sessionExpired && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allPass}
              className="cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 mt-1 bg-sky-600 hover:bg-sky-700"
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>

            <div className="text-center text-xs text-slate-500 mt-2">
              <Link href="/sign-in" className="text-sky-600 hover:text-sky-800 font-bold underline ml-1">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
