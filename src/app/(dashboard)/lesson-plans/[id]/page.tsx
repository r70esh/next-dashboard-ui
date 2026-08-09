import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { LessonPlan } from "@/lib/models";
import PlanDocument from "@/components/lesson-plans/PlanDocument";
import PrintButton from "@/components/lesson-plans/PrintButton";
import { Pencil, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LessonPlanDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  await connectToDB();
  const plan = await LessonPlan.findById(params.id);
  if (!plan) notFound();

  const plain = JSON.parse(JSON.stringify(plan));
  const isOwner = role === "teacher" && plain.ownerId === userId;

  return (
    <div className="m-4 mt-0 flex-1 p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .lp-print, .lp-print * { visibility: visible; }
          .lp-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            Dashboard <span>/</span> Lesson Plans <span>/</span>
            <span className="font-semibold text-indigo-600">{plain.topic || "Lesson Plan"}</span>
          </p>
          <h1 className="text-xl font-bold text-slate-800">{plain.topic || "Untitled Lesson Plan"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/lesson-plans"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Plans
          </Link>
          <PrintButton />
          {isOwner && (
            <Link
              href={`/lesson-plans/${params.id}/edit`}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Plan
            </Link>
          )}
          {role === "admin" && (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500">
              Admin · View Only
            </span>
          )}
        </div>
      </div>

      {role === "admin" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
          View-only mode: admins can view all teachers&apos; lesson plans but cannot edit them.
        </div>
      )}
      {!isOwner && role === "teacher" && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-700">
          Reference view: you can view this lesson plan by {plain.ownerName}, but only the owner can edit it.
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <PlanDocument plan={plain} />
      </div>
    </div>
  );
}
