"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveTeacher, rejectTeacher } from "@/lib/actions";
import { Check, X, Loader2 } from "lucide-react";

export default function ApproveTeacherButton({
  id,
  onApproved,
}: {
  id: string;
  onApproved?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setLoading(true);
    setError("");
    const res = await fn();
    if (res.success) {
      onApproved?.();
      router.refresh();
    } else {
      setError(res.error || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          disabled={loading}
          onClick={() => run(() => approveTeacher(id))}
          className="cursor-pointer flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => {
            if (window.confirm("Rejecting this teacher will remove their account. Continue?")) {
              run(() => rejectTeacher(id));
            }
          }}
          className="cursor-pointer flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}
