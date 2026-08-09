"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteLessonPlan } from "@/lib/actions";

export default function PlanActions({ id, isOwner }: { id: string; isOwner: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    const res = await deleteLessonPlan(id);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Could not delete.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/lesson-plans/${id}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {isOwner && (
        <>
          <Link
            href={`/lesson-plans/${id}/edit`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition hover:bg-sky-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirming) handleDelete();
              else setConfirming(true);
            }}
            className={`flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition ${
              confirming ? "bg-red-600 text-white" : "bg-red-50 text-red-500 hover:bg-red-100"
            }`}
            title={confirming ? "Click again to confirm" : "Delete"}
          >
            {confirming ? "Sure?" : <Trash2 className="h-4 w-4" />}
          </button>
        </>
      )}
    </div>
  );
}
