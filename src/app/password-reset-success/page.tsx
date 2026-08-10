"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PasswordResetSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Password Reset</h1>
          <p className="text-xs text-slate-300 mt-1">MAHANKAL School Management</p>
        </div>

        <div className="p-6 md:p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Password reset successful!</h2>
          <p className="text-sm text-slate-500 mt-2">
            Your password has been updated. You can now sign in with your new password.
          </p>

          <button
            onClick={() => router.push("/sign-in")}
            className="cursor-pointer w-full text-white p-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 mt-6 bg-sky-600 hover:bg-sky-700"
          >
            Sign In Now
          </button>
        </div>
      </div>
    </div>
  );
}
