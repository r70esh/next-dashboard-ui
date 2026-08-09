"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { changeUserPassword, getTeacherStatus } from "@/lib/actions";

type Role = "admin" | "teacher" | "student" | "parent";

const roleData: Record<Role, { label: string; icon: string; placeholder: string; btnColor: string; activeClass: string }> = {
  admin: {
    label: "Admin",
    icon: "👤",
    placeholder: "admin@school.com",
    btnColor: "bg-purple-600 hover:bg-purple-700",
    activeClass: "border-purple-600 bg-purple-100 text-purple-900 ring-2 ring-purple-400 font-bold",
  },
  teacher: {
    label: "Teacher",
    icon: "📚",
    placeholder: "teacher@school.com",
    btnColor: "bg-sky-600 hover:bg-sky-700",
    activeClass: "border-sky-600 bg-sky-100 text-sky-900 ring-2 ring-sky-400 font-bold",
  },
  student: {
    label: "Student",
    icon: "🎒",
    placeholder: "student@school.com",
    btnColor: "bg-amber-600 hover:bg-amber-700",
    activeClass: "border-amber-600 bg-amber-100 text-amber-900 ring-2 ring-amber-400 font-bold",
  },
  parent: {
    label: "Parent",
    icon: "👨‍👩‍👧",
    placeholder: "parent@school.com",
    btnColor: "bg-pink-600 hover:bg-pink-700",
    activeClass: "border-pink-600 bg-pink-100 text-pink-900 ring-2 ring-pink-400 font-bold",
  },
};

const LoginPage = () => {
  const router = useRouter();
  const [role, setRole] = useState<Role>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isChangingPassword) {
      if (!newPassword || newPassword.length < 4) {
        setError("New password must be at least 4 characters.");
        setLoading(false);
        return;
      }
      const res = await changeUserPassword(email, newPassword);
      if (res.success) {
        setSuccess("Password updated successfully! You can now log in.");
        setIsChangingPassword(false);
        setPassword(newPassword);
        setNewPassword("");
      } else {
        setError(res.error || "Failed to update password.");
      }
      setLoading(false);
      return;
    }

    try {
      if (role === "teacher") {
        const status = await getTeacherStatus(email);
        if (status.pending) {
          setError("Your account is awaiting admin approval. You will be able to log in once verified.");
          setLoading(false);
          return;
        }
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const current = roleData[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header band */}
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">MAHANKAL</h1>
          <p className="text-xs text-slate-300 mt-1">School Management Dashboard</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Role selector */}
          {!isChangingPassword && (
            <>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {(["admin", "teacher", "student", "parent"] as Role[]).map((r) => {
                  const item = roleData[r];
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRoleChange(r);
                      }}
                      className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-150 text-xs ${
                        isSelected
                          ? item.activeClass
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-2xl mb-1">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Title when changing password */}
          {isChangingPassword && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
              <p className="text-xs text-slate-500 mt-1">Enter your account email and new password</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder={current.placeholder}
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isChangingPassword ? (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(true);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-xs text-sky-600 hover:underline font-medium"
                  >
                    Forgot / Change Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 text-sm text-slate-800 bg-slate-50 focus:bg-white transition"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold p-3 rounded-xl">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-60 mt-1 ${current.btnColor}`}
            >
              {loading
                ? isChangingPassword ? "Updating Password..." : "Signing in..."
                : isChangingPassword ? "Update Password" : `Sign in as ${current.label}`}
            </button>

            {isChangingPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setError("");
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline text-center font-medium mt-1"
              >
                Back to Sign In
              </button>
            )}

            <div className="text-center text-xs text-slate-500 mt-2">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-sky-600 hover:text-sky-800 font-bold underline ml-1">
                Create an Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;