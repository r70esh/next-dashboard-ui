import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDB from "@/lib/db";
import { LessonPlan } from "@/lib/models";
import LessonPlanBuilder from "@/components/LessonPlanBuilder";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditLessonPlanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  await connectToDB();
  const plan = await LessonPlan.findById(params.id);
  if (!plan) notFound();

  // Only the owner teacher can edit. Admin = view-only.
  if (role === "admin" || role !== "teacher") {
    redirect(`/lesson-plans/${params.id}`);
  }
  if (plan.ownerId !== userId) {
    return (
      <div className="m-6 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Lock className="h-8 w-8 text-slate-300" />
        <h1 className="text-base font-bold text-slate-800">Not your lesson plan</h1>
        <p className="text-xs text-slate-500">Only the owner can edit this lesson plan. You can view it as a reference.</p>
        <a href={`/lesson-plans/${params.id}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
          Go to plan
        </a>
      </div>
    );
  }

  const plain = JSON.parse(JSON.stringify(plan));
  plain.id = plan._id.toString();

  return <LessonPlanBuilder mode="edit" planId={params.id} initial={plain} />;
}
