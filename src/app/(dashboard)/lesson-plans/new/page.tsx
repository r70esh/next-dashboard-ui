import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LessonPlanBuilder from "@/components/LessonPlanBuilder";

export const dynamic = "force-dynamic";

export default async function NewLessonPlanPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== "teacher") {
    redirect("/lesson-plans");
  }

  return <LessonPlanBuilder mode="create" />;
}
